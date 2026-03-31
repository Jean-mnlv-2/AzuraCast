from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
from .models import Podcast, PodcastEpisode, PodcastCategory, PodcastMedia
from .serializers import PodcastSerializer, PodcastEpisodeSerializer, PodcastCategorySerializer, PodcastMediaSerializer
import xml.etree.ElementTree as ET

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

    @action(detail=True, methods=['get'], url_path='feed')
    def feed(self, request, pk=None):
        podcast = self.get_object()
        now = timezone.now()
        episodes = podcast.episodes.filter(is_published=True, publish_at__lte=now).order_by('-publish_at')
        
        rss = ET.Element('rss', {
            'version': '2.0',
            'xmlns:itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
            'xmlns:content': 'http://purl.org/rss/1.0/modules/content/'
        })
        
        channel = ET.SubElement(rss, 'channel')
        ET.SubElement(channel, 'title').text = podcast.title
        ET.SubElement(channel, 'description').text = podcast.description or ''
        ET.SubElement(channel, 'link').text = podcast.link or request.build_absolute_uri('/')
        ET.SubElement(channel, 'language').text = podcast.language
        ET.SubElement(channel, 'itunes:author').text = podcast.author or podcast.station.name
        
        if podcast.image:
            img_url = request.build_absolute_uri(podcast.image.url)
            ET.SubElement(channel, 'itunes:image', {'href': img_url})
            img = ET.SubElement(channel, 'image')
            ET.SubElement(img, 'url').text = img_url
            ET.SubElement(img, 'title').text = podcast.title
            ET.SubElement(img, 'link').text = podcast.link or request.build_absolute_uri('/')

        for category in podcast.categories.all():
            ET.SubElement(channel, 'itunes:category', {'text': category.title})

        for ep in episodes:
            item = ET.SubElement(channel, 'item')
            ET.SubElement(item, 'title').text = ep.title
            ET.SubElement(item, 'description').text = ep.description or ''
            ET.SubElement(item, 'pubDate').text = ep.publish_at.strftime('%a, %d %b %Y %H:%M:%S %z')
            ET.SubElement(item, 'itunes:explicit').text = 'yes' if ep.explicit else 'no'
            
            if ep.episode: ET.SubElement(item, 'itunes:episode').text = str(ep.episode)
            if ep.season: ET.SubElement(item, 'itunes:season').text = str(ep.season)
            ET.SubElement(item, 'itunes:episodeType').text = ep.episode_type

            if hasattr(ep, 'media'):
                media = ep.media
                file_url = request.build_absolute_uri(f"/media/{media.path}")
                ET.SubElement(item, 'enclosure', {
                    'url': file_url,
                    'length': str(int(media.length or 0)),
                    'type': 'audio/mpeg'
                })
                ET.SubElement(item, 'guid', {'isPermaLink': 'false'}).text = f"episode-{ep.id}"

        xml_str = ET.tostring(rss, encoding='utf-8', method='xml')
        return HttpResponse(xml_str, content_type='application/rss+xml')

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

    @action(detail=True, methods=['post'], url_path='media')
    def attach_media(self, request, pk=None):
        episode = self.get_object()
        media_id = request.data.get('media_id')
        if not media_id:
            return Response({'error': 'media_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from media.models import StationMedia
        station_media = get_object_or_404(StationMedia, pk=media_id)
        
        PodcastMedia.objects.update_or_create(
            episode=episode,
            defaults={
                'storage_location': station_media.storage_location,
                'path': station_media.path,
                'length': station_media.length or 0,
                'length_text': station_media.length_text
            }
        )
        return Response({'status': 'media_attached'})
