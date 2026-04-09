from django.urls import path, include
from rest_framework.routers import DefaultRouter
from media.views import StationMediaItemViewSet

from .views import (
    StationViewSet,
    StationPlaylistViewSet,
    StationPlaylistFolderViewSet,
    StationStreamerViewSet,
    StationScheduleViewSet,
    StationMountViewSet,
    StationRemoteViewSet,
    StationHlsStreamViewSet,
    SftpUserViewSet,
    StationAdvertisementViewSet,
    GlobalCampaignViewSet
)

router = DefaultRouter()
router.register(r'global-campaigns', GlobalCampaignViewSet, basename='global-campaign')
router.register(r'', StationViewSet, basename='station')

urlpatterns = [
    # Base station routes
    path('schedules/', StationScheduleViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('schedules/<int:pk>/', StationScheduleViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),

    # Station-specific nested routes
    path('<str:station_short_name>/playlists/', StationPlaylistViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/playlists/<int:pk>/', StationPlaylistViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('<str:station_short_name>/playlists/<int:pk>/eligible-media/', StationPlaylistViewSet.as_view({'get': 'eligible_media'})),
    path('<str:station_short_name>/playlists/<int:pk>/current-media/', StationPlaylistViewSet.as_view({'get': 'current_media'})),
    path('<str:station_short_name>/playlists/<int:pk>/media/', StationPlaylistViewSet.as_view({'post': 'manage_media'})),
    
    path('<str:station_short_name>/playlists/<int:playlist_pk>/folders/', StationPlaylistFolderViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/playlists/<int:playlist_pk>/folders/<int:pk>/', StationPlaylistFolderViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'})),
    
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

    path('<str:short_name>/media/', StationViewSet.as_view({'get': 'media', 'post': 'media_upload'})),
    path('<str:short_name>/profile/', StationViewSet.as_view({'get': 'profile'})),
    path('<str:short_name>/logs/', StationViewSet.as_view({'get': 'logs'})),
    path('<str:short_name>/restart/', StationViewSet.as_view({'post': 'restart'})),
    path('<str:station_short_name>/media/<int:pk>/',
        StationMediaItemViewSet.as_view({
            'get': 'retrieve',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
    ),
    
    path('', include(router.urls)),
]

