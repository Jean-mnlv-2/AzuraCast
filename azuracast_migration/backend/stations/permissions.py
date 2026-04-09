from rest_framework import permissions
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Station

def has_station_permission(user, station, permission_name):
    """
    Logique centrale pour déterminer si un utilisateur a une permission spécifique sur une station.
    """
    if not user.is_authenticated:
        return False
        
    if user.is_superuser:
        return True
        
    if station.creator == user:
        return True
        
    if user.has_perm(f'stations.{permission_name}', station):
        return True
        
    # manage_station is a master permission
    if permission_name != 'manage_station' and user.has_perm('stations.manage_station', station):
        return True
        
    if station.creator and station.creator.creator == user:
        return True
        
    return False

def can_manage_station(user, station):
    return has_station_permission(user, station, 'manage_station')

def can_view_station(user, station):
    return has_station_permission(user, station, 'view_station')

class StationPermissionBase(permissions.BasePermission):
    permission_name = 'view_station'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        short_name = view.kwargs.get('station_short_name') or view.kwargs.get('short_name')
        if not short_name:
            return True
            
        station = get_object_or_404(Station, short_name=short_name)
        return has_station_permission(request.user, station, self.permission_name)

class IsStationManager(StationPermissionBase):
    permission_name = 'manage_station'

class IsStationViewer(StationPermissionBase):
    permission_name = 'view_station'

class CanManageStationProfile(StationPermissionBase):
    permission_name = 'manage_station_profile'

class CanManageMedia(StationPermissionBase):
    permission_name = 'manage_station_media'

class CanManagePlaylists(StationPermissionBase):
    permission_name = 'manage_station_playlists'

class CanManageStreamers(StationPermissionBase):
    permission_name = 'manage_station_streamers'

class CanManageMounts(StationPermissionBase):
    permission_name = 'manage_station_mounts'

class CanManageRemotes(StationPermissionBase):
    permission_name = 'manage_station_remotes'

class CanManageWebhooks(StationPermissionBase):
    permission_name = 'manage_station_webhooks'

class CanManagePodcasts(StationPermissionBase):
    permission_name = 'manage_station_podcasts'

class CanManageHls(StationPermissionBase):
    permission_name = 'manage_station_hls'

class CanViewAnalytics(StationPermissionBase):
    permission_name = 'manage_station_analytics'

class CanViewSftpUsers(StationPermissionBase):
    permission_name = 'manage_station_mounts'

