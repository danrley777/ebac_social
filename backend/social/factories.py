import factory
from factory.django import DjangoModelFactory
from .models import Comment, Post, User

class UserFactory(DjangoModelFactory):
    class Meta: model = User
    username = factory.Sequence(lambda n: f"usuario{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    display_name = factory.Faker("name", locale="pt_BR")
    password = "senha-forte-123"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        return cls._get_manager(model_class).create_user(*args, **kwargs)

class PostFactory(DjangoModelFactory):
    class Meta: model = Post
    author = factory.SubFactory(UserFactory)
    content = factory.Faker("sentence", locale="pt_BR")

class CommentFactory(DjangoModelFactory):
    class Meta: model = Comment
    post = factory.SubFactory(PostFactory)
    author = factory.SubFactory(UserFactory)
    content = factory.Faker("sentence", locale="pt_BR")
