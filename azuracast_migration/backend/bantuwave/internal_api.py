import logging

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from autodj.scheduler import Scheduler
from stations.models import StationStreamer

logger = logging.getLogger(__name__)


def _internal_token_valid(request) -> bool:
    token = settings.INTERNAL_DJ_AUTH_TOKEN
    if settings.DEBUG and not token:
        return True
    if not token:
        logger.error('INTERNAL_DJ_AUTH_TOKEN is not configured (required when DEBUG=False)')
        return False
    supplied = (
        request.headers.get('X-Internal-Token')
        or request.GET.get('internal_token')
        or request.POST.get('internal_token')
    )
    return supplied == token


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
