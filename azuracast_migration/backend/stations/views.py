import os
import shutil
import secrets
import string
import datetime
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from guardian.shortcuts import assign_perm, get_objects_for_user
from .models import Station, StationPlaylist, StationPlaylistFolder, StationStreamer, StationSchedule, StationMount, StationRemote, StationHlsStream, SftpUser, StationAdvertisement, GlobalCampaign
from .serializers import (
    StationSerializer, 
    StationPlaylistSerializer, 
    StationPlaylistFolderSerializer,
    StationStreamerSerializer, 
    StationScheduleSerializer,
    StationMountSerializer,
    StationRemoteSerializer,
    StationHlsStreamSerializer,
    SftpUserSerializer,
    StationAdvertisementSerializer,
    GlobalCampaignSerializer
)
from bantuwave.emails import send_radio_creation_email
from .permissions import (
    IsStationManager, 
    IsStationViewer, 
    CanManageStationProfile, 
    CanManageMedia, 
    CanManagePlaylists, 
    CanManageStreamers, 
    CanManageMounts, 
    CanManageRemotes, 
    CanManageWebhooks, 
    CanManagePodcasts, 
    CanManageHls, 
    CanViewAnalytics
)

from users.permissions import IsBantuWaveAdmin

class GlobalCampaignViewSet(viewsets.ModelViewSet):
    queryset = GlobalCampaign.objects.all()
    serializer_class = GlobalCampaignSerializer
    permission_classes = [IsBantuWaveAdmin]
    required_action = 'manage_global_campaigns'

    def get_queryset(self):

        if self.request.user.is_superuser or self.request.user.groups.filter(name='Ad Manager').exists():
            return self.queryset
        return self.queryset.none()

class StationThrottle(UserRateThrottle):
    rate = '60/minute'

class StationViewSet(viewsets.ModelViewSet):
    throttle_classes = [StationThrottle]
    """
    API endpoint qui permet de voir ou d'éditer les stations de radio.
    """
    queryset = Station.objects.all().order_by('-created_at')
    serializer_class = StationSerializer
    lookup_field = 'short_name'

    def get_serializer_class(self):
        if self.action == 'history':
            from media.serializers import SongHistorySerializer
            return SongHistorySerializer
        return StationSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'profile']:
            return [permissions.IsAuthenticated(), IsStationViewer()]
        if self.action in ['media', 'media_mkdir', 'media_rename', 'media_move', 'media_delete_folder', 'media_delete_file', 'media_upload', 'media_import', 'import_status', 'sync_media', 'media_assign_folder_to_playlist']:
            return [permissions.IsAuthenticated(), CanManageMedia()]
        if self.action in ['hls_streams']:
            return [permissions.IsAuthenticated(), CanManageHls()]
        if self.action in ['sftp_users']:
            return [permissions.IsAuthenticated(), CanManageMounts()]
        if self.action in ['history']:
            return [permissions.IsAuthenticated(), IsStationViewer()]
        if self.action in ['write_config', 'restart', 'stop', 'logs']:
            return [permissions.IsAuthenticated(), IsStationManager()]
        return [permissions.IsAuthenticated(), CanManageStationProfile()]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Station.objects.all().select_related(
                'creator', 'subscription', 'media_storage_location'
            ).prefetch_related(
                'playlists', 'streamers', 'mounts'
            ).order_by('-created_at')
            
        from guardian.shortcuts import get_objects_for_user
        from django.db.models import Q
        
        base_qs = Station.objects.all().select_related(
            'creator', 'subscription', 'media_storage_location'
        ).prefetch_related(
            'playlists', 'streamers', 'mounts'
        )

        guardian_qs = get_objects_for_user(user, 'stations.view_station', klass=base_qs)
        
        creator_qs = base_qs.filter(creator=user)
        
        hierarchy_qs = base_qs.filter(creator__creator=user)
        
        return (guardian_qs | creator_qs | hierarchy_qs).distinct().order_by('-created_at')

    def perform_create(self, serializer):

        def generate_password(length=12):
            alphabet = string.ascii_letters + string.digits
            return ''.join(secrets.choice(alphabet) for i in range(length))

        admin_pw = generate_password()
        source_pw = generate_password()
        relay_pw = generate_password()

        frontend_config = {
            'port': 8000,
            'admin_user': 'admin',
            'admin_pw': admin_pw,
            'source_pw': source_pw,
            'relay_pw': relay_pw,
            'max_listeners': 2500
        }

        station = serializer.save(creator=self.request.user, frontend_config=frontend_config)
        
        # Assign manage_station permission to the creator
        assign_perm('stations.manage_station', self.request.user, station)
        assign_perm('stations.view_station', self.request.user, station)

        # Envoyer l'e-mail de confirmation
        send_radio_creation_email(self.request.user, station, admin_pw, source_pw)

    @action(detail=True, methods=['get'], url_path='hls/(?P<stream_name>[^/.]+)/playlist.m3u8')
    def hls_playlist(self, request, short_name=None, stream_name=None):
        """
        Serves a personalized HLS playlist with Dynamic Ad Insertion (DAI).
        Detects listener location and injects targeted ads.
        """
        station = self.get_object()
        hls_dir = os.path.join(station.radio_base_dir, 'hls')
        master_playlist_path = os.path.join(hls_dir, 'live.m3u8') # Liquidsoap default
        
        if not os.path.exists(master_playlist_path):
            return Response({'error': 'HLS stream not active'}, status=status.HTTP_404_NOT_FOUND)

        from bantuwave.services import GeoLiteService
        geo_service = GeoLiteService()
        listener_ip = request.META.get('REMOTE_ADDR')
        
        from autodj.scheduler import Scheduler
        scheduler = Scheduler()
        ads = StationAdvertisement.objects.filter(station=station, is_active=True)
        
        target_ad = None
        for ad in ads:
            if scheduler.should_advertisement_play_now(ad, listener_ip=listener_ip):
                target_ad = ad
                break

        with open(master_playlist_path, 'r') as f:
            lines = f.readlines()
        
        from django.http import HttpResponse
        content = "".join(lines)
        
        if target_ad:
            content = f"# DAI-Target: {target_ad.name}\n" + content
            
        return HttpResponse(content, content_type='application/vnd.apple.mpegurl')

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
        
        if station.subscription and station.subscription.status in ['past_due', 'suspended']:
            return Response({
                'error': 'Station suspendue pour cause d\'impayé. Veuillez régulariser votre situation.'
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

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

    @action(detail=True, methods=['get'], url_path='logs')
    def logs(self, request, short_name=None):
        """
        Fetch Liquidsoap logs for the station.
        """
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        log_path = os.path.join(station.radio_base_dir, 'config', 'liquidsoap.log')
        if not os.path.exists(log_path):
            return Response({'logs': 'No logs available yet.'})
            
        try:
            with open(log_path, 'r', encoding='utf-8') as f:
                # Get last 100 lines
                lines = f.readlines()
                return Response({'logs': "".join(lines[-100:])})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='media/mkdir')
    def media_mkdir(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.services import ensure_station_media_storage, safe_media_path

        name = (request.data.get('name') or '').strip()
        path = (request.data.get('path') or '').strip()
        
        if not name or '/' in name or '\\' in name or name in ('.', '..'):
            return Response({'error': 'Invalid folder name'}, status=status.HTTP_400_BAD_REQUEST)

        loc = ensure_station_media_storage(station)
        try:
            full_rel_path = os.path.join(path, name) if path else name
            target = safe_media_path(loc.path, full_rel_path)
        except ValueError:
            return Response({'error': 'Invalid path'}, status=status.HTTP_400_BAD_REQUEST)
        
        os.makedirs(target, exist_ok=True)
        return Response({'status': 'created', 'path': full_rel_path.replace('\\', '/')})

    @action(detail=True, methods=['post'], url_path='media/rename')
    def media_rename(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.services import ensure_station_media_storage, safe_media_path
        from media.models import StationMedia

        old_path = request.data.get('old_path')
        new_name = request.data.get('new_name')

        if not old_path or not new_name:
            return Response({'error': 'old_path and new_name are required'}, status=status.HTTP_400_BAD_REQUEST)

        loc = ensure_station_media_storage(station)
        try:
            old_abs = safe_media_path(loc.path, old_path)
            new_rel = os.path.join(os.path.dirname(old_path), new_name)
            new_abs = safe_media_path(loc.path, new_rel)
        except ValueError:
            return Response({'error': 'Invalid path'}, status=status.HTTP_400_BAD_REQUEST)

        if os.path.exists(new_abs):
            return Response({'error': 'Target already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if not os.path.exists(old_abs):
            return Response({'error': 'Source does not exist'}, status=status.HTTP_404_NOT_FOUND)

        os.rename(old_abs, new_abs)

        if os.path.isfile(new_abs):
            StationMedia.objects.filter(storage_location=loc, path=old_path).update(path=new_rel, path_short=new_rel)
        else:
            media_to_update = StationMedia.objects.filter(storage_location=loc, path__startswith=old_path)
            
            updates = []
            for m in media_to_update:
                if m.path == old_path or m.path.startswith(old_path + '/'):
                    m.path = m.path.replace(old_path, new_rel, 1)
                    m.path_short = m.path
                    updates.append(m)
            
            if updates:
                StationMedia.objects.bulk_update(updates, ['path', 'path_short'], batch_size=500)

        return Response({'status': 'renamed', 'old_path': old_path, 'new_path': new_rel})

    @action(detail=True, methods=['post'], url_path='media/delete_folder')
    def media_delete_folder(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.services import ensure_station_media_storage, safe_media_path
        from media.models import StationMedia

        path = request.data.get('path')
        if not path:
            return Response({'error': 'path is required'}, status=status.HTTP_400_BAD_REQUEST)

        loc = ensure_station_media_storage(station)
        try:
            abs_path = safe_media_path(loc.path, path)
        except ValueError:
            return Response({'error': 'Invalid path'}, status=status.HTTP_400_BAD_REQUEST)

        if not os.path.exists(abs_path) or not os.path.isdir(abs_path):
            return Response({'error': 'Folder does not exist'}, status=status.HTTP_404_NOT_FOUND)

        shutil.rmtree(abs_path)

        StationMedia.objects.filter(storage_location=loc, path__startswith=path).delete()

        return Response({'status': 'deleted', 'path': path})

    @action(detail=True, methods=['post'], url_path='media/delete_file')
    def media_delete_file(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.services import ensure_station_media_storage, safe_media_path
        from media.models import StationMedia

        path = request.data.get('path')
        if not path:
            return Response({'error': 'path is required'}, status=status.HTTP_400_BAD_REQUEST)

        loc = ensure_station_media_storage(station)
        try:
            abs_path = safe_media_path(loc.path, path)
        except ValueError:
            return Response({'error': 'Invalid path'}, status=status.HTTP_400_BAD_REQUEST)

        if not os.path.exists(abs_path) or not os.path.isfile(abs_path):
            return Response({'error': 'File does not exist'}, status=status.HTTP_404_NOT_FOUND)

        os.remove(abs_path)
        StationMedia.objects.filter(storage_location=loc, path=path).delete()

        return Response({'status': 'deleted', 'path': path})

    @action(detail=True, methods=['post'], url_path='media/upload')
    def media_upload(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.services import ensure_station_media_storage, safe_media_path
        from media.tasks import sync_media_directory

        upload = request.FILES.get('file')
        path = request.data.get('path', '') # Optionnel : dossier de destination
        
        if not upload:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)

        loc = ensure_station_media_storage(station)
        rel_name = os.path.basename(upload.name)
        if not rel_name or rel_name in ('.', '..'):
            return Response({'error': 'Invalid file name'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            full_rel_path = os.path.join(path, rel_name) if path else rel_name
            dest_abs = safe_media_path(loc.path, full_rel_path)
        except ValueError:
            return Response({'error': 'Invalid path'}, status=status.HTTP_400_BAD_REQUEST)
            
        os.makedirs(os.path.dirname(dest_abs), exist_ok=True)
        with open(dest_abs, 'wb+') as dest:
            for chunk in upload.chunks():
                dest.write(chunk)

        rel = os.path.relpath(dest_abs, os.path.abspath(loc.path)).replace('\\', '/')
        sync_media_directory.delay(station.id)
        return Response({'status': 'uploaded', 'path': rel}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'], url_path='media/move')
    def media_move(self, request, short_name=None):
        """Move a file or directory to a new location (Drag & Drop support)."""
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.services import ensure_station_media_storage, safe_media_path
        from media.models import StationMedia

        source_path = request.data.get('source_path')
        dest_folder = request.data.get('dest_folder', '') # Nouveau dossier parent

        if not source_path:
            return Response({'error': 'source_path is required'}, status=status.HTTP_400_BAD_REQUEST)

        loc = ensure_station_media_storage(station)
        try:
            source_abs = safe_media_path(loc.path, source_path)
            # Calcul du nouveau chemin relatif
            filename = os.path.basename(source_path)
            new_rel_path = os.path.join(dest_folder, filename) if dest_folder else filename
            dest_abs = safe_media_path(loc.path, new_rel_path)
        except ValueError:
            return Response({'error': 'Invalid path'}, status=status.HTTP_400_BAD_REQUEST)

        if not os.path.exists(source_abs):
            return Response({'error': 'Source does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        if os.path.exists(dest_abs):
            return Response({'error': 'Destination already exists'}, status=status.HTTP_400_BAD_REQUEST)

        os.makedirs(os.path.dirname(dest_abs), exist_ok=True)
        shutil.move(source_abs, dest_abs)

        # Mise à jour DB pour fichiers
        if os.path.isfile(dest_abs):
            StationMedia.objects.filter(storage_location=loc, path=source_path).update(
                path=new_rel_path.replace('\\', '/'), 
                path_short=new_rel_path.replace('\\', '/')
            )
        else:
            # Mise à jour récursive pour dossiers
            media_to_update = StationMedia.objects.filter(storage_location=loc, path__startswith=source_path)
            updates = []
            for m in media_to_update:
                if m.path == source_path or m.path.startswith(source_path + '/'):
                    m.path = m.path.replace(source_path, new_rel_path.replace('\\', '/'), 1)
                    m.path_short = m.path
                    updates.append(m)
            if updates:
                StationMedia.objects.bulk_update(updates, ['path', 'path_short'], batch_size=500)

        return Response({'status': 'moved', 'new_path': new_rel_path.replace('\\', '/')})

    @action(detail=True, methods=['post'], url_path='media/assign-folder-to-playlist')
    def media_assign_folder_to_playlist(self, request, short_name=None):
        """Assign all media in a folder to a playlist."""
        station = self.get_object()
        folder_path = request.data.get('folder_path', '')
        playlist_id = request.data.get('playlist_id')

        if not playlist_id:
            return Response({'error': 'playlist_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        playlist = get_object_or_404(StationPlaylist, pk=playlist_id, station=station)
        
        from media.models import StationMedia
        
        # Clean path prefix
        prefix = folder_path.replace('\\', '/')
        if prefix and not prefix.endswith('/'):
            prefix += '/'

        if prefix:
            media_to_add = StationMedia.objects.filter(
                storage_location=station.media_storage_location,
                path__startswith=prefix
            )
        else:
            # Root folder
            media_to_add = StationMedia.objects.filter(
                storage_location=station.media_storage_location
            )

        count = media_to_add.count()
        playlist.media_items.add(*media_to_add)

        return Response({
            'status': 'assigned',
            'count': count,
            'playlist': playlist.name,
            'folder': folder_path or 'Root'
        })

    @action(detail=True, methods=['get'])
    def profile(self, request, short_name=None):
        station = self.get_object()
        
        serializer = self.get_serializer(station)
        data = serializer.data
        
        data['services'] = {
            'backend_running': station.has_started,
            'frontend_running': station.has_started,
        }
        
        from now_playing.models import NowPlaying
        try:
            now_playing = NowPlaying.objects.get(station=station)
            np_cache = now_playing.cache.get('now_playing', {})
            
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
                'listeners': now_playing.listeners_total,
                'bitrate': now_playing.cache.get('station', {}).get('mounts', [{}])[0].get('bitrate', 128)
            }
        except NowPlaying.DoesNotExist:
            data['now_playing'] = {
                'song': {
                    'title': 'Unknown Title',
                    'artist': 'Unknown Artist',
                    'art': '',
                },
                'elapsed': 0,
                'duration': 0,
                'listeners': 0,
                'bitrate': 128
            }
        
        now = timezone.now()
        upcoming = StationSchedule.objects.filter(
            Q(playlist__station=station) | Q(streamer__station=station)
        ).distinct()[:10]
        
        data['schedule'] = StationScheduleSerializer(upcoming, many=True).data
        
        return Response(data)

    @action(detail=True, methods=['post'], url_path='media/import')
    def media_import(self, request, short_name=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from media.tasks import import_media_task

        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Data must be a list of objects'}, status=status.HTTP_400_BAD_REQUEST)

        # Lancer la tâche Celery
        task = import_media_task.delay(data, station.short_name)

        return Response({
            'status': 'started',
            'task_id': task.id
        })

    @action(detail=True, methods=['get'], url_path='media/import-status/(?P<task_id>[^/.]+)')
    def import_status(self, request, short_name=None, task_id=None):
        station = self.get_object()
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from celery.result import AsyncResult
        res = AsyncResult(task_id)

        if res.state == 'SUCCESS':
            return Response({
                'state': res.state,
                'result': res.result
            })
        elif res.state == 'FAILURE':
            return Response({
                'state': res.state,
                'error': str(res.info)
            })
        else:
            # Pour l'état PROGRESS ou PENDING
            return Response({
                'state': res.state,
                'meta': res.info if isinstance(res.info, dict) else {}
            })

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def media(self, request, short_name=None):
        station = self.get_object()
        from media.models import StationMedia
        from media.serializers import StationMediaSerializer

        if not station.media_storage_location_id:
            return Response([])

        loc = station.media_storage_location
        media_path = loc.path
        
        media_qs = StationMedia.objects.filter(storage_location=loc).select_related('song')
        media_map = {m.path: StationMediaSerializer(m).data for m in media_qs}
        
        result = []
        
        for root, dirs, files in os.walk(media_path):
            rel_root = os.path.relpath(root, media_path)
            if rel_root == '.':
                rel_root = ''
            
            for name in dirs:
                path = os.path.join(rel_root, name).replace('\\', '/')
                result.append({
                    'path': path,
                    'name': name,
                    'type': 'directory',
                    'id': f"dir-{path}"
                })
            
            for name in files:
                path = os.path.join(rel_root, name).replace('\\', '/')
                if path in media_map:
                    data = media_map[path]
                    data['type'] = 'file'
                    result.append(data)
                else:
                    result.append({
                        'path': path,
                        'name': name,
                        'type': 'file',
                        'is_synced': False
                    })
            
        return Response(result)

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
        if not request.user.has_perm('stations.manage_station', station):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        from media.tasks import sync_media_directory
        sync_media_directory.delay(station.id)
        return Response({'status': 'sync_started'}, status=status.HTTP_202_ACCEPTED)

class StationPlaylistViewSet(viewsets.ModelViewSet):
    queryset = StationPlaylist.objects.all()
    serializer_class = StationPlaylistSerializer
    permission_classes = [permissions.IsAuthenticated, CanManagePlaylists]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

    @action(detail=True, methods=['get'], url_path='eligible-media')
    def eligible_media(self, request, station_short_name=None, pk=None):
        """List media items from the station that are NOT in this playlist."""
        playlist = self.get_object()
        station = playlist.station
        
        from media.models import StationMedia
        from media.serializers import StationMediaSerializer
        from django.db.models import Q

        # Start with all media for this station
        queryset = StationMedia.objects.filter(
            storage_location=station.media_storage_location
        ).exclude(playlists=playlist).select_related('song')

        # Search support
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(artist__icontains=search) | 
                Q(path__icontains=search)
            )

        # Pagination (standard DRF or simple slice)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = StationMediaSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = StationMediaSerializer(queryset[:100], many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='current-media')
    def current_media(self, request, station_short_name=None, pk=None):
        """List media items currently in this playlist with search."""
        playlist = self.get_object()
        
        from media.serializers import StationMediaSerializer
        from django.db.models import Q

        queryset = playlist.media_items.all().select_related('song')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(artist__icontains=search) | 
                Q(path__icontains=search)
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = StationMediaSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = StationMediaSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='media')
    def manage_media(self, request, station_short_name=None, pk=None):
        playlist = self.get_object()
        media_id = request.data.get('media_id')
        action = request.data.get('action') # 'add' or 'remove'

        from media.models import StationMedia
        media_item = get_object_or_404(StationMedia, pk=media_id)

        if action == 'add':
            playlist.media_items.add(media_item)
            return Response({'status': 'added'})
        elif action == 'remove':
            playlist.media_items.remove(media_item)
            return Response({'status': 'removed'})
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

class StationPlaylistFolderViewSet(viewsets.ModelViewSet):
    queryset = StationPlaylistFolder.objects.all()
    serializer_class = StationPlaylistFolderSerializer
    permission_classes = [permissions.IsAuthenticated, CanManagePlaylists]

    def get_queryset(self):
        return self.queryset.filter(
            station__short_name=self.kwargs['station_short_name'],
            playlist_id=self.kwargs['playlist_pk']
        )

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        playlist = get_object_or_404(StationPlaylist, pk=self.kwargs['playlist_pk'], station=station)
        folder = serializer.save(station=station, playlist=playlist)
        
        # Liaison Automatique : Ajouter tous les médias existants de ce dossier à la playlist
        from media.services import apply_folder_playlist_assignments
        apply_folder_playlist_assignments(station, folder_mapping=folder)

class StationStreamerViewSet(viewsets.ModelViewSet):
    queryset = StationStreamer.objects.all()
    serializer_class = StationStreamerSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageStreamers]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

class StationScheduleViewSet(viewsets.ModelViewSet):
    queryset = StationSchedule.objects.all()
    serializer_class = StationScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, CanManagePlaylists]

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
    permission_classes = [permissions.IsAuthenticated, CanManageHls]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

from .permissions import CanViewSftpUsers

class SftpUserViewSet(viewsets.ModelViewSet):
    queryset = SftpUser.objects.all()
    serializer_class = SftpUserSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageMounts, CanViewSftpUsers]

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
    permission_classes = [permissions.IsAuthenticated, CanManagePlaylists]

    def get_queryset(self):
        return StationAdvertisement.objects.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

class StationMountViewSet(viewsets.ModelViewSet):
    queryset = StationMount.objects.all()
    serializer_class = StationMountSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageMounts]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)

class StationRemoteViewSet(viewsets.ModelViewSet):
    queryset = StationRemote.objects.all()
    serializer_class = StationRemoteSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageRemotes]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)
