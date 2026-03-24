from auditlog.registry import auditlog
from .models import Station, StationPlaylist, StationStreamer

auditlog.register(Station)
auditlog.register(StationPlaylist)
auditlog.register(StationStreamer)
