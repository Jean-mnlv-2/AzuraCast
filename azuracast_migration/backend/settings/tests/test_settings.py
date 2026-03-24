from django.test import TestCase
from settings.models import Settings

class SettingsTest(TestCase):
    def test_get_instance_singleton(self):
        instance1 = Settings.get_instance()
        instance2 = Settings.get_instance()
        
        self.assertEqual(instance1.id, instance2.id)
        self.assertEqual(Settings.objects.count(), 1)

    def test_default_values(self):
        settings = Settings.get_instance()
        self.assertEqual(settings.instance_name, "AzuraCast")
        self.assertTrue(settings.prefer_browser_url)
        self.assertEqual(settings.history_keep_days, 14)

    def test_update_settings(self):
        settings = Settings.get_instance()
        settings.instance_name = "BantuWave Radio"
        settings.save()
        
        updated_settings = Settings.get_instance()
        self.assertEqual(updated_settings.instance_name, "BantuWave Radio")
