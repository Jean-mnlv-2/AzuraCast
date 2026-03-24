from django.test import TestCase
from unittest.mock import patch, MagicMock
from stations.models import Station
from webhooks.models import StationWebhook
from webhooks.dispatcher import dispatch

class WebhookDispatcherTest(TestCase):
    def setUp(self):
        self.station = Station.objects.create(
            name="Test Radio",
            short_name="test-radio",
            radio_base_dir="/var/azuracast/stations/test_radio"
        )
        
        self.webhook = StationWebhook.objects.create(
            station=self.station,
            name="Discord Webhook",
            type="discord",
            is_enabled=True,
            triggers=["song_changed"],
            config={"url": "https://discord.com/api/webhooks/test"}
        )

    @patch('webhooks.connectors.discord.DiscordConnector.send')
    def test_dispatch_calls_correct_connector(self, mock_send):
        context = {
            "station": "Test Radio",
            "artist": "Artist",
            "title": "Title",
            "album": "Album"
        }
        
        dispatch(self.station.id, "song_changed", context)
        
        mock_send.assert_called_once_with(self.webhook.config, context)

    @patch('webhooks.connectors.discord.DiscordConnector.send')
    def test_dispatch_skips_disabled_webhook(self, mock_send):
        self.webhook.is_enabled = False
        self.webhook.save()
        
        dispatch(self.station.id, "song_changed", {})
        
        mock_send.assert_not_called()

    @patch('webhooks.connectors.discord.DiscordConnector.send')
    def test_dispatch_skips_wrong_trigger(self, mock_send):
        dispatch(self.station.id, "listener_joined", {})
        
        mock_send.assert_not_called()

    @patch('webhooks.connectors.email.EmailConnector.send')
    def test_dispatch_multiple_webhooks(self, mock_email_send):
        email_webhook = StationWebhook.objects.create(
            station=self.station,
            name="Email Webhook",
            type="email",
            is_enabled=True,
            triggers=["song_changed"],
            config={"to": "test@example.com", "subject": "Test", "message": "Test"}
        )
        
        with patch('webhooks.connectors.discord.DiscordConnector.send') as mock_discord_send:
            dispatch(self.station.id, "song_changed", {"title": "Test"})
            
            mock_discord_send.assert_called_once()
            mock_email_send.assert_called_once()
