from django.db import models

class Settings(models.Model):
    # App Identity
    app_unique_identifier = models.CharField(max_length=50, unique=True, null=True, blank=True)
    base_url = models.CharField(max_length=255, null=True, blank=True)
    instance_name = models.CharField(max_length=255, default='BantuWave')
    prefer_browser_url = models.BooleanField(default=True)
    use_radio_proxy = models.BooleanField(default=True)
    always_use_ssl = models.BooleanField(default=False)
    api_access_control = models.CharField(max_length=255, null=True, blank=True)
    
    # Branding
    public_theme = models.CharField(max_length=25, default='light')
    hide_album_art = models.BooleanField(default=False)
    homepage_redirect_url = models.CharField(max_length=255, null=True, blank=True)
    default_album_art_url = models.CharField(max_length=255, null=True, blank=True)
    hide_product_name = models.BooleanField(default=False)
    public_custom_css = models.TextField(null=True, blank=True)
    public_custom_js = models.TextField(null=True, blank=True)
    internal_custom_css = models.TextField(null=True, blank=True)
    
    # System settings
    history_keep_days = models.IntegerField(default=14)
    enable_liquidsoap_editing = models.BooleanField(default=True)
    enable_static_nowplaying = models.BooleanField(default=False)
    analytics = models.CharField(max_length=50, default='all')
    check_for_updates = models.BooleanField(default=True)
    update_results = models.JSONField(null=True, blank=True)
    update_last_run = models.IntegerField(default=0)
    setup_complete_time = models.IntegerField(default=0)
    sync_disabled = models.BooleanField(default=False)
    sync_last_run = models.IntegerField(default=0)
    external_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # External Services
    use_external_album_art_when_processing_media = models.BooleanField(default=False)
    use_external_album_art_in_apis = models.BooleanField(default=False)
    last_fm_api_key = models.CharField(max_length=255, null=True, blank=True)
    geolite_license_key = models.CharField(max_length=255, null=True, blank=True)
    geolite_last_run = models.IntegerField(default=0)
    
    # Backup settings
    backup_enabled = models.BooleanField(default=False)
    backup_time_code = models.CharField(max_length=4, null=True, blank=True)
    backup_exclude_media = models.BooleanField(default=False)
    backup_keep_copies = models.SmallIntegerField(default=0)
    backup_storage_location = models.IntegerField(null=True, blank=True)
    backup_format = models.CharField(max_length=25, default='zip')
    backup_last_run = models.IntegerField(default=0)
    backup_last_output = models.TextField(null=True, blank=True)
    
    # Mail settings
    mail_enabled = models.BooleanField(default=False)
    mail_sender_name = models.CharField(max_length=150, null=True, blank=True)
    mail_sender_email = models.EmailField(null=True, blank=True)
    mail_smtp_host = models.CharField(max_length=255, null=True, blank=True)
    mail_smtp_port = models.IntegerField(default=587)
    mail_smtp_secure = models.CharField(max_length=25, default='tls')
    mail_smtp_auth = models.BooleanField(default=False)
    mail_smtp_user = models.CharField(max_length=255, null=True, blank=True)
    mail_smtp_password = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'settings'
        verbose_name_plural = 'settings'

    @classmethod
    def get_instance(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj
