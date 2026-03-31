from django.db import models
from stations.models import Station, StationPlaylist, StationAdvertisement
from media.models import Song, StationMedia

class StationQueue(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='queue_items')
    playlist = models.ForeignKey(StationPlaylist, on_delete=models.SET_NULL, null=True, blank=True)
    media = models.ForeignKey(StationMedia, on_delete=models.SET_NULL, null=True, blank=True)
    advertisement = models.ForeignKey(StationAdvertisement, on_delete=models.SET_NULL, null=True, blank=True)
    request = models.ForeignKey('StationRequest', on_delete=models.SET_NULL, null=True, blank=True)
    
    title = models.CharField(max_length=150, null=True, blank=True)
    artist = models.CharField(max_length=150, null=True, blank=True)
    album = models.CharField(max_length=150, null=True, blank=True)
    
    sent_to_autodj = models.BooleanField(default=False)
    is_played = models.BooleanField(default=False)
    is_visible = models.BooleanField(default=True)
    
    autodj_custom_uri = models.CharField(max_length=255, null=True, blank=True)
    timestamp_cued = models.DateTimeField(auto_now_add=True)
    timestamp_played = models.DateTimeField(null=True, blank=True)
    duration = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'station_queue'

class StationRequest(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='request_items')
    track = models.ForeignKey(StationMedia, on_delete=models.CASCADE)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    played_at = models.DateTimeField(null=True, blank=True)
    
    skip_delay = models.BooleanField(default=False)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'station_requests'
