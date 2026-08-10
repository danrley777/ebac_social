import pytest
from rest_framework.test import APIClient
from social.factories import PostFactory, UserFactory

pytestmark = pytest.mark.django_db

def authenticated(user=None):
    user = user or UserFactory()
    client = APIClient()
    client.force_authenticate(user)
    return client, user

def test_register_returns_token():
    response = APIClient().post("/api/auth/register/", {"username": "nova", "email": "nova@example.com", "password": "uma-senha-segura-123", "display_name": "Nova"})
    assert response.status_code == 201
    assert response.data["token"]
    assert response.data["user"]["username"] == "nova"

def test_feed_only_contains_followed_users_posts():
    client, user = authenticated()
    followed, stranger = UserFactory(), UserFactory()
    user.following.add(followed)
    expected, _ = PostFactory(author=followed), PostFactory(author=stranger)
    response = client.get("/api/posts/feed/")
    assert response.status_code == 200
    assert [post["id"] for post in response.data["results"]] == [expected.id]

def test_follow_and_unfollow():
    client, _ = authenticated()
    target = UserFactory()
    first = client.post(f"/api/users/{target.id}/follow/")
    second = client.post(f"/api/users/{target.id}/follow/")
    assert first.data["following"] is True
    assert second.data["following"] is False

def test_like_and_comment():
    client, _ = authenticated()
    post = PostFactory()
    like = client.post(f"/api/posts/{post.id}/like/")
    comment = client.post(f"/api/posts/{post.id}/comments/", {"content": "Ótima publicação!"})
    assert like.data == {"liked": True, "likes_count": 1}
    assert comment.status_code == 201
    assert comment.data["content"] == "Ótima publicação!"

def test_only_author_can_edit_post():
    client, _ = authenticated()
    post = PostFactory()
    assert client.patch(f"/api/posts/{post.id}/", {"content": "alterado"}).status_code == 403
