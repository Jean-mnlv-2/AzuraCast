from django.contrib import admin
from .models import Station, StationPlaylist, StationStreamer, StationPlaylistFolder

@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ('name', 'short_name', 'creator', 'country', 'is_enabled', 'frontend_type', 'backend_type', 'created_at')
    list_filter = ('is_enabled', 'frontend_type', 'backend_type', 'country', 'creator')
    search_fields = ('name', 'short_name', 'description')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('name', 'short_name', 'description', 'is_enabled', 'creator')}),
        ('Location', {'fields': ('country', 'language', 'timezone')}),
        ('Frontend/Backend', {'fields': ('frontend_type', 'frontend_config', 'backend_type', 'backend_config')}),
        ('URLs', {'fields': ('url', 'stream_url', 'cdn_url', 'hls_cdn_url')}),
        ('Features', {'fields': ('enable_requests', 'enable_streamers', 'enable_public_page', 'enable_hls')}),
        ('Storage', {'fields': ('radio_base_dir', 'media_storage_location', 'recordings_storage_location', 'podcasts_storage_location', 'backups_storage_location')}),
        ('System', {'fields': ('needs_restart', 'has_started', 'adapter_api_key')}),
        ('Important dates', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')

@admin.register(StationPlaylist)
class StationPlaylistAdmin(admin.ModelAdmin):
    list_display = ('name', 'station', 'type', 'source', 'is_enabled', 'weight')
    list_filter = ('station', 'type', 'source', 'is_enabled')
    search_fields = ('name', 'description')

@admin.register(StationStreamer)
class StationStreamerAdmin(admin.ModelAdmin):
    list_display = ('streamer_username', 'station', 'display_name', 'is_active')
    list_filter = ('station', 'is_active')
    search_fields = ('streamer_username', 'display_name')
