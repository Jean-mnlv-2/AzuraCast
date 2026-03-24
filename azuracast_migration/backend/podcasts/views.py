from rest_framework import viewsets, permissions
from .models import Podcast, PodcastEpisode, PodcastCategory
from .serializers import PodcastSerializer, PodcastEpisodeSerializer, PodcastCategorySerializer

class PodcastCategoryViewSet(viewsets.ModelViewSet):
    queryset = PodcastCategory.objects.all()
    serializer_class = PodcastCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class PodcastViewSet(viewsets.ModelViewSet):
    queryset = Podcast.objects.all()
    serializer_class = PodcastSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Podcast.objects.all()
        station_id = self.request.query_params.get('station_id')
        if station_id:
            queryset = queryset.filter(station_id=station_id)
        return queryset

class PodcastEpisodeViewSet(viewsets.ModelViewSet):
    queryset = PodcastEpisode.objects.all()
    serializer_class = PodcastEpisodeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = PodcastEpisode.objects.all()
        podcast_id = self.request.query_params.get('podcast_id')
        if podcast_id:
            queryset = queryset.filter(podcast_id=podcast_id)
        return queryset
