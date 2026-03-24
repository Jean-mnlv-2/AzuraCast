from django.db import models
from stations.models import Station
from media.models import Song, StationMedia

class NowPlaying(models.Model):
    station = models.OneToOneField(Station, on_delete=models.CASCADE, primary_key=True, related_name='now_playing')
    
    current_song = models.ForeignKey(Song, on_delete=models.SET_NULL, null=True, related_name='now_playing_current')
    current_media = models.ForeignKey(StationMedia, on_delete=models.SET_NULL, null=True, related_name='now_playing_media')
    
    listeners_total = models.IntegerField(default=0)
    listeners_unique = models.IntegerField(default=0)
    
    timestamp_start = models.DateTimeField(null=True, blank=True)
    
    # Store the full JSON payload like in AzuraCast
    cache = models.JSONField(default=dict, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'now_playing'
