import requests
from . import BaseConnector

class TuneInConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        partner_id = config.get('partner_id')
        partner_key = config.get('partner_key')
        station_id = config.get('station_id')
        
        if not all([partner_id, partner_key, station_id]):
            return
            
        now_playing = context.get('now_playing', {})
        song = now_playing.get('song', {})
        
        params = {
            'partnerId': partner_id,
            'partnerKey': partner_key,
            'id': station_id,
            'title': song.get('title', ''),
            'artist': song.get('artist', ''),
            'album': song.get('album', ''),
        }
        
        try:
            requests.get('https://air.radiotime.com/Playing.ashx', params=params, timeout=5)
        except requests.RequestException as e:
            print(f"TuneIn Webhook failed: {e}")
