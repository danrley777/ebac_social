from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, LoginView, PostViewSet, ProfileView, RegisterView, UserViewSet, logout

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("posts", PostViewSet, basename="post")
router.register("comments", CommentViewSet, basename="comment")
urlpatterns = [path("auth/register/", RegisterView.as_view()), path("auth/login/", LoginView.as_view()),
               path("auth/logout/", logout), path("profile/", ProfileView.as_view())] + router.urls
