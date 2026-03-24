import requests
from . import BaseConnector

class RadioDeConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        broadcast_subdomain = config.get('broadcastsubdomain')
        api_key = config.get('apikey')
        
        if not all([broadcast_subdomain, api_key]):
            return
            
        now_playing = context.get('now_playing', {})
        song = now_playing.get('song', {})
        
        params = {
            'broadcast': broadcast_subdomain,
            'apikey': api_key,
            'title': song.get('title', ''),
            'artist': song.get('artist', ''),
            'album': song.get('album', ''),
        }
        
        try:
            requests.get('https://api.radio.de/info/v2/pushmetadata/playingsong', params=params, timeout=5)
        except requests.RequestException as e:
            print(f"Radio.de Webhook failed: {e}")
