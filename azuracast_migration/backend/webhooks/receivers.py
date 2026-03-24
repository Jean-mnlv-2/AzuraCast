from django.dispatch import receiver
from celery import shared_task
from .signals import song_changed
from .dispatcher import dispatch
from now_playing.models import NowPlaying

@shared_task
def update_now_playing_task(station_id, now_playing_id):
    from stations.models import Station
    from autodj.models import StationQueue
    
    try:
        station = Station.objects.get(id=station_id)
        queue_item = StationQueue.objects.get(id=now_playing_id)
        
        now_playing, _ = NowPlaying.objects.get_or_create(station=station)
        now_playing.current_song = queue_item.song
        now_playing.current_media = queue_item.media
        now_playing.timestamp_start = queue_item.timestamp_played
        
        # Build cache
        now_playing.cache = {
            'station': {
                'id': station.id,
                'name': station.name,
                'shortcode': station.short_name
            },
            'now_playing': {
                'song': {
                    'text': queue_item.song.text,
                    'artist': queue_item.song.artist,
                    'title': queue_item.song.title,
                    'album': queue_item.song.album,
                    'art': queue_item.song.art.url if queue_item.song.art else None
                },
                'played_at': queue_item.timestamp_played.isoformat() if queue_item.timestamp_played else None,
                'duration': queue_item.duration
            },
            'listeners': {
                'total': now_playing.listeners_total,
                'unique': now_playing.listeners_unique
            }
        }
        now_playing.save()
        
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'nowplaying_{station.id}',
            {
                'type': 'now_playing_update',
                'data': now_playing.cache
            }
        )
    except Exception as e:
        print(f"Error updating now playing: {e}")

@shared_task
def dispatch_webhook_task(station_id, trigger_name, context):
    dispatch(station_id, trigger_name, context)

def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

@receiver(song_changed)
def handle_song_changed(sender, **kwargs):
    station = kwargs.get('station')
    now_playing_queue = kwargs.get('now_playing')
    
    update_now_playing_task.delay(station.id, now_playing_queue.id)
    
    context = {
        'station': station.name,
        'station.name': station.name,
        'station.shortcode': station.short_name,
        'now_playing.song.text': now_playing_queue.song.text,
        'now_playing.song.artist': now_playing_queue.song.artist,
        'now_playing.song.title': now_playing_queue.song.title,
        'now_playing.song.album': now_playing_queue.song.album,
        'now_playing.duration': now_playing_queue.duration,
        # Legacy/Simple vars
        'artist': now_playing_queue.song.artist,
        'title': now_playing_queue.song.title,
        'album': now_playing_queue.song.album,
    }
    
    dispatch_webhook_task.delay(station.id, 'song_changed', context)
