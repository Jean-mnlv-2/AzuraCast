from django.test import TestCase
from django.utils import timezone
from stations.models import Station, StationPlaylist
from media.models import StationMedia, Song, StorageLocation
from autodj.models import StationQueue
from autodj.queue_builder import QueueBuilder

class QueueBuilderTest(TestCase):
    def setUp(self):
        self.station = Station.objects.create(
            name="Test Radio",
            short_name="test-radio",
            radio_base_dir="/var/azuracast/stations/test_radio"
        )
        self.storage = StorageLocation.objects.create(
            adapter="local",
            type="station_media",
            path="/var/azuracast/stations/test_radio/media"
        )
        self.playlist = StationPlaylist.objects.create(
            station=self.station,
            name="Standard Playlist",
            type="default",
            is_enabled=True,
            weight=3
        )
        
        # Create some media
        for i in range(5):
            song = Song.objects.create(
                song_id=f"song_{i}",
                artist=f"Artist {i}",
                title=f"Title {i}"
            )
            media = StationMedia.objects.create(
                station=self.station,
                storage_location=self.storage,
                song=song,
                unique_id=f"unique_{i}",
                path=f"test_{i}.mp3"
            )
            self.playlist.media_items.add(media)

    def test_calculate_next_song_basic(self):
        builder = QueueBuilder()
        next_song = builder.calculate_next_song(self.station)
        
        self.assertIsNotNone(next_song)
        self.assertIsInstance(next_song, StationQueue)
        self.assertEqual(next_song.station, self.station)
        self.assertEqual(next_song.playlist, self.playlist)
        self.assertFalse(next_song.is_played)

    def test_queue_is_reused_if_not_empty(self):
        builder = QueueBuilder()
        # Pre-populate queue
        song = Song.objects.create(song_id="manual", artist="A", title="T")
        media = StationMedia.objects.create(station=self.station, song=song, unique_id="m1", path="m.mp3")
        
        existing_queue = StationQueue.objects.create(
            station=self.station,
            media=media,
            is_played=False,
            is_visible=True
        )
        
        next_song = builder.calculate_next_song(self.station)
        self.assertEqual(next_song.id, existing_queue.id)

    def test_no_playlists_returns_none(self):
        self.playlist.is_enabled = False
        self.playlist.save()
        
        builder = QueueBuilder()
        next_song = builder.calculate_next_song(self.station)
        self.assertIsNone(next_song)
