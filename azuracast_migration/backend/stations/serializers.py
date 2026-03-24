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

    class Meta:
        model = StationAdvertisement
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'station')

    def to_internal_value(self, data):
        if 'schedule_items' in data and isinstance(data['schedule_items'], str):
            import json
            try:
                mutable_data = data.dict()
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

class StationSerializer(serializers.ModelSerializer):
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
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
