import requests
from django.test import TestCase
from unittest.mock import patch, MagicMock
from webhooks.connectors.discord import DiscordConnector
from webhooks.connectors.telegram import TelegramConnector
from webhooks.connectors.email import EmailConnector
from webhooks.connectors.tunein import TuneInConnector

from webhooks.connectors import BaseConnector

class WebhookConnectorsTest(TestCase):
    def test_base_connector_replace_variables(self):
        connector = BaseConnector()
        context = {
            'station.name': 'BantuWave',
            'now_playing.song.title': 'Cool Song',
            'artist': 'Famous Artist',
            'missing': 'Will stay'
        }
        
        text = "Welcome to {{ station.name }}! Now playing {{ now_playing.song.title }} by {{ artist }}. {{ missing }} {{ unknown }}"
        result = connector.replace_variables(text, context)
        
        self.assertEqual(result, "Welcome to BantuWave! Now playing Cool Song by Famous Artist. Will stay {{ unknown }}")

    @patch('requests.post')
    def test_discord_connector_send(self, mock_post):
        connector = DiscordConnector()
        config = {"url": "https://discord.com/api/webhooks/test"}
        context = {
            "station": "Test Radio",
            "artist": "Artist",
            "title": "Title",
            "album": "Album"
        }
        
        connector.send(config, context)
        
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], config['url'])
        self.assertIn("Artist - Title", str(kwargs['json']))

    @patch('requests.post')
    def test_telegram_connector_send(self, mock_post):
        connector = TelegramConnector()
        config = {"bot_token": "token", "chat_id": "chat123"}
        context = {
            "station": "Test Radio",
            "artist": "Artist",
            "title": "Title",
            "album": "Album"
        }
        
        connector.send(config, context)
        
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertIn("token", args[0])
        self.assertEqual(kwargs['json']['chat_id'], "chat123")
        self.assertIn("Artist - Title", kwargs['json']['text'])

    @patch('django.core.mail.send_mail')
    def test_email_connector_send(self, mock_send_mail):
        connector = EmailConnector()
        config = {
            "to": "user1@example.com, user2@example.com",
            "subject": "Now playing on {{station}}",
            "message": "Title: {{title}} by {{artist}}"
        }
        context = {
            "station": "BantuWave",
            "artist": "Famous Artist",
            "title": "Cool Song"
        }
        
        connector.send(config, context)
        
        mock_send_mail.assert_called_once()
        args, kwargs = mock_send_mail.call_args
        self.assertEqual(kwargs['subject'], "Now playing on BantuWave")
        self.assertEqual(kwargs['recipient_list'], ["user1@example.com", "user2@example.com"])
        self.assertIn("Famous Artist", kwargs['message'])

    @patch('requests.get')
    def test_tunein_connector_send(self, mock_get):
        connector = TuneInConnector()
        config = {
            "partner_id": "p123",
            "partner_key": "k456",
            "station_id": "s789"
        }
        context = {
            "now_playing": {
                "song": {
                    "artist": "Artist",
                    "title": "Title",
                    "album": "Album"
                }
            }
        }
        
        connector.send(config, context)
        
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        self.assertEqual(kwargs['params']['partnerId'], "p123")
        self.assertEqual(kwargs['params']['id'], "s789")
        self.assertEqual(kwargs['params']['title'], "Title")
