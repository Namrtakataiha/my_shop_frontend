from rest_framework import permissions
from .utils import is_admin, is_user


class IfAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class IfUser(permissions.BasePermission):
    def has_permission(self, request,view):
        return is_user(request.user)


class isadmin_readuser(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin(request.user)
    
    
    