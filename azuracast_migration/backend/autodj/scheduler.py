import datetime
import pytz
from django.utils import timezone
from stations.models import StationPlaylist, StationSchedule, StationStreamer, StationAdvertisement
from .models import StationQueue
from bantuwave.services import GeoLiteService

class Scheduler:
    def should_advertisement_play_now(self, advertisement: StationAdvertisement, now: datetime.datetime = None, listener_ip: str = None) -> bool:
        if now is None:
            now = timezone.now()
        
        if not advertisement.is_active or advertisement.play_interval <= 0:
            return False

        if listener_ip and (advertisement.target_countries or advertisement.target_cities):
            geo_service = GeoLiteService()
            location = geo_service.get_location(listener_ip)
            
            if advertisement.target_countries:
                target_countries = [c.strip().upper() for c in advertisement.target_countries.split(',')]
                if location['country'] not in target_countries:
                    return False
            
            if advertisement.target_cities:
                target_cities = [c.strip().lower() for c in advertisement.target_cities.split(',')]
                if location['city'].lower() not in target_cities:
                    return False

        if advertisement.target_plays > 0:
            current_plays = advertisement.playback_history.count()
            if current_plays >= advertisement.target_plays:
                return False

        if advertisement.target_listeners > 0:
            from analytics.models import Listener
            playbacks = advertisement.playback_history.all()
            unique_ips = set()
            for p in playbacks:
                listeners = Listener.objects.filter(
                    station=advertisement.station,
                    timestamp_start__lt=p.timestamp_end or timezone.now(),
                    timestamp_end__gt=p.timestamp_start
                ).values_list('listener_ip', flat=True)
                unique_ips.update(listeners)
            
            if len(unique_ips) >= advertisement.target_listeners:
                return False

        schedule_items = advertisement.schedule_items.all()
        if schedule_items.exists():
            station_tz = pytz.timezone(advertisement.station.timezone or 'UTC')
            local_now = now.astimezone(station_tz)
            
            is_scheduled = False
            for item in schedule_items:
                if self.should_schedule_play_now(item, local_now):
                    is_scheduled = True
                    break
            
            if not is_scheduled:
                return False

        if not advertisement.last_played_at:
            return True
            
        diff = now - advertisement.last_played_at
        return diff.total_seconds() >= (advertisement.play_interval * 60)

    def should_playlist_play_now(self, playlist: StationPlaylist, now: datetime.datetime = None) -> bool:
        if now is None:
            now = timezone.now()
        
        # Convert 'now' to station's local time for schedule checks
        station_tz = pytz.timezone(playlist.station.timezone or 'UTC')
        local_now = now.astimezone(station_tz)
        
        if not self.is_playlist_scheduled_to_play_now(playlist, local_now):
            return False
            
        if playlist.type == 'once_per_hour':
            return self.should_playlist_play_now_per_hour(playlist, local_now)
        elif playlist.type == 'once_per_x_songs':
            return self.should_playlist_play_now_per_songs(playlist, local_now)
        elif playlist.type == 'once_per_x_minutes':
            return self.should_playlist_play_now_per_minutes(playlist, local_now)
            
        return True

    def is_playlist_scheduled_to_play_now(self, playlist: StationPlaylist, now: datetime.datetime) -> bool:
        schedule_items = playlist.schedule_items.all()
        if not schedule_items.exists():
            return True
            
        for item in schedule_items:
            if self.should_schedule_play_now(item, now):
                return True
        return False

    def should_schedule_play_now(self, schedule: StationSchedule, now: datetime.datetime) -> bool:
        current_time = int(now.strftime('%H%M'))
        
        # Handle overnight schedules
        is_time_match = False
        if schedule.start_time > schedule.end_time:
            if current_time >= schedule.start_time or current_time <= schedule.end_time:
                is_time_match = True
        else:
            if schedule.start_time <= current_time <= schedule.end_time:
                is_time_match = True
        
        if not is_time_match:
            return False
            
        return self._check_day_and_date(schedule, now)

    def _check_day_and_date(self, schedule: StationSchedule, now: datetime.datetime) -> bool:
        if schedule.start_date and now.date() < schedule.start_date:
            return False
        if schedule.end_date and now.date() > schedule.end_date:
            return False
            
        if schedule.days:
            day_of_week = str(now.isoweekday())
            if day_of_week not in schedule.days.split(','):
                return False
        return True

    def should_playlist_play_now_per_hour(self, playlist: StationPlaylist, now: datetime.datetime) -> bool:
        current_minute = now.minute
        target_minute = playlist.play_per_hour_minute
        
        if current_minute < target_minute:
            target_time = now - datetime.timedelta(hours=1)
            target_time = target_time.replace(minute=target_minute, second=0, microsecond=0)
        else:
            target_time = now.replace(minute=target_minute, second=0, microsecond=0)
            
        diff = (now - target_time).total_seconds() / 60
        
        if diff < 0 or diff > 15:
            return False
            
        return not self.was_playlist_played_in_last_x_minutes(playlist, now, 30)

    def was_playlist_played_in_last_x_minutes(self, playlist: StationPlaylist, now: datetime.datetime, minutes: int) -> bool:
        if not playlist.played_at:
            return False
            
        diff = now - playlist.played_at
        return diff.total_seconds() < (minutes * 60)

    def should_playlist_play_now_per_songs(self, playlist: StationPlaylist, now: datetime.datetime) -> bool:
        play_per_songs = playlist.play_per_songs
        if play_per_songs <= 0:
            return True

        recent_played_ids = StationQueue.objects.filter(
            station=playlist.station,
            is_visible=True
        ).order_by('-id')[:play_per_songs].values_list('playlist_id', flat=True)
        
        return playlist.id not in recent_played_ids

    def should_playlist_play_now_per_minutes(self, playlist: StationPlaylist, now: datetime.datetime) -> bool:
        if playlist.play_per_minutes <= 0:
            return True

        return not self.was_playlist_played_in_last_x_minutes(playlist, now, playlist.play_per_minutes)

    def can_streamer_stream_now(self, streamer: StationStreamer, now: datetime.datetime = None) -> bool:
        if now is None:
            now = timezone.now()
            
        schedule_items = streamer.schedule_items.all()
        if not schedule_items.exists():
            return True
            
        for item in schedule_items:
            if self.should_schedule_play_now(item, now):
                return True
        return False
