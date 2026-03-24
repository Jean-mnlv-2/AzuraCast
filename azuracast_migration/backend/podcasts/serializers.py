from rest_framework import serializers
from .models import Podcast, PodcastEpisode, PodcastMedia, PodcastCategory

class PodcastCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PodcastCategory
        fields = '__all__'

class PodcastMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PodcastMedia
        fields = '__all__'

class PodcastEpisodeSerializer(serializers.ModelSerializer):
    media = PodcastMediaSerializer(read_only=True)
    
    class Meta:
        model = PodcastEpisode
        fields = '__all__'

class PodcastSerializer(serializers.ModelSerializer):
    episodes = PodcastEpisodeSerializer(many=True, read_only=True)
    categories = PodcastCategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Podcast
        fields = '__all__'
