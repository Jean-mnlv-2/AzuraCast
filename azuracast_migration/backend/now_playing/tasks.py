from celery import shared_task
from .models import NowPlaying
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@shared_task
def update_listeners_task(station_id, event):
    """
    Asynchronously update listener counts based on incoming webhooks.
    """
    try:
        now_playing, _ = NowPlaying.objects.get_or_create(station_id=station_id)
        
        if event == 'connect':
            now_playing.listeners_total += 1
        elif event == 'disconnect':
            now_playing.listeners_total = max(0, now_playing.listeners_total - 1)
        
        if 'listeners' in now_playing.cache:
            now_playing.cache['listeners']['total'] = now_playing.listeners_total
        else:
            now_playing.cache['listeners'] = {'total': now_playing.listeners_total, 'unique': 0}
            
        now_playing.save()
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'nowplaying_{station_id}',
            {
                'type': 'now_playing_update',
                'data': now_playing.cache
            }
        )
    except Exception as e:
        print(f"Error in update_listeners_task: {e}")
