from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from media.models import SongHistory
from analytics.models import Analytics
from stations.models import Station
from django.db.models import Avg, Min, Max, Count

class Command(BaseCommand):
    help = 'Aggregates song history data into analytics table'

    def handle(self, *args, **options):
        now = timezone.now()
        one_day_ago = now - timedelta(days=1)
        
        stations = Station.objects.all()
        for station in stations:
            # Daily aggregation
            daily_stats = SongHistory.objects.filter(
                station=station,
                timestamp_start__gte=one_day_ago
            ).aggregate(
                avg_listeners=Avg('listeners_start'),
                min_listeners=Min('listeners_start'),
                max_listeners=Max('listeners_start'),
                unique_listeners=Count('unique_listeners', distinct=True) # Simplified
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
            
            self.stdout.write(self.style.SUCCESS(f'Successfully aggregated daily analytics for {station.name}'))
