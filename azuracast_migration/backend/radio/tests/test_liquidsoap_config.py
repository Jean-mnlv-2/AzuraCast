from django.test import TestCase
from stations.models import Station, StationMount
from radio.liquidsoap.config_writer import LiquidsoapConfigWriter

class LiquidsoapConfigTest(TestCase):
    def setUp(self):
        self.station = Station.objects.create(
            name="Test Radio",
            short_name="test-radio",
            radio_base_dir="/var/azuracast/stations/test_radio"
        )
        self.mount = StationMount.objects.create(
            station=self.station,
            name="/test.mp3",
            display_name="Test Mount",
            is_enabled=True,
            is_default=True,
            autodj_format="mp3",
            autodj_bitrate=128
        )

    def test_generate_config_contains_essential_parts(self):
        writer = LiquidsoapConfigWriter(self.station)
        config = writer.generate_config()
        
        # Check for essential includes and settings
        self.assertIn('%include', config)
        self.assertIn('azuracast.liq', config)
        self.assertIn('settings.azuracast.api_url', config)
        self.assertIn('settings.azuracast.api_key', config)
        
        # Check for AutoDJ logic
        self.assertIn('def get_next_song() =', config)
        self.assertIn('radio = request.dynamic', config)
        
        # Check for harbor (DJ) logic
        self.assertIn('input.harbor', config)
        self.assertIn('dj_auth', config)
        
        # Check for output (Icecast)
        self.assertIn('output.icecast', config)
        self.assertIn('mount="/test.mp3"', config)

    def test_generate_config_with_hls(self):
        self.station.enable_hls = True
        self.station.save()
        
        writer = LiquidsoapConfigWriter(self.station)
        config = writer.generate_config()
        
        self.assertIn('output.file.hls', config)
        self.assertIn('live.m3u8', config)
