from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

urlpatterns = [
    path("", lambda request: JsonResponse({"name": "EBAC Social API", "status": "ok"})),
    path("health/", lambda request: JsonResponse({"status": "ok"})),
    path("admin/", admin.site.urls),
    path("api/", include("social.urls")),
]
