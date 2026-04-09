import logging
import secrets

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from autodj.scheduler import Scheduler
from stations.models import Station, StationStreamer, StationAdvertisement
from now_playing.models import NowPlaying
from analytics.models import AdvertisementPlayback
from webhooks.signals import song_changed

logger = logging.getLogger(__name__)


def _internal_token_valid(request) -> bool:
    """
    Enhanced security check for internal API calls.
    - Constant-time string comparison to prevent timing attacks.
    - IP whitelisting if configured.
    """
    token = getattr(settings, 'INTERNAL_DJ_AUTH_TOKEN', None)
    
    if settings.DEBUG and not token:
        return True
        
    if not token:
        logger.critical('SECURITY ALERT: INTERNAL_DJ_AUTH_TOKEN is not configured!')
        return False
    
    # Constant-time comparison
    supplied = (
        request.headers.get('X-Internal-Token')
        or request.GET.get('internal_token')
        or (request.data.get('internal_token') if hasattr(request, 'data') and isinstance(request.data, dict) else None)
    )
    
    if not supplied or not secrets.compare_digest(supplied, token):
        logger.warning('Unauthorized internal API attempt from IP: %s', request.META.get('REMOTE_ADDR'))
        return False

    # Optional: IP Whitelisting (if defined in settings)
    allowed_ips = getattr(settings, 'INTERNAL_SERVICES_ALLOWED_IPS', None)
    if allowed_ips:
        client_ip = request.META.get('REMOTE_ADDR')
        if client_ip not in allowed_ips:
            logger.warning('Internal API attempt from unauthorized IP: %s', client_ip)
            return False

    return True


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def dj_auth(request):
    """
    Harbor / live-DJ authentication invoked by Liquidsoap.
    Secured by INTERNAL_DJ_AUTH_TOKEN (query param, body, or X-Internal-Token header).
    """
    if not _internal_token_valid(request):
        return Response({'allow': False}, status=status.HTTP_403_FORBIDDEN)

    user = request.GET.get('user') or request.POST.get('user')
    password = request.GET.get('pass') or request.POST.get('pass')
    station_id = request.GET.get('station_id') or request.POST.get('station_id')

    if not all([user, password, station_id]):
        return Response({'allow': False}, status=status.HTTP_400_BAD_REQUEST)

    try:
        streamer = StationStreamer.objects.get(station_id=station_id, streamer_username=user)
        if streamer.authenticate(password):
            scheduler = Scheduler()
            if scheduler.can_streamer_stream_now(streamer):
                return Response({'allow': True})
    except StationStreamer.DoesNotExist:
        logger.info('dj_auth: unknown streamer user=%s station_id=%s', user, station_id)

    return Response({'allow': False})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def listener_event(request):
    """
    Incoming webhook from Icecast (connect/disconnect).
    Optimized: Updates listener count immediately without polling.
    """
    if not _internal_token_valid(request):
        return Response({'status': 'denied'}, status=status.HTTP_403_FORBIDDEN)

    station_id = request.data.get('station_id')
    event = request.data.get('event') # 'connect', 'disconnect'
    
    if not station_id or not event:
        return Response({'status': 'missing_data'}, status=status.HTTP_400_BAD_REQUEST)

    from now_playing.tasks import update_listeners_task
    update_listeners_task.delay(station_id, event, request.data.get('ip'))
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def station_heartbeat(request, station_id):
    """
    Periodic heartbeat from Liquidsoap to ensure the station is alive.
    Updates 'has_started' and 'last_seen_at' (if added to model).
    """
    if not _internal_token_valid(request):
        return Response({'status': 'denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        station = Station.objects.get(id=station_id)
        station.has_started = True
        station.save(update_fields=['has_started'])
        return Response({'status': 'alive'})
    except Station.DoesNotExist:
        return Response({'status': 'not_found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def metadata_update(request):
    """
    Incoming webhook from Liquidsoap (metadata changed).
    Optimized: Triggers 'Now Playing' update immediately.
    """
    if not _internal_token_valid(request):
        return Response({'status': 'denied'}, status=status.HTTP_403_FORBIDDEN)

    station_id = request.data.get('station_id')
    payload = request.data.get('metadata', {})

    if not station_id:
        return Response({'status': 'missing_station_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        station = Station.objects.get(id=station_id)
        from autodj.models import StationQueue
        now_playing_queue = StationQueue.objects.filter(station=station).order_by('-timestamp_played').first()
        
        if now_playing_queue:
            song_changed.send(sender=None, station=station, now_playing=now_playing_queue)
            return Response({'status': 'notified'})
    except Station.DoesNotExist:
        pass

    return Response({'status': 'error'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def playback_event(request):
    """
    Incoming webhook from Liquidsoap when a track finishes playing.
    Used for ad verification.
    """
    if not _internal_token_valid(request):
        return Response({'status': 'denied'}, status=status.HTTP_403_FORBIDDEN)

    station_id = request.data.get('station_id')
    event = request.data.get('event')
    ad_id = request.data.get('ad_id')
    
    if not all([station_id, event, ad_id]):
        return Response({'status': 'missing_data'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        station = Station.objects.get(id=station_id)
        ad = StationAdvertisement.objects.get(id=ad_id, station=station)
        
        from django.utils import timezone
        now = timezone.now()
        
        # Get current listener count
        now_playing = NowPlaying.objects.filter(station=station).first()
        listeners = now_playing.listeners_total if now_playing else 0
        
        if event == 'start':
            AdvertisementPlayback.objects.create(
                station=station,
                advertisement=ad,
                timestamp_start=now,
                listeners_start=listeners
            )
        elif event == 'end':
            playback = AdvertisementPlayback.objects.filter(
                station=station,
                advertisement=ad,
                timestamp_end__isnull=True
            ).order_by('-timestamp_start').first()
            
            if playback:
                playback.timestamp_end = now
                playback.listeners_end = listeners
                playback.save()
        
        return Response({'status': 'recorded'})
    except (Station.DoesNotExist, StationAdvertisement.DoesNotExist):
        return Response({'status': 'not_found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_admin_stats(request):
    """
    Returns administrative statistics across all stations.
    Secured by INTERNAL_DJ_AUTH_TOKEN.
    """
    if not _internal_token_valid(request):
        return Response({'status': 'denied'}, status=status.HTTP_403_FORBIDDEN)

    stats = {
        'total_stations': Station.objects.count(),
        'total_streamers': StationStreamer.objects.count(),
        'active_listeners': sum(np.listeners_total for np in NowPlaying.objects.all()),
    }
    return Response({'status': 'ok', 'stats': stats})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_station_logs(request):
    """
    Returns logs for a specific station.
    Secured by INTERNAL_DJ_AUTH_TOKEN.
    """
    if not _internal_token_valid(request):
        return Response({'status': 'denied'}, status=status.HTTP_403_FORBIDDEN)

    station_id = request.GET.get('station_id')
    if not station_id:
        return Response({'status': 'missing_station_id'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'status': 'ok', 'logs': []})
