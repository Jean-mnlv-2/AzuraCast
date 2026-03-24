import os
import datetime
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from guardian.shortcuts import assign_perm
from .models import Station, StationPlaylist, StationStreamer, StationSchedule, StationMount, StationRemote, StationHlsStream, SftpUser, StationAdvertisement
from .serializers import (
    StationSerializer, 
    StationPlaylistSerializer, 
    StationStreamerSerializer, 
    StationScheduleSerializer,
    StationMountSerializer,
    StationRemoteSerializer,
    StationHlsStreamSerializer,
    SftpUserSerializer,
    StationAdvertisementSerializer
)

class StationViewSet(viewsets.ModelViewSet):
    """
    API endpoint qui permet de voir ou d'éditer les stations de radio.
    """
    queryset = Station.objects.all().order_by('-created_at')
    serializer_class = StationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Simplified for now, use guardian for specific actions
    lookup_field = 'short_name'

    def perform_create(self, serializer):
        station = serializer.save()
        # Assign manage_station permission to the creator
        assign_perm('stations.manage_station', self.request.user, station)
        assign_perm('stations.view_station', self.request.user, station)

    @action(detail=True, methods=['post'])
    def write_config(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        from radio.liquidsoap.config_writer import LiquidsoapConfigWriter
        from radio.icecast.config_writer import IcecastConfigWriter
        
        # Write Liquidsoap config
        ls_writer = LiquidsoapConfigWriter(station)
        ls_config = ls_writer.generate_config()
        ls_path = os.path.join(station.radio_base_dir, 'config', 'liquidsoap.liq')
        os.makedirs(os.path.dirname(ls_path), exist_ok=True)
        with open(ls_path, 'w') as f:
            f.write(ls_config)
            
        # Write Icecast config
        ic_writer = IcecastConfigWriter(station)
        ic_config = ic_writer.generate_config()
        ic_path = os.path.join(station.radio_base_dir, 'config', 'icecast.xml')
        os.makedirs(os.path.dirname(ic_path), exist_ok=True)
        with open(ic_path, 'w') as f:
            f.write(ic_config)
            
        return Response({'status': 'configs_written'})

    @action(detail=True, methods=['post'])
    def restart(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # 1. Write config first
        self.write_config(request, short_name)
        
        # 2. Update branding CSS (Optional - conceptual)
        # In a real app, you might trigger a CSS rebuild here
        
        # 3. Logic to restart the service (containerized)
        from bantuwave.container_manager import ContainerManager
        manager = ContainerManager()
        
        if manager.start_station(station):
            station.has_started = True
            station.needs_restart = False
            station.save()
            return Response({'status': 'restarting_container'})
        else:
            # Fallback to legacy method or return error
            station.has_started = True
            station.needs_restart = False
            station.save()
            return Response({'status': 'restarting_legacy'})

    @action(detail=True, methods=['post'])
    def stop(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        from bantuwave.container_manager import ContainerManager
        manager = ContainerManager()
        manager.stop_station(station)
        
        station.has_started = False
        station.save()
        return Response({'status': 'stopped'})

    @action(detail=True, methods=['post'], url_path='media/mkdir')
    def media_mkdir(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.services import ensure_station_media_storage, safe_media_path

        name = (request.data.get('name') or '').strip()
        if not name or '/' in name or '\\' in name or name in ('.', '..'):
            return Response({'error': 'Invalid folder name'}, status=status.HTTP_400_BAD_REQUEST)

        loc = ensure_station_media_storage(station)
        try:
            target = safe_media_path(loc.path, name)
        except ValueError:
            return Response({'error': 'Invalid path'}, status=status.HTTP_400_BAD_REQUEST)
        os.makedirs(target, exist_ok=True)
        return Response({'status': 'created', 'path': name})

    @action(detail=True, methods=['post'], url_path='media/upload')
    def media_upload(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.services import ensure_station_media_storage, safe_media_path
        from media.tasks import sync_media_directory

        upload = request.FILES.get('file')
        if not upload:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)

        loc = ensure_station_media_storage(station)
        rel_name = os.path.basename(upload.name)
        if not rel_name or rel_name in ('.', '..'):
            return Response({'error': 'Invalid file name'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            dest_abs = safe_media_path(loc.path, rel_name)
        except ValueError:
            return Response({'error': 'Invalid path'}, status=status.HTTP_400_BAD_REQUEST)
        os.makedirs(os.path.dirname(dest_abs), exist_ok=True)
        with open(dest_abs, 'wb+') as dest:
            for chunk in upload.chunks():
                dest.write(chunk)

        rel = os.path.relpath(dest_abs, os.path.abspath(loc.path)).replace('\\', '/')
        sync_media_directory.delay(station.id)
        return Response({'status': 'uploaded', 'path': rel}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['get'])
    def profile(self, request, short_name=None):
        station = self.get_object()
        
        serializer = self.get_serializer(station)
        data = serializer.data
        
        data['services'] = {
            'backend_running': station.has_started,
            'frontend_running': station.has_started,
        }
        
        # Fetch real NowPlaying data
        from now_playing.models import NowPlaying
        try:
            now_playing = NowPlaying.objects.get(station=station)
            np_cache = now_playing.cache.get('now_playing', {})
            
            # Calculate elapsed time if played_at exists
            elapsed = 0
            if np_cache.get('played_at'):
                from django.utils.dateparse import parse_datetime
                
                played_at = parse_datetime(np_cache['played_at'])
                if played_at:
                    elapsed = int((timezone.now() - played_at).total_seconds())
            
            data['now_playing'] = {
                'song': {
                    'title': np_cache.get('song', {}).get('title', 'Unknown Title'),
                    'artist': np_cache.get('song', {}).get('artist', 'Unknown Artist'),
                    'art': np_cache.get('song', {}).get('art', ''),
                },
                'elapsed': elapsed,
                'duration': np_cache.get('duration', 0),
            }
        except NowPlaying.DoesNotExist:
            # Fallback if no NowPlaying record exists yet
            data['now_playing'] = {
                'song': {
                    'title': 'Unknown Title',
                    'artist': 'Unknown Artist',
                    'art': '',
                },
                'elapsed': 0,
                'duration': 0,
            }
        
        now = timezone.now()
        upcoming = StationSchedule.objects.filter(
            Q(playlist__station=station) | Q(streamer__station=station)
        ).distinct()[:10]
        
        data['schedule'] = StationScheduleSerializer(upcoming, many=True).data
        
        return Response(data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def media(self, request, short_name=None):
        station = self.get_object()
        from media.models import StationMedia
        from media.serializers import StationMediaSerializer

        if not station.media_storage_location_id:
            return Response([])
        media = StationMedia.objects.filter(storage_location=station.media_storage_location)
        serializer = StationMediaSerializer(media, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def hls_streams(self, request, short_name=None):
        station = self.get_object()
        streams = StationHlsStream.objects.filter(station=station)
        serializer = StationHlsStreamSerializer(streams, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def sftp_users(self, request, short_name=None):
        station = self.get_object()
        users = SftpUser.objects.filter(station=station)
        serializer = SftpUserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def history(self, request, short_name=None):
        station = self.get_object()
        from media.models import SongHistory
        from media.serializers import SongHistorySerializer
        
        history = SongHistory.objects.filter(station=station).order_by('-timestamp_start')[:50]
        serializer = SongHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def sync_media(self, request, short_name=None):
        station = self.get_object()
        # Check permission using guardian
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        from media.tasks import sync_media_directory
        sync_media_directory.delay(station.id)
        return Response({'status': 'sync_started'}, status=status.HTTP_202_ACCEPTED)

class StationPlaylistViewSet(viewsets.ModelViewSet):
    queryset = StationPlaylist.objects.all()
    serializer_class = StationPlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

class StationStreamerViewSet(viewsets.ModelViewSet):
    queryset = StationStreamer.objects.all()
    serializer_class = StationStreamerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

class StationScheduleViewSet(viewsets.ModelViewSet):
    queryset = StationSchedule.objects.all()
    serializer_class = StationScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if 'station_short_name' in self.kwargs:
            return self.queryset.filter(
                Q(station__short_name=self.kwargs['station_short_name']) |
                Q(playlist__station__short_name=self.kwargs['station_short_name']) |
                Q(streamer__station__short_name=self.kwargs['station_short_name']) |
                Q(advertisement__station__short_name=self.kwargs['station_short_name'])
            ).distinct()
        return self.queryset

    def perform_create(self, serializer):
        if 'station_short_name' in self.kwargs:
            station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
            serializer.save(station=station)
        else:
            serializer.save()

class StationHlsStreamViewSet(viewsets.ModelViewSet):
    queryset = StationHlsStream.objects.all()
    serializer_class = StationHlsStreamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

from .permissions import CanViewSftpUsers

class SftpUserViewSet(viewsets.ModelViewSet):
    queryset = SftpUser.objects.all()
    serializer_class = SftpUserSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewSftpUsers]

    def get_station(self):
        return get_object_or_404(Station, short_name=self.kwargs['station_short_name'])

    def get_queryset(self):
        return SftpUser.objects.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

class StationAdvertisementViewSet(viewsets.ModelViewSet):
    queryset = StationAdvertisement.objects.all()
    serializer_class = StationAdvertisementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StationAdvertisement.objects.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

class StationMountViewSet(viewsets.ModelViewSet):
    queryset = StationMount.objects.all()
    serializer_class = StationMountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

class StationRemoteViewSet(viewsets.ModelViewSet):
    queryset = StationRemote.objects.all()
    serializer_class = StationRemoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)
