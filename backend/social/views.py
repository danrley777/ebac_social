from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import Comment, Post, User
from .permissions import IsOwnerOrReadOnly
from .serializers import (CommentSerializer, LoginSerializer, PostSerializer,
                          ProfileUpdateSerializer, RegisterSerializer, UserSerializer)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(pk=response.data["id"])
        response.data = {"token": Token.objects.create(user=user).key, "user": UserSerializer(user, context={"request": request}).data}
        return response

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user, context={"request": request}).data})

class ProfileView(generics.RetrieveUpdateAPIView):
    def get_object(self): return self.request.user
    def get_serializer_class(self):
        return ProfileUpdateSerializer if self.request.method in {"PUT", "PATCH"} else UserSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("username")
    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        return qs.filter(Q(username__icontains=search) | Q(display_name__icontains=search)) if search else qs

    @action(detail=True, methods=["post"])
    def follow(self, request, pk=None):
        target = self.get_object()
        if target == request.user:
            return Response({"detail": "Você não pode seguir a si mesmo."}, status=status.HTTP_400_BAD_REQUEST)
        following = request.user.following.filter(pk=target.pk).exists()
        (request.user.following.remove if following else request.user.following.add)(target)
        return Response({"following": not following, "followers_count": target.followers.count()})

    @action(detail=True)
    def followers(self, request, pk=None):
        return Response(UserSerializer(self.get_object().followers.all(), many=True, context={"request": request}).data)

    @action(detail=True)
    def following(self, request, pk=None):
        return Response(UserSerializer(self.get_object().following.all(), many=True, context={"request": request}).data)

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    queryset = Post.objects.select_related("author").prefetch_related("likes", "comments__author")
    def perform_create(self, serializer): serializer.save(author=self.request.user)

    @action(detail=False)
    def feed(self, request):
        qs = self.get_queryset().filter(author__in=request.user.following.all())
        page = self.paginate_queryset(qs)
        return self.get_paginated_response(self.get_serializer(page, many=True).data)

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        post = self.get_object()
        liked = post.likes.filter(pk=request.user.pk).exists()
        (post.likes.remove if liked else post.likes.add)(request.user)
        return Response({"liked": not liked, "likes_count": post.likes.count()})

    @action(detail=True, methods=["post"])
    def comments(self, request, pk=None):
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user, post=self.get_object())
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CommentViewSet(viewsets.GenericViewSet, generics.DestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

@api_view(["POST"])
def logout(request):
    request.auth.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
