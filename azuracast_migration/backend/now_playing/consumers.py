import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NowPlayingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.station_id = self.scope['url_route']['kwargs']['station_id']
        self.room_group_name = f'nowplaying_{self.station_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from room group
    async def now_playing_update(self, event):
        data = event['data']

        # Send message to WebSocket
        await self.send(text_data=json.dumps(data))
