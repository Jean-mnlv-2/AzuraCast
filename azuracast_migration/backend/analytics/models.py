from django.db import models

class Analytics(models.Model):
    station = models.ForeignKey('stations.Station', on_delete=models.CASCADE, related_name='analytics', null=True, blank=True)
    
    TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('hourly', 'Hourly'),
        ('monthly', 'Monthly'),
    ]
    type = models.CharField(max_length=15, choices=TYPE_CHOICES)
    
    moment = models.DateTimeField()
    
    number_min = models.IntegerField(default=0)
    number_max = models.IntegerField(default=0)
    number_avg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    number_unique = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'analytics'
        indexes = [
            models.Index(fields=['type', 'moment']),
        ]
        unique_together = ('station', 'type', 'moment')

class Listener(models.Model):
    station = models.ForeignKey('stations.Station', on_delete=models.CASCADE, related_name='listener_history')
    mount = models.ForeignKey('stations.StationMount', on_delete=models.SET_NULL, null=True, blank=True)
    remote = models.ForeignKey('stations.StationRemote', on_delete=models.SET_NULL, null=True, blank=True)
    hls_stream = models.ForeignKey('stations.StationHlsStream', on_delete=models.SET_NULL, null=True, blank=True)
    
    listener_uid = models.IntegerField()
    listener_ip = models.GenericIPAddressField(max_length=45)
    listener_user_agent = models.CharField(max_length=255)
    listener_hash = models.CharField(max_length=32)
    
    timestamp_start = models.DateTimeField()
    timestamp_end = models.DateTimeField(null=True, blank=True)
    
    # Device details (from ListenerDevice)
    device_is_mobile = models.BooleanField(default=False)
    device_is_bot = models.BooleanField(default=False)
    device_browser_family = models.CharField(max_length=150, null=True, blank=True)
    device_os_family = models.CharField(max_length=150, null=True, blank=True)
    
    # Location details (from ListenerLocation)
    location_country = models.CharField(max_length=2, null=True, blank=True)
    location_region = models.CharField(max_length=150, null=True, blank=True)
    location_city = models.CharField(max_length=150, null=True, blank=True)
    location_lat = models.FloatField(null=True, blank=True)
    location_lon = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'listener'
        indexes = [
            models.Index(fields=['timestamp_end', 'timestamp_start']),
            models.Index(fields=['location_country']),
            models.Index(fields=['device_os_family']),
            models.Index(fields=['device_browser_family']),
        ]

class AdvertisementPlayback(models.Model):
    station = models.ForeignKey('stations.Station', on_delete=models.CASCADE, related_name='ad_playback_history')
    advertisement = models.ForeignKey('stations.StationAdvertisement', on_delete=models.CASCADE, related_name='playback_history')
    
    timestamp_start = models.DateTimeField(auto_now_add=True)
    timestamp_end = models.DateTimeField(null=True, blank=True)
    
    listeners_start = models.IntegerField(default=0)
    listeners_end = models.IntegerField(default=0)
    
    is_confirmed_by_log = models.BooleanField(default=False)
    log_line = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'advertisement_playback'
        indexes = [
            models.Index(fields=['timestamp_start']),
            models.Index(fields=['station', 'advertisement']),
        ]
