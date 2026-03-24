import docker
import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class ContainerManager:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception as e:
            logger.error(f"Could not connect to Docker: {e}")
            self.client = None

    def start_station(self, station):
        if not self.client:
            return False

        container_name = f"bantuwave_station_{station.id}"
        
        self.stop_station(station)

        config_path = os.path.join(station.radio_base_dir, 'config')
        media_path = os.path.join(station.radio_base_dir, 'media')
        
        try:
            self.client.containers.run(
                "bantuwave/liquidsoap:latest",
                name=container_name,
                detach=True,
                volumes={
                    config_path: {'bind': '/etc/liquidsoap', 'mode': 'ro'},
                    media_path: {'bind': '/var/azuracast/media', 'mode': 'ro'},
                },
                environment={
                    "STATION_ID": station.id,
                    "API_URL": "http://backend:8000/api/internal/",
                },
                network="bantuwave_network",
                restart_policy={"Name": "always"}
            )
            return True
        except Exception as e:
            logger.error(f"Failed to start container for station {station.id}: {e}")
            return False

    def stop_station(self, station):
        if not self.client:
            return False

        container_name = f"bantuwave_station_{station.id}"
        try:
            container = self.client.containers.get(container_name)
            container.stop()
            container.remove()
            return True
        except docker.errors.NotFound:
            return True
        except Exception as e:
            logger.error(f"Failed to stop container for station {station.id}: {e}")
            return False
