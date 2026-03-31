from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import os
import re
from media.models import SongHistory
from analytics.models import Analytics, AdvertisementPlayback
from stations.models import Station, StationAdvertisement
from django.db.models import Avg, Min, Max, Count

@shared_task
def scan_advertisement_logs():
    """
    Scans Liquidsoap logs for confirmation of ad playbacks.
    """
    stations = Station.objects.all()
    confirmed_count = 0
    
    for station in stations:
        log_path = os.path.join(station.radio_base_dir, 'config', 'liquidsoap.log')
        if not os.path.exists(log_path):
            continue
            
        try:
            with open(log_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                unconfirmed = AdvertisementPlayback.objects.filter(
                    station=station,
                    is_confirmed_by_log=False,
                    timestamp_start__gte=timezone.now() - timedelta(hours=1)
                )
                
                for playback in unconfirmed:
                    pattern = rf"ad_id=\"{playback.advertisement.id}\""
                    if re.search(pattern, content):
                        playback.is_confirmed_by_log = True
                        lines = content.split('\n')
                        for line in lines:
                            if pattern in line:
                                playback.log_line = line
                                break
                        playback.save()
                        confirmed_count += 1
        except Exception as e:
            print(f"Error scanning logs for station {station.short_name}: {e}")
            
    return f"Confirmed {confirmed_count} ad playbacks from logs"

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

@shared_task
def send_weekly_audience_reports():
    """
    Weekly task to send audience summaries to station owners.
    Centralized SMTP ensures all reports are sent from the same brain.
    """
    from bantuwave.emails import send_audience_report
    
    now = timezone.now()
    one_week_ago = now - timedelta(days=7)
    
    stations = Station.objects.all().select_related('creator')
    sent_count = 0
    
    for station in stations:
        if not station.creator or not station.creator.email:
            continue
            
        # Get stats for the week
        stats = Analytics.objects.filter(
            station=station,
            type='daily',
            moment__gte=one_week_ago.date()
        ).aggregate(
            avg_listeners=Avg('number_avg'),
            max_listeners=Max('number_max'),
            total_unique=Avg('number_unique') # Simplified
        )
        
        report_data = {
            'avg': round(stats['avg_listeners'] or 0, 1),
            'max': stats['max_listeners'] or 0,
            'unique': int(stats['total_unique'] or 0),
            'period': f"{one_week_ago.strftime('%d/%m')} - {now.strftime('%d/%m/%Y')}"
        }
        
        if send_audience_report(station.creator, station, report_data):
            sent_count += 1
            
    return f"Sent {sent_count} weekly audience reports"
