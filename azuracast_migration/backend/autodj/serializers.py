from rest_framework import serializers
from .models import StationQueue, StationRequest
from media.serializers import SongSerializer, StationMediaSerializer

class StationQueueSerializer(serializers.ModelSerializer):
    song = serializers.SerializerMethodField()
    media = StationMediaSerializer(read_only=True)
    
    # Custom fields for Liquidsoap annotations
    liq_amplify = serializers.SerializerMethodField()
    liq_cue_in = serializers.SerializerMethodField()
    liq_cue_out = serializers.SerializerMethodField()
    liq_fade_in = serializers.SerializerMethodField()
    liq_fade_out = serializers.SerializerMethodField()
    
    class Meta:
        model = StationQueue
        fields = '__all__'

    def get_liq_amplify(self, obj):
        return obj.media.amplify if obj.media else 0.0

    def get_liq_cue_in(self, obj):
        return obj.media.cue_in if obj.media else 0.0

    def get_liq_cue_out(self, obj):
        return obj.media.cue_out if obj.media else 0.0

    def get_liq_fade_in(self, obj):
        return obj.media.fade_in if obj.media else 0.0

    def get_liq_fade_out(self, obj):
        return obj.media.fade_out if obj.media else 0.0

    def get_song(self, obj):
        if not obj.media:
            return {
                'id': None,
                'title': obj.title,
                'artist': obj.artist,
                'album': obj.album,
                'length': obj.duration,
                'art': None,
                'created_at': None,
                'updated_at': None,
            }
        if obj.media.song_id:
            return SongSerializer(obj.media.song).data
        return {
            'id': None,
            'title': obj.media.title,
            'artist': obj.media.artist,
            'album': obj.media.album,
            'length': obj.media.length,
            'art': None,
            'created_at': None,
            'updated_at': None,
        }

class StationRequestSerializer(serializers.ModelSerializer):
    track = StationMediaSerializer(read_only=True)
    
    class Meta:
        model = StationRequest
        fields = '__all__'
