from django.db import models

class Station(models.Model):
    name = models.CharField(max_length=100)
    short_name = models.SlugField(max_length=100, unique=True)
    is_enabled = models.BooleanField(default=True)
    
    FRONTEND_CHOICES = [
        ('icecast', 'Icecast'),
        ('shoutcast', 'Shoutcast'),
        ('remote', 'Remote'),
        ('none', 'None'),
    ]
    frontend_type = models.CharField(max_length=100, choices=FRONTEND_CHOICES, default='icecast')
    frontend_config = models.JSONField(null=True, blank=True)
    
    BACKEND_CHOICES = [
        ('liquidsoap', 'Liquidsoap'),
        ('none', 'None'),
    ]
    backend_type = models.CharField(max_length=100, choices=BACKEND_CHOICES, default='liquidsoap')
    backend_config = models.JSONField(null=True, blank=True)
    
    description = models.TextField(null=True, blank=True)
    url = models.URLField(max_length=255, null=True, blank=True)
    genre = models.CharField(max_length=255, null=True, blank=True)
    radio_base_dir = models.CharField(max_length=255, null=True, blank=True)
    
    enable_requests = models.BooleanField(default=False)
    request_delay = models.IntegerField(default=5, null=True, blank=True)
    request_threshold = models.IntegerField(default=15, null=True, blank=True)
    disconnect_deactivate_streamer = models.IntegerField(default=0, null=True, blank=True)
    
    enable_streamers = models.BooleanField(default=False)
    is_streamer_live = models.BooleanField(default=False)
    
    enable_public_page = models.BooleanField(default=True)
    enable_public_api = models.BooleanField(default=True)
    enable_on_demand = models.BooleanField(default=False)
    enable_on_demand_download = models.BooleanField(default=True)
    enable_hls = models.BooleanField(default=False)
    
    api_history_items = models.SmallIntegerField(default=5)
    timezone = models.CharField(max_length=100, default='UTC')
    
    max_bitrate = models.SmallIntegerField(default=0)
    max_mounts = models.SmallIntegerField(default=0)
    max_hls_streams = models.SmallIntegerField(default=0)
    
    branding_config = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Custom branding like colors, logos, and social widgets."
    )
    
    ad_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Ad injection settings (intervals, providers)."
    )
    
    # CDN / Edge Streaming
    cdn_url = models.URLField(max_length=512, null=True, blank=True)
    hls_cdn_url = models.URLField(max_length=512, null=True, blank=True)
    
    adapter_api_key = models.CharField(max_length=150, null=True, blank=True)
    fallback_path = models.CharField(max_length=255, null=True, blank=True)
    
    media_storage_location = models.ForeignKey('media.StorageLocation', on_delete=models.SET_NULL, null=True, blank=True, related_name='stations_media')
    recordings_storage_location = models.ForeignKey('media.StorageLocation', on_delete=models.SET_NULL, null=True, blank=True, related_name='stations_recordings')
    podcasts_storage_location = models.ForeignKey('media.StorageLocation', on_delete=models.SET_NULL, null=True, blank=True, related_name='stations_podcasts')
    backups_storage_location = models.ForeignKey('media.StorageLocation', on_delete=models.SET_NULL, null=True, blank=True, related_name='stations_backups')
    
    needs_restart = models.BooleanField(default=False)
    has_started = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.radio_base_dir:
            self.radio_base_dir = f'/var/azuracast/stations/{self.short_name}'
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'station'
        permissions = [
            ('manage_station', 'Can manage station'),
        ]

class StationPlaylist(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='playlists')
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    
    TYPE_CHOICES = [
        ('default', 'Standard'),
        ('once_per_hour', 'Once per hour'),
        ('once_per_x_songs', 'Once per x songs'),
        ('once_per_x_minutes', 'Once per x minutes'),
        ('once_per_day', 'Once per day'),
        ('custom', 'Custom'),
        ('none', 'None'),
    ]
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='default')
    
    SOURCE_CHOICES = [
        ('songs', 'Songs'),
        ('remote_url', 'Remote URL'),
    ]
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='songs')
    
    ORDER_CHOICES = [
        ('shuffle', 'Shuffle'),
        ('random', 'Random'),
        ('sequential', 'Sequential'),
    ]
    playback_order = models.CharField(max_length=50, choices=ORDER_CHOICES, default='shuffle')
    
    remote_url = models.CharField(max_length=255, null=True, blank=True)
    remote_type = models.CharField(max_length=25, null=True, blank=True)
    remote_buffer = models.SmallIntegerField(default=0)
    
    is_enabled = models.BooleanField(default=True)
    is_jingle = models.BooleanField(default=False)
    avoid_duplicates = models.BooleanField(default=True)
    include_in_requests = models.BooleanField(default=True)
    include_in_on_demand = models.BooleanField(default=False)
    
    play_per_songs = models.SmallIntegerField(default=0)
    play_per_minutes = models.SmallIntegerField(default=0)
    play_per_hour_minute = models.SmallIntegerField(default=0)
    
    weight = models.SmallIntegerField(default=3)
    
    played_at = models.DateTimeField(null=True, blank=True)
    queue_reset_at = models.DateTimeField(null=True, blank=True)
    backend_options = models.CharField(max_length=255, null=True, blank=True)
    queue = models.JSONField(null=True, blank=True)

    media_items = models.ManyToManyField(
        'media.StationMedia',
        related_name='playlists',
        blank=True,
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'station_playlists'

class StationPlaylistFolder(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='playlist_folders')
    playlist = models.ForeignKey(StationPlaylist, on_delete=models.CASCADE, related_name='folders')
    path = models.CharField(max_length=500)

    class Meta:
        db_table = 'station_playlist_folders'

from django.contrib.auth.hashers import check_password, make_password

class StationStreamer(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='streamers')
    streamer_username = models.CharField(max_length=50)
    streamer_password = models.CharField(max_length=255)
    
    display_name = models.CharField(max_length=100, null=True, blank=True)
    comments = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    enforce_schedule = models.BooleanField(default=False)
    reactivate_at = models.IntegerField(null=True, blank=True)
    art_updated_at = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.streamer_username

    def authenticate(self, password):
        if not self.is_active:
            return False
        return check_password(password, self.streamer_password)

    def set_password(self, password):
        self.streamer_password = make_password(password)

    class Meta:
        db_table = 'station_streamers'
        unique_together = ('station', 'streamer_username')

class StationAdvertisement(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='advertisements')
    name = models.CharField(max_length=200)
    audio_file = models.FileField(upload_to='ads/', null=True, blank=True)
    media_path = models.CharField(max_length=500, null=True, blank=True)
    media_url = models.URLField(max_length=500, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    play_interval = models.SmallIntegerField(default=0, help_text="Play every X minutes (0 to disable)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'station_advertisements'

class StationSchedule(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='schedules', null=True, blank=True)
    playlist = models.ForeignKey(StationPlaylist, on_delete=models.CASCADE, related_name='schedule_items', null=True, blank=True)
    streamer = models.ForeignKey(StationStreamer, on_delete=models.CASCADE, related_name='schedule_items', null=True, blank=True)
    advertisement = models.ForeignKey(StationAdvertisement, on_delete=models.CASCADE, related_name='schedule_items', null=True, blank=True)
    
    start_time = models.SmallIntegerField(default=0) # HHMM
    end_time = models.SmallIntegerField(default=0) # HHMM
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    days = models.CharField(max_length=50, null=True, blank=True) # "1,2,3" (ISO-8601)
    
    loop_once = models.BooleanField(default=False)

    def __str__(self):
        def format_time(time_code):
            time_code = str(time_code).zfill(4)
            return f"{time_code[:2]}:{time_code[2:]}"
            
        parts = [f"{format_time(self.start_time)} to {format_time(self.end_time)}"]
        
        if self.start_date or self.end_date:
            if self.start_date == self.end_date:
                parts.append(str(self.start_date))
            else:
                parts.append(f"{self.start_date or ''} to {self.end_date or ''}")
                
        if self.days:
            day_map = {1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'}
            display_days = [day_map.get(int(d), d) for d in self.days.split(',')]
            parts.append("/".join(display_days))
            
        return ", ".join(parts)

    class Meta:
        db_table = 'station_schedules'

class StationHlsStream(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='hls_streams')
    name = models.CharField(max_length=100)
    
    FORMAT_CHOICES = [
        ('mp3', 'MP3'),
        ('aac', 'AAC (Low Complexity)'),
        ('aac_he_v1', 'HE-AAC v1'),
        ('aac_he_v2', 'HE-AAC v2'),
    ]
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='aac')
    bitrate = models.SmallIntegerField(default=128)
    
    listeners = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.station.name} HLS: {self.name}"

    class Meta:
        db_table = 'station_hls_streams'

class StationMount(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='mounts')
    name = models.CharField(max_length=100)
    display_name = models.CharField(max_length=255)
    
    is_visible_on_public_pages = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    
    fallback_mount = models.CharField(max_length=100, null=True, blank=True)
    relay_url = models.CharField(max_length=255, null=True, blank=True)
    authhash = models.CharField(max_length=255, null=True, blank=True)
    
    max_listener_duration = models.IntegerField(default=0)
    
    enable_autodj = models.BooleanField(default=True)
    autodj_format = models.CharField(max_length=10, null=True, blank=True) # mp3, aac, etc
    autodj_bitrate = models.SmallIntegerField(null=True, blank=True)
    
    custom_listen_url = models.CharField(max_length=255, null=True, blank=True)
    intro_path = models.CharField(max_length=255, null=True, blank=True)
    frontend_config = models.TextField(null=True, blank=True)
    
    listeners_unique = models.IntegerField(default=0)
    listeners_total = models.IntegerField(default=0)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'station_mounts'

class Relay(models.Model):
    name = models.CharField(max_length=100, default='Relay', null=True, blank=True)
    base_url = models.CharField(max_length=255)
    is_visible_on_public_pages = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'relays'

class StationRemote(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='remotes')
    relay = models.ForeignKey(Relay, on_delete=models.CASCADE, related_name='remotes', null=True, blank=True)
    display_name = models.CharField(max_length=255)
    is_visible_on_public_pages = models.BooleanField(default=True)
    
    TYPE_CHOICES = [
        ('icecast', 'Icecast'),
        ('shoutcast1', 'Shoutcast v1'),
        ('shoutcast2', 'Shoutcast v2'),
    ]
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    enable_autodj = models.BooleanField(default=False)
    autodj_format = models.CharField(max_length=10, null=True, blank=True)
    autodj_bitrate = models.SmallIntegerField(null=True, blank=True)
    
    custom_listen_url = models.CharField(max_length=255, null=True, blank=True)
    url = models.CharField(max_length=255)
    mount = models.CharField(max_length=150, null=True, blank=True)
    
    admin_password = models.CharField(max_length=100, null=True, blank=True)
    source_port = models.SmallIntegerField(null=True, blank=True)
    source_mount = models.CharField(max_length=150, null=True, blank=True)
    source_username = models.CharField(max_length=100, null=True, blank=True)
    source_password = models.CharField(max_length=100, null=True, blank=True)
    
    is_public = models.BooleanField(default=False)
    listeners_unique = models.IntegerField(default=0)
    listeners_total = models.IntegerField(default=0)

    def __str__(self):
        return self.display_name

    class Meta:
        db_table = 'station_remotes'

class SftpUser(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='sftp_users')
    username = models.CharField(max_length=32, unique=True)
    password = models.CharField(max_length=255)
    public_keys = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.username

    def set_password(self, password):
        self.password = make_password(password)

    def authenticate(self, password):
        return check_password(password, self.password)

    class Meta:
        db_table = 'sftp_user'
