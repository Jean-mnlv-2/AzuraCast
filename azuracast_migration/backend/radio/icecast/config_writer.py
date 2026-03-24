import os
import xml.etree.ElementTree as ET
from django.conf import settings

class IcecastConfigWriter:
    def __init__(self, station):
        self.station = station

    def generate_config(self) -> str:
        frontend_config = self.station.frontend_config or {}
        port = frontend_config.get('port', 8000 + ((self.station.id - 1) * 10))
        admin_user = frontend_config.get('admin_user', 'admin')
        admin_password = frontend_config.get('admin_pw', 'password')
        source_password = frontend_config.get('source_pw', 'password')
        relay_password = frontend_config.get('relay_pw', 'password')

        root = ET.Element("icecast")
        
        # Global settings
        ET.SubElement(root, "location").text = self.station.name
        ET.SubElement(root, "admin").text = "admin@localhost"
        ET.SubElement(root, "hostname").text = getattr(settings, 'ICECAST_HOSTNAME', 'localhost')
        
        limits = ET.SubElement(root, "limits")
        ET.SubElement(limits, "clients").text = str(frontend_config.get('max_listeners', 2500))
        ET.SubElement(limits, "sources").text = "10"
        ET.SubElement(limits, "queue-size").text = "524288"
        ET.SubElement(limits, "client-timeout").text = "30"
        ET.SubElement(limits, "header-timeout").text = "15"
        ET.SubElement(limits, "source-timeout").text = "10"
        
        authentication = ET.SubElement(root, "authentication")
        ET.SubElement(authentication, "source-password").text = source_password
        ET.SubElement(authentication, "relay-password").text = relay_password
        ET.SubElement(authentication, "admin-user").text = admin_user
        ET.SubElement(authentication, "admin-password").text = admin_password
        
        listen_socket = ET.SubElement(root, "listen-socket")
        ET.SubElement(listen_socket, "port").text = str(port)
        
        # Paths
        paths = ET.SubElement(root, "paths")
        ET.SubElement(paths, "logdir").text = os.path.join(self.station.radio_base_dir, "logs")
        ET.SubElement(paths, "webroot").text = "/usr/local/share/icecast/web"
        ET.SubElement(paths, "adminroot").text = "/usr/local/share/icecast/admin"
        
        # Mount points (from model)
        for mount in self.station.mounts.filter(is_enabled=True):
            mount_elem = ET.SubElement(root, "mount")
            ET.SubElement(mount_elem, "mount-name").text = mount.name
            ET.SubElement(mount_elem, "fallback-mount").text = mount.fallback_mount or ""
            ET.SubElement(mount_elem, "fallback-override").text = "1"
            
            if mount.is_default:
                # Add extra settings for default mount if needed
                pass

            if mount.autodj_format:
                ET.SubElement(mount_elem, "type").text = f"audio/{mount.autodj_format}"

        # Logging
        logging = ET.SubElement(root, "logging")
        ET.SubElement(logging, "accesslog").text = "access.log"
        ET.SubElement(logging, "errorlog").text = "error.log"
        ET.SubElement(logging, "loglevel").text = "3" # 4 Debug, 3 Info, 2 Warn, 1 Error

        # Security
        security = ET.SubElement(root, "security")
        chroot = ET.SubElement(security, "chroot")
        chroot.text = "0"

        return ET.tostring(root, encoding='unicode')
