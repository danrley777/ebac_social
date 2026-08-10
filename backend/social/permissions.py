from rest_framework.permissions import SAFE_METHODS, BasePermission

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if getattr(view, "action", None) in {"like", "comments"}:
            return True
        return request.method in SAFE_METHODS or obj.author == request.user
