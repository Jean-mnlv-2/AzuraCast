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

    def get_location(self, ip_address):
        """
        Detects location from IP address.
        For development, it returns a mock location based on specific IP patterns.
        """
        if ip_address == '127.0.0.1' or ip_address == '::1':
            return {'country': 'FR', 'city': 'Paris'}
            
        if ip_address.startswith('129.'): 
            return {'country': 'CM', 'city': 'Douala'}
            
        # In production, this would use geoip2 library with MaxMind DB
        # try:
        #     import geoip2.database
        #     # reader = geoip2.database.Reader('/path/to/GeoLite2-City.mmdb')
        #     # response = reader.city(ip_address)
        #     # return {'country': response.country.iso_code, 'city': response.city.name}
        # except Exception:
        #     pass
            
        return {'country': 'UNKNOWN', 'city': 'Unknown'}
