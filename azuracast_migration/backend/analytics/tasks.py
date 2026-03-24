from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from media.models import SongHistory
from analytics.models import Analytics
from stations.models import Station
from django.db.models import Avg, Min, Max, Count

@shared_task
def aggregate_analytics_daily():
    now = timezone.now()
    one_day_ago = now - timedelta(days=1)
    
    stations = Station.objects.all()
    for station in stations:
        daily_stats = SongHistory.objects.filter(
            station=station,
            timestamp_start__gte=one_day_ago
        ).aggregate(
            avg_listeners=Avg('listeners_start'),
            min_listeners=Min('listeners_start'),
            max_listeners=Max('listeners_start'),
            unique_listeners=Count('unique_listeners', distinct=True)
        )
        
        Analytics.objects.update_or_create(
            station=station,
            type='daily',
            moment=now.date(),
            defaults={
                'number_avg': daily_stats['avg_listeners'] or 0,
                'number_min': daily_stats['min_listeners'] or 0,
                'number_max': daily_stats['max_listeners'] or 0,
                'number_unique': daily_stats['unique_listeners'] or 0,
            }
        )
    return f"Aggregated daily analytics for {stations.count()} stations"

@shared_task
def aggregate_analytics_hourly():
    now = timezone.now()
    one_hour_ago = now - timedelta(hours=1)
    
    stations = Station.objects.all()
    for station in stations:
        # Hourly aggregation
        hourly_stats = SongHistory.objects.filter(
            station=station,
            timestamp_start__gte=one_hour_ago
        ).aggregate(
            avg_listeners=Avg('listeners_start'),
            min_listeners=Min('listeners_start'),
            max_listeners=Max('listeners_start'),
            unique_listeners=Count('unique_listeners', distinct=True)
        )
        
        Analytics.objects.update_or_create(
            station=station,
            type='hourly',
            moment=now.replace(minute=0, second=0, microsecond=0),
            defaults={
                'number_avg': hourly_stats['avg_listeners'] or 0,
                'number_min': hourly_stats['min_listeners'] or 0,
                'number_max': hourly_stats['max_listeners'] or 0,
                'number_unique': hourly_stats['unique_listeners'] or 0,
            }
        )
    return f"Aggregated hourly analytics for {stations.count()} stations"
