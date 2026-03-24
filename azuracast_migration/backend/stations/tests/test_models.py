from django.test import TestCase
from django.utils import timezone
from stations.models import Station, StationPlaylist, StationStreamer

class StationModelTest(TestCase):
    def setUp(self):
        self.station = Station.objects.create(
            name="Test Radio",
            short_name="test-radio",
            radio_base_dir="/var/azuracast/stations/test_radio"
        )

    def test_station_creation(self):
        self.assertEqual(self.station.name, "Test Radio")
        self.assertEqual(self.station.short_name, "test-radio")
        self.assertTrue(self.station.is_enabled)

    def test_station_str(self):
        self.assertEqual(str(self.station), "Test Radio")

class StationPlaylistModelTest(TestCase):
    def setUp(self):
        self.station = Station.objects.create(
            name="Test Radio",
            short_name="test-radio",
            radio_base_dir="/var/azuracast/stations/test_radio"
        )
        self.playlist = StationPlaylist.objects.create(
            station=self.station,
            name="Default Playlist",
            type="default"
        )

    def test_playlist_creation(self):
        self.assertEqual(self.playlist.name, "Default Playlist")
        self.assertEqual(self.playlist.station, self.station)

class StationStreamerModelTest(TestCase):
    def setUp(self):
        self.station = Station.objects.create(
            name="Test Radio",
            short_name="test-radio",
            radio_base_dir="/var/azuracast/stations/test_radio"
        )
        self.streamer = StationStreamer.objects.create(
            station=self.station,
            streamer_username="test-dj"
        )
        self.streamer.set_password("securepassword")
        self.streamer.save()

    def test_streamer_authentication(self):
        self.assertTrue(self.streamer.authenticate("securepassword"))
        self.assertFalse(self.streamer.authenticate("wrongpassword"))

    def test_streamer_is_active_by_default(self):
        self.assertTrue(self.streamer.is_active)
