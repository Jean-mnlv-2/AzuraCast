from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Max, Avg, Q, F
from django.utils import timezone
from .models import Analytics, Listener, AdvertisementPlayback
from .serializers import AnalyticsSerializer
from users.permissions import IsBantuWaveAdmin
from billing.models import Subscription, Plan, Transaction
from stations.models import Station
import csv
import docker
import psutil
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

    @action(detail=False, methods=['get'], url_path='global-dashboard', permission_classes=[IsBantuWaveAdmin])
    def global_dashboard(self, request):
        """
        Global Dashboard for SuperAdmin.
        Returns Business KPIs (MRR, Churn) and Technical KPIs (CPU, BW, Listeners).
        """
        # 1. Business KPIs
        active_subs = Subscription.objects.filter(status='active')
        mrr = active_subs.aggregate(total=Sum('plan__price_monthly'))['total'] or 0
        total_subscribers = active_subs.count()
        
        last_30_days = timezone.now() - timezone.timedelta(days=30)
        canceled_last_30 = Subscription.objects.filter(status='canceled', updated_at__gte=last_30_days).count()
        total_at_start = Subscription.objects.exclude(status='canceled').count() + canceled_last_30
        churn_rate = (canceled_last_30 / total_at_start * 100) if total_at_start > 0 else 0
        
        # 2. Technical KPIs
        cpu_usage = psutil.cpu_percent(interval=0.1)
        memory_usage = psutil.virtual_memory().percent
        
        unique_listeners = Listener.objects.filter(timestamp_end__isnull=True).values('listener_ip').distinct().count()
        
        est_bandwidth_gbps = (unique_listeners * 128 / 1024 / 1024) if unique_listeners > 0 else 0
        
        # 3. Critical Alerts
        critical_alerts = []
        offline_stations = Station.objects.filter(is_enabled=True, has_started=False).count()
        if offline_stations > 0:
            critical_alerts.append({
                'level': 'critical',
                'message': f"{offline_stations} stations are currently offline/unreachable."
            })
            
        past_due = Subscription.objects.filter(status='past_due').count()
        if past_due > 0:
            critical_alerts.append({
                'level': 'warning',
                'message': f"{past_due} subscriptions are past due."
            })

        return Response({
            'business': {
                'mrr': mrr,
                'total_subscribers': total_subscribers,
                'churn_rate': round(churn_rate, 2),
                'currency': 'XAF'
            },
            'technical': {
                'cpu_usage': cpu_usage,
                'memory_usage': memory_usage,
                'unique_listeners': unique_listeners,
                'bandwidth_gbps': round(est_bandwidth_gbps, 3)
            },
            'alerts': critical_alerts
        })

    @action(detail=False, methods=['get'], url_path='(?P<station_short_name>[^/.]+)/advertisements')
    def advertisement_report(self, request, station_short_name=None):
        """
        Returns a summary report for advertisements on a specific station.
        Includes play count, reach (listeners), and log confirmation status.
        """
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')
        
        playback = AdvertisementPlayback.objects.filter(
            station__short_name=station_short_name
        )
        
        if start_date:
            playback = playback.filter(timestamp_start__gte=start_date)
        if end_date:
            playback = playback.filter(timestamp_start__lte=end_date)
            
        report = playback.values(
            'advertisement__id', 
            'advertisement__name',
            'advertisement__target_plays'
        ).annotate(
            total_plays=Count('id'),
            confirmed_plays=Count('id', filter=Q(is_confirmed_by_log=True)),
            avg_listeners=Avg('listeners_start'),
            max_listeners=Max('listeners_start'),
        ).order_by('-total_plays')
        
        for item in report:
            ad_id = item['advertisement__id']
            target = item['advertisement__target_plays'] or 0
            
            item['progress_percentage'] = round((item['total_plays'] / target * 100), 1) if target > 0 else 100
            
            ad_playbacks = playback.filter(advertisement_id=ad_id)
            
            unique_ips = set()
            for p in ad_playbacks:
                listeners = Listener.objects.filter(
                    station__short_name=station_short_name,
                    timestamp_start__lt=p.timestamp_end or timezone.now(),
                    timestamp_end__gt=p.timestamp_start
                ).values_list('listener_ip', flat=True)
                unique_ips.update(listeners)
            
            item['unique_listeners'] = len(unique_ips)
            
        return Response(report)

    @action(detail=False, methods=['get'], url_path='(?P<station_short_name>[^/.]+)/minim-impact')
    def minim_impact(self, request, station_short_name=None):
        """Returns Minim enrichment and streaming conversion metrics."""
        from media.models import StationMedia, SongHistory
        
        total_media = StationMedia.objects.filter(storage_location__station__short_name=station_short_name).count()
        enriched_media = StationMedia.objects.filter(
            storage_location__station__short_name=station_short_name,
            isrc__isnull=False
        ).exclude(isrc='').count()
        
        history = SongHistory.objects.filter(station__short_name=station_short_name)
        total_clicks = history.aggregate(
            spotify=Sum('clicks_spotify'),
            apple=Sum('clicks_apple_music')
        )
        
        return Response({
            'enrichment_rate': round((enriched_media / total_media * 100), 1) if total_media > 0 else 0,
            'total_media': total_media,
            'enriched_media': enriched_media,
            'clicks': total_clicks
        })

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
