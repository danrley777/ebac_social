from django.contrib.auth import authenticate, password_validation
from django.db import transaction
from rest_framework import serializers

from .models import Comment, Post, User


class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.IntegerField(source="followers.count", read_only=True)
    following_count = serializers.IntegerField(source="following.count", read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "display_name", "bio", "avatar_url", "followers_count", "following_count", "is_following")
        read_only_fields = ("id", "username", "email", "followers_count", "following_count", "is_following")

    def get_is_following(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and request.user.following.filter(pk=obj.pk).exists())


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "display_name")
        read_only_fields = ("id",)

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if not user or not user.is_active:
            raise serializers.ValidationError("Usuário ou senha inválidos.")
        attrs["user"] = user
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ("display_name", "bio", "avatar_url", "current_password", "new_password")
        extra_kwargs = {field: {"required": False} for field in ("display_name", "bio", "avatar_url")}

    def validate(self, attrs):
        new_password = attrs.get("new_password")
        if new_password:
            if not self.instance.check_password(attrs.get("current_password", "")):
                raise serializers.ValidationError({"current_password": "Senha atual incorreta."})
            password_validation.validate_password(new_password, self.instance)
        return attrs

    def update(self, instance, validated_data):
        validated_data.pop("current_password", None)
        password = validated_data.pop("new_password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ("id", "post", "author", "content", "created_at")
        read_only_fields = ("id", "post", "author", "created_at")


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ("id", "author", "content", "created_at", "updated_at", "likes_count", "comments_count", "liked_by_me", "comments")
        read_only_fields = ("id", "author", "created_at", "updated_at", "likes_count", "comments_count", "liked_by_me", "comments")

    def get_liked_by_me(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.likes.filter(pk=request.user.pk).exists())
