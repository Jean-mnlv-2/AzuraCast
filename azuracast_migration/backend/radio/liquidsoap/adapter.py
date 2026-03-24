import os
import subprocess
import requests
from typing import List, Optional
from django.conf import settings

class LiquidsoapAdapter:
    BINARY_PATH = '/usr/local/bin/liquidsoap'
    GLOBAL_CACHE_PATH = '/tmp/liquidsoap_cache'

    def __init__(self, station):
        self.station = station

    def get_config_path(self) -> str:
        # Assuming a structure like /var/azuracast/stations/name/config/liquidsoap.liq
        return os.path.join(self.station.radio_base_dir, 'config', 'liquidsoap.liq')

    def get_http_api_port(self) -> int:
        # Port logic from PHP: telnet_port or (stream_port - 1)
        backend_config = self.station.backend_config or {}
        telnet_port = backend_config.get('telnet_port')
        if telnet_port:
            return telnet_port
        
        # Default port logic
        frontend_config = self.station.frontend_config or {}
        frontend_port = frontend_config.get('port', 8000 + ((self.station.id - 1) * 10))
        return frontend_port + 5 - 1

    def command(self, command_str: str) -> List[str]:
        api_url = f"http://localhost:{self.get_http_api_port()}/telnet"
        
        headers = {
            'x-liquidsoap-api-key': getattr(self.station, 'adapter_api_key', ''),
        }
        
        try:
            response = requests.post(api_url, headers=headers, data=command_str, timeout=5)
            response.raise_for_status()
            return response.text.strip().split('\n')
        except requests.RequestException as e:
            # In a real app, we would log this
            print(f"Liquidsoap command failed: {e}")
            return []

    def get_version(self) -> Optional[str]:
        try:
            result = subprocess.run([self.BINARY_PATH, '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                # Regex match for version
                import re
                match = re.search(r'Liquidsoap (.+)', result.stdout, re.IGNORECASE)
                return match.group(1) if match else None
        except FileNotFoundError:
            return None
        return None

    def skip(self) -> List[str]:
        return self.command('radio.skip')

    def enqueue(self, music_file: str, queue_name: str = 'next_songs') -> List[str]:
        return self.command(f"{queue_name}.push {music_file}")

    def is_queue_empty(self, queue_name: str = 'next_songs') -> bool:
        result = self.command(f"{queue_name}.queue")
        return not result or not result[0].strip()

    def disconnect_streamer(self) -> List[str]:
        return self.command('input_streamer.stop')
