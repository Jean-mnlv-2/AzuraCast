import datetime
from django.test import TestCase
from django.utils import timezone
from stations.models import Station, StationPlaylist, StationSchedule
from autodj.scheduler import Scheduler

class SchedulerTest(TestCase):
    def setUp(self):
        self.scheduler = Scheduler()
        self.station = Station.objects.create(
            name="Test Radio",
            short_name="test-radio",
            radio_base_dir="/var/azuracast/stations/test_radio"
        )
        self.playlist = StationPlaylist.objects.create(
            station=self.station,
            name="Scheduled Playlist",
            type="default"
        )

    def test_should_playlist_play_now_no_schedule(self):
        now = timezone.now()
        self.assertTrue(self.scheduler.should_playlist_play_now(self.playlist, now))

    def test_should_playlist_play_now_with_matching_schedule(self):
        now = timezone.make_aware(datetime.datetime(2026, 3, 20, 12, 0))
        StationSchedule.objects.create(
            playlist=self.playlist,
            start_time=1000,
            end_time=1400,
            days="1,2,3,4,5"
        )
        self.assertTrue(self.scheduler.should_playlist_play_now(self.playlist, now))

    def test_should_not_play_outside_schedule(self):
        now = timezone.make_aware(datetime.datetime(2026, 3, 20, 15, 0))
        StationSchedule.objects.create(
            playlist=self.playlist,
            start_time=1000,
            end_time=1400,
            days="1,2,3,4,5"
        )
        self.assertFalse(self.scheduler.should_playlist_play_now(self.playlist, now))

    def test_overnight_schedule_match(self):
        StationSchedule.objects.create(
            playlist=self.playlist,
            start_time=2200,
            end_time=200,
            days="1,2,3,4,5,6,7"
        )
        
        now_23h = timezone.make_aware(datetime.datetime(2026, 3, 20, 23, 0))
        self.assertTrue(self.scheduler.should_playlist_play_now(self.playlist, now_23h))
        
        now_01h = timezone.make_aware(datetime.datetime(2026, 3, 20, 1, 0))
        self.assertTrue(self.scheduler.should_playlist_play_now(self.playlist, now_01h))
        
        now_21h = timezone.make_aware(datetime.datetime(2026, 3, 20, 21, 0))
        self.assertFalse(self.scheduler.should_playlist_play_now(self.playlist, now_21h))

    def test_once_per_x_songs_logic(self):
        from autodj.models import StationQueue
        from media.models import StationMedia, Song
        
        self.playlist.type = "once_per_x_songs"
        self.playlist.play_per_songs = 3
        self.playlist.save()
        
        self.assertTrue(self.scheduler.should_playlist_play_now_per_songs(self.playlist, timezone.now()))
        
        song = Song.objects.create(song_id="test_song", artist="Test", title="Song")
        media = StationMedia.objects.create(station=self.station, song=song, path="test.mp3", unique_id="abc")
        
        StationQueue.objects.create(
            station=self.station,
            playlist=self.playlist,
            media=media,
            is_played=True,
            is_visible=True
        )
        
        self.assertFalse(self.scheduler.should_playlist_play_now_per_songs(self.playlist, timezone.now()))
        
        other_playlist = StationPlaylist.objects.create(station=self.station, name="Other", type="default")
        for i in range(3):
            StationQueue.objects.create(
                station=self.station,
                playlist=other_playlist,
                media=media,
                is_played=True,
                is_visible=True
            )
            
        self.assertTrue(self.scheduler.should_playlist_play_now_per_songs(self.playlist, timezone.now()))

    def test_once_per_x_minutes_logic(self):
        self.playlist.type = "once_per_x_minutes"
        self.playlist.play_per_minutes = 30
        self.playlist.save()
        
        now = timezone.now()
        self.assertTrue(self.scheduler.should_playlist_play_now_per_minutes(self.playlist, now))
        
        self.playlist.played_at = now - datetime.timedelta(minutes=15)
        self.playlist.save()
        self.assertFalse(self.scheduler.should_playlist_play_now_per_minutes(self.playlist, now))
        
        self.playlist.played_at = now - datetime.timedelta(minutes=35)
        self.playlist.save()
        self.assertTrue(self.scheduler.should_playlist_play_now_per_minutes(self.playlist, now))

