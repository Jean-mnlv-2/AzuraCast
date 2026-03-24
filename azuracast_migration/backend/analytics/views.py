from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from .models import Analytics, Listener
from .serializers import AnalyticsSerializer
import csv
from django.http import HttpResponse

class AnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Analytics.objects.all().order_by('-moment')
    serializer_class = AnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        station_short_name = self.kwargs.get('station_short_name')
        if station_short_name:
            queryset = queryset.filter(station__short_name=station_short_name)
        
        type_param = self.request.query_params.get('type')
        if type_param:
            queryset = queryset.filter(type=type_param)
            
        return queryset

    @action(detail=False, methods=['get'], url_path='(?P<station_short_name>[^/.]+)/geography')
    def geography(self, request, station_short_name=None):
        """Returns listener count by country."""
        data = Listener.objects.filter(
            station__short_name=station_short_name
        ).values('location_country').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response(data)

    @action(detail=False, methods=['get'], url_path='(?P<station_short_name>[^/.]+)/reports/royalty')
    def royalty_report(self, request, station_short_name=None):
        """Generates a CSV report for royalties."""
        from media.models import SongHistory
        
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')
        
        history = SongHistory.objects.filter(station__short_name=station_short_name)
        if start_date:
            history = history.filter(timestamp_start__gte=start_date)
        if end_date:
            history = history.filter(timestamp_start__lte=end_date)
            
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="royalty_report_{station_short_name}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Artist', 'Title', 'Album', 'Played At', 'Duration', 'Listeners'])
        
        for row in history.iterator():
            writer.writerow([
                row.song.artist,
                row.song.title,
                row.song.album,
                row.timestamp_start,
                row.duration,
                row.listeners_start,
            ])
            
        return response
