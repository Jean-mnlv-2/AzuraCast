from rest_framework import serializers
from .models import StationQueue, StationRequest
from media.serializers import SongSerializer, StationMediaSerializer

class StationQueueSerializer(serializers.ModelSerializer):
    song = serializers.SerializerMethodField()
    media = StationMediaSerializer(read_only=True)
    
    # Custom fields for Liquidsoap annotations
    liq_amplify = serializers.FloatField(source='media.amplify', read_only=True)
    liq_cue_in = serializers.FloatField(source='media.cue_in', read_only=True)
    liq_cue_out = serializers.FloatField(source='media.cue_out', read_only=True)
    liq_fade_in = serializers.FloatField(source='media.fade_in', read_only=True)
    liq_fade_out = serializers.FloatField(source='media.fade_out', read_only=True)
    
    class Meta:
        model = StationQueue
        fields = '__all__'

    def get_song(self, obj):
        if not obj.media:
            return None
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
