from rest_framework import permissions
from django.shortcuts import get_object_or_404
from .models import Station

class CanViewSftpUsers(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('view_sftpuser', view.get_station())

class IsStationManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        short_name = view.kwargs.get('station_short_name') or view.kwargs.get('short_name')
        if not short_name:
            return request.user.is_superuser
            
        station = get_object_or_404(Station, short_name=short_name)
        # Check if creator or superuser
        return request.user.is_superuser or station.creator == request.user

class IsStationViewer(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        short_name = view.kwargs.get('station_short_name') or view.kwargs.get('short_name')
        if not short_name:
            return True
            
        station = get_object_or_404(Station, short_name=short_name)
        # Check if creator or superuser
        return request.user.is_superuser or station.creator == request.user
