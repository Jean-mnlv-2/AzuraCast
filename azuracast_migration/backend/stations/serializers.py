from rest_framework import serializers
from .models import Station, StationPlaylist, StationPlaylistFolder, StationStreamer, StationSchedule, StationMount, StationRemote, Relay, StationHlsStream, SftpUser, StationAdvertisement
from media.serializers import StorageLocationSerializer

class RelaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Relay
        fields = '__all__'

class StationMountSerializer(serializers.ModelSerializer):
    station = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = StationMount
        fields = '__all__'
        read_only_fields = ('station',)

class StationRemoteSerializer(serializers.ModelSerializer):
    relay = RelaySerializer(read_only=True)
    station = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = StationRemote
        fields = '__all__'
        read_only_fields = ('station',)

class StationHlsStreamSerializer(serializers.ModelSerializer):
    station = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = StationHlsStream
        fields = '__all__'
        read_only_fields = ('station',)

class SftpUserSerializer(serializers.ModelSerializer):
    station = serializers.PrimaryKeyRelatedField(read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = SftpUser
        fields = ('id', 'station', 'username', 'public_keys', 'password')
        read_only_fields = ('id', 'station')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Ce champ est obligatoire.'})
        user = SftpUser(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class StationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationSchedule
        fields = '__all__'

class StationPlaylistFolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationPlaylistFolder
        fields = '__all__'
        read_only_fields = ('station', 'playlist')

class StationPlaylistSerializer(serializers.ModelSerializer):
    schedule_items = StationScheduleSerializer(many=True, read_only=True)
    folders = StationPlaylistFolderSerializer(many=True, read_only=True)
    station = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = StationPlaylist
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'station')

class StationStreamerSerializer(serializers.ModelSerializer):
    schedule_items = StationScheduleSerializer(many=True, read_only=True)
    station = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = StationStreamer
        fields = ('id', 'station', 'streamer_username', 'display_name', 'is_active', 'created_at', 'updated_at', 'schedule_items', 'streamer_password')
        read_only_fields = ('created_at', 'updated_at', 'station')
        extra_kwargs = {
            'streamer_password': {'write_only': True}
        }

class StationAdvertisementSerializer(serializers.ModelSerializer):
    schedule_items = StationScheduleSerializer(many=True, required=False)
    station = serializers.PrimaryKeyRelatedField(read_only=True)
    
    playback_count = serializers.SerializerMethodField()
    playback_count_24h = serializers.SerializerMethodField()
    unique_listeners = serializers.SerializerMethodField()
    plays_progress_percentage = serializers.SerializerMethodField()
    listeners_progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = StationAdvertisement
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'station')

    def get_plays_progress_percentage(self, obj):
        if obj.target_plays <= 0:
            return 100
        count = obj.playback_history.count()
        return round((count / obj.target_plays) * 100, 1)

    def get_listeners_progress_percentage(self, obj):
        if obj.target_listeners <= 0:
            return 100
        count = self.get_unique_listeners(obj)
        return round((count / obj.target_listeners) * 100, 1)

    def get_playback_count(self, obj):
        return obj.playback_history.count()

    def get_playback_count_24h(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        yesterday = timezone.now() - timedelta(days=1)
        return obj.playback_history.filter(timestamp_start__gte=yesterday).count()

    def get_unique_listeners(self, obj):
        from analytics.models import Listener
        from django.utils import timezone
        
        playbacks = obj.playback_history.all()
        unique_ips = set()
        
        for p in playbacks:
            listeners = Listener.objects.filter(
                station=obj.station,
                timestamp_start__lt=p.timestamp_end or timezone.now(),
                timestamp_end__gt=p.timestamp_start
            ).values_list('listener_ip', flat=True)
            unique_ips.update(listeners)
            
        return len(unique_ips)

    def to_internal_value(self, data):
        if 'schedule_items' in data and isinstance(data['schedule_items'], str):
            import json
            try:
                if hasattr(data, 'dict'):
                    mutable_data = data.dict()
                else:
                    mutable_data = dict(data)
                mutable_data['schedule_items'] = json.loads(data['schedule_items'])
                return super().to_internal_value(mutable_data)
            except (json.JSONDecodeError, AttributeError):
                pass
        return super().to_internal_value(data)

    def create(self, validated_data):
        schedule_data = validated_data.pop('schedule_items', [])
        ad = StationAdvertisement.objects.create(**validated_data)
        for schedule in schedule_data:
            StationSchedule.objects.create(advertisement=ad, station=ad.station, **schedule)
        return ad

    def update(self, instance, validated_data):
        schedule_data = validated_data.pop('schedule_items', None)
        instance = super().update(instance, validated_data)
        if schedule_data is not None:
            instance.schedule_items.all().delete()
            for schedule in schedule_data:
                StationSchedule.objects.create(advertisement=instance, station=instance.station, **schedule)
        return instance

from users.serializers import UserSerializer

class StationSerializer(serializers.ModelSerializer):
    creator_details = UserSerializer(source='creator', read_only=True)
    playlists = StationPlaylistSerializer(many=True, read_only=True)
    streamers = StationStreamerSerializer(many=True, read_only=True)
    advertisements = StationAdvertisementSerializer(many=True, read_only=True)
    mounts = StationMountSerializer(many=True, read_only=True)
    remotes = StationRemoteSerializer(many=True, read_only=True)
    hls_streams = StationHlsStreamSerializer(many=True, read_only=True)
    sftp_users = SftpUserSerializer(many=True, read_only=True)
    
    media_storage_location = StorageLocationSerializer(read_only=True)
    recordings_storage_location = StorageLocationSerializer(read_only=True)
    podcasts_storage_location = StorageLocationSerializer(read_only=True)
    backups_storage_location = StorageLocationSerializer(read_only=True)

    class Meta:
        model = Station
        fields = [
            'id', 'name', 'short_name', 'is_enabled', 'logo', 'logo_external_url', 'creator', 'creator_details',
            'frontend_type', 'frontend_config', 'backend_type', 'backend_config',
            'description', 'url', 'stream_url', 'genre', 'language', 'country',
            'radio_base_dir', 'enable_requests', 'request_delay', 'request_threshold',
            'disconnect_deactivate_streamer', 'enable_streamers', 'is_streamer_live',
            'enable_public_page', 'enable_public_api', 'enable_on_demand',
            'enable_on_demand_download', 'enable_hls', 'api_history_items',
            'timezone', 'max_bitrate', 'max_mounts', 'max_hls_streams',
            'branding_config', 'ad_config', 'cdn_url', 'hls_cdn_url',
            'adapter_api_key', 'fallback_path', 'media_storage_location',
            'recordings_storage_location', 'podcasts_storage_location',
            'backups_storage_location', 'needs_restart', 'has_started', 'plan',
            'created_at', 'updated_at', 'playlists', 'streamers',
            'advertisements', 'mounts', 'remotes', 'hls_streams', 'sftp_users'
        ]
        read_only_fields = ('created_at', 'updated_at', 'creator', 'has_started')
