from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/nowplaying/(?P<station_id>\d+)/$', consumers.NowPlayingConsumer.as_asgi()),
]
