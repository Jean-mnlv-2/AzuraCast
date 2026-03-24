import os
import requests
from typing import Dict, Any, Optional
from django.conf import settings

class IcecastAdapter:
    BASE_DIR = '/usr/local/share/icecast'

    def __init__(self, station):
        self.station = station

    def get_config_path(self) -> str:
        return os.path.join(self.station.radio_base_dir, 'config', 'icecast.xml')

    def get_admin_url(self) -> str:
        frontend_config = self.station.frontend_config or {}
        port = frontend_config.get('port', 8000)
        return f"http://localhost:{port}/admin/"

    def get_now_playing(self) -> Dict[str, Any]:
        admin_url = f"{self.get_admin_url()}stats.json"
        frontend_config = self.station.frontend_config or {}
        auth = ('admin', frontend_config.get('admin_pw', ''))
        
        try:
            response = requests.get(admin_url, auth=auth, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Icecast stats request failed: {e}")
            return {}

    def get_mount_stats(self, mount_name: str) -> Optional[Dict[str, Any]]:
        stats = self.get_now_playing()
        icestats = stats.get('icestats', {})
        sources = icestats.get('source', [])
        
        if isinstance(sources, dict):
            sources = [sources]
            
        for source in sources:
            if source.get('listenurl', '').endswith(mount_name):
                return source
        return None
