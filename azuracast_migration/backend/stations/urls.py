from django.urls import path, include
from rest_framework.routers import DefaultRouter
from media.views import StationMediaItemViewSet

from .views import (
    StationViewSet,
    StationPlaylistViewSet,
    StationStreamerViewSet,
    StationScheduleViewSet,
    StationMountViewSet,
    StationRemoteViewSet,
    StationHlsStreamViewSet,
    SftpUserViewSet,
    StationAdvertisementViewSet
)

router = DefaultRouter()
router.register(r'', StationViewSet)

urlpatterns = [
    # Station-specific nested routes
    path('<str:station_short_name>/playlists/', StationPlaylistViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/playlists/<int:pk>/', StationPlaylistViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    
    path('<str:station_short_name>/streamers/', StationStreamerViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/streamers/<int:pk>/', StationStreamerViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    
    path('<str:station_short_name>/advertisements/', StationAdvertisementViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/advertisements/<int:pk>/', StationAdvertisementViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),

    path('<str:station_short_name>/mounts/', StationMountViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/mounts/<int:pk>/', StationMountViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    
    path('<str:station_short_name>/remotes/', StationRemoteViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/remotes/<int:pk>/', StationRemoteViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),

    path('<str:station_short_name>/hls_streams/', StationHlsStreamViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/hls_streams/<int:pk>/', StationHlsStreamViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    
    path('<str:station_short_name>/sftp_users/', SftpUserViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/sftp_users/<int:pk>/', SftpUserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),

    path(
        '<str:station_short_name>/media/<int:pk>/',
        StationMediaItemViewSet.as_view({
            'get': 'retrieve',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
    ),

    path('schedules/', StationScheduleViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('schedules/<int:pk>/', StationScheduleViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),

    path('', include(router.urls)),
]
