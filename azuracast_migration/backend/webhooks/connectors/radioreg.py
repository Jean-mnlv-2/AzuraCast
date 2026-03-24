import requests
from . import BaseConnector

class RadioRegConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        api_key = config.get('apikey')
        webhook_url = config.get('webhookurl')
        
        if not all([api_key, webhook_url]):
            return
            
        now_playing = context.get('now_playing', {})
        song = now_playing.get('song', {})
        
        data = {
            'title': song.get('title', ''),
            'artist': song.get('artist', ''),
        }
        
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-API-KEY': api_key,
        }
        
        try:
            requests.post(webhook_url, json=data, headers=headers, timeout=5)
        except requests.RequestException as e:
            print(f"RadioReg Webhook failed: {e}")
