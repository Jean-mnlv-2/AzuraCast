import requests
from django.conf import settings
from settings.models import Settings
import logging

logger = logging.getLogger(__name__)

class LastFmService:
    API_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

    def __init__(self):
        self.config = Settings.get_instance()

    def get_api_key(self):
        return self.config.last_fm_api_key

    def has_api_key(self):
        return bool(self.get_api_key())

    def make_request(self, method, params=None):
        api_key = self.get_api_key()
        if not api_key:
            return None

        if params is None:
            params = {}

        params.update({
            'method': method,
            'api_key': api_key,
            'format': 'json',
        })

        try:
            response = requests.get(self.API_BASE_URL, params=params, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Last.fm API request failed: {e}")
            return None

    def get_album_art(self, artist, album):
        if not self.has_api_key():
            return None

        data = self.make_request('album.getInfo', {
            'artist': artist,
            'album': album
        })

        if not data or 'album' not in data:
            return None

        images = data['album'].get('image', [])
        # Return the largest image available (usually at the end of the list)
        for image in reversed(images):
            if image.get('#text'):
                return image['#text']
        
        return None

class GeoLiteService:
    def __init__(self):
        self.config = Settings.get_instance()

    def get_license_key(self):
        return self.config.geolite_license_key

    def has_license_key(self):
        return bool(self.get_license_key())
