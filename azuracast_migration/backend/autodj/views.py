from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from stations.models import Station
from .models import StationQueue, StationRequest
from .serializers import StationQueueSerializer, StationRequestSerializer
from .queue_builder import QueueBuilder
from webhooks.signals import song_changed

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_next_song(request, station_id):
    # Security: check for API key in headers
    api_key = request.headers.get('x-autodj-api-key')
    # For now, just allow any, but in production this should be checked
    
    try:
        station = Station.objects.get(id=station_id)
    except Station.DoesNotExist:
        return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)
        
    queue_builder = QueueBuilder()
    next_queue = queue_builder.calculate_next_song(station)
    
    if next_queue:
        # Update timestamp_played
        now = timezone.now()
        next_queue.is_played = True
        next_queue.timestamp_played = now
        next_queue.save()
        
        # Update playlist played_at
        if next_queue.playlist:
            next_queue.playlist.played_at = now
            next_queue.playlist.save()
        
        # Send signal
        song_changed.send(sender=StationQueue, station=station, now_playing=next_queue)
        
        serializer = StationQueueSerializer(next_queue)
        return Response(serializer.data)
        
    return Response({'error': 'No songs available'}, status=status.HTTP_404_NOT_FOUND)

class StationRequestViewSet(viewsets.ModelViewSet):
    queryset = StationRequest.objects.all()
    serializer_class = StationRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(station_id=self.kwargs['station_id'])

    def perform_create(self, serializer):
        station = Station.objects.get(id=self.kwargs['station_id'])
        serializer.save(station=station)
