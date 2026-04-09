from rest_framework import permissions
from .models import RolePermission

class IsBantuWaveAdmin(permissions.BasePermission):
    """
    Global permission to check if the user has a specific action allowed via their groups.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True
            
        required_action = getattr(view, 'required_action', None)
        if not required_action:
            return request.user.groups.filter(name__in=[
                'SuperAdmins', 'Commercial & Billing', 'Tech Support', 'Ad Manager', 'Content Curator'
            ]).exists()
            
        return RolePermission.objects.filter(
            group__in=request.user.groups.all(),
            action_name=required_action,
            station__isnull=True
        ).exists()

class HasStationRolePermission(permissions.BasePermission):
    """
    Permission to check if the user has a specific action allowed on a SPECIFIC station.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True
            
        station_short_name = view.kwargs.get('station_short_name') or view.kwargs.get('short_name')
        if not station_short_name:
            return False
            
        required_action = getattr(view, 'required_action', None)
        if not required_action:
            return False
            
        return RolePermission.objects.filter(
            group__in=request.user.groups.all(),
            action_name=required_action,
            station__short_name=station_short_name
        ).exists()
