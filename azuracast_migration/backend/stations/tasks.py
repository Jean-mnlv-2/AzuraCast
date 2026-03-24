from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Station, StationStreamer
from autodj.scheduler import Scheduler
from radio.liquidsoap import LiquidsoapAdapter
from media.models import SongHistory
import logging

logger = logging.getLogger(__name__)

@shared_task
def enforce_broadcast_times():
    """
    Disconnect streamers who are no longer scheduled to broadcast.
    """
    scheduler = Scheduler()
    stations = Station.objects.filter(is_enabled=True, enable_streamers=True)
    
    for station in stations:
        adapter = LiquidsoapAdapter(station)
        # In a real scenario, we'd check who is currently connected via Liquidsoap API
        # For now, we iterate over active streamers and check their schedule
        streamers = StationStreamer.objects.filter(station=station, is_active=True)
        for streamer in streamers:
            if not scheduler.can_streamer_stream_now(streamer):
                logger.info(f"Disconnecting streamer {streamer.streamer_username} on station {station.name}")
                adapter.command(f"harbor.disconnect") # Simplified command

@shared_task
def cleanup_history():
    """
    Remove old song history records.
    """
    # Keep history for 14 days by default (align with AzuraCast default)
    cutoff = timezone.now() - timedelta(days=14)
    deleted_count, _ = SongHistory.objects.filter(timestamp_start__lt=cutoff).delete()
    return f"Deleted {deleted_count} old history records"

@shared_task
def update_station_status():
    """
    Periodic check if station is still running (Docker container status when available).
    """
    manager = ContainerManager()
    if not getattr(manager, 'client', None):
        logger.debug('update_station_status: docker non disponible, aucune mise à jour')
        return 'no_docker'

    for station in Station.objects.filter(is_enabled=True):
        name = f'bantuwave_station_{station.id}'
        running = False
        try:
            container = manager.client.containers.get(name)
            running = container.status == 'running'
        except Exception:
            running = False
        Station.objects.filter(pk=station.pk).update(has_started=running)
    return 'ok'
