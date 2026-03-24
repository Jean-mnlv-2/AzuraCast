from django.db import models

class StationWebhook(models.Model):
    station = models.ForeignKey('stations.Station', on_delete=models.CASCADE, related_name='webhooks')
    name = models.CharField(max_length=100, null=True, blank=True)
    
    TYPE_CHOICES = [
        ('generic', 'Generic Webhook'),
        ('discord', 'Discord'),
        ('telegram', 'Telegram'),
        ('email', 'Email'),
        ('tunein', 'TuneIn'),
        ('mastodon', 'Mastodon'),
        ('bluesky', 'Bluesky'),
        ('getmeradio', 'GetMeRadio'),
        ('google_analytics_v4', 'Google Analytics V4'),
        ('groupme', 'GroupMe'),
        ('matomo_analytics', 'Matomo Analytics'),
        ('radiode', 'Radio.de'),
        ('radioreg', 'RadioReg'),
    ]
    type = models.CharField(max_length=100, choices=TYPE_CHOICES)
    
    is_enabled = models.BooleanField(default=True)
    
    # List of triggers (stored as JSON)
    # Examples: 'song_changed', 'listener_joined', 'live_connect'
    triggers = models.JSONField(null=True, blank=True)
    
    # Connector-specific configuration
    config = models.JSONField(null=True, blank=True)
    
    # Internal metadata/state
    metadata = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.station.name} Webhook: {self.name or self.type}"

    class Meta:
        db_table = 'station_webhooks'
