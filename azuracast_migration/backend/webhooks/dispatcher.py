from .models import StationWebhook
from .connectors.generic import GenericConnector
from .connectors.discord import DiscordConnector
from .connectors.telegram import TelegramConnector
from .connectors.email import EmailConnector
from .connectors.tunein import TuneInConnector
from .connectors.mastodon import MastodonConnector
from .connectors.groupme import GroupMeConnector
from .connectors.radiode import RadioDeConnector
from .connectors.radioreg import RadioRegConnector

CONNECTORS = {
    'generic': GenericConnector,
    'discord': DiscordConnector,
    'telegram': TelegramConnector,
    'email': EmailConnector,
    'tunein': TuneInConnector,
    'mastodon': MastodonConnector,
    'groupme': GroupMeConnector,
    'radiode': RadioDeConnector,
    'radioreg': RadioRegConnector,
}

def dispatch(station_id: int, trigger_name: str, context: dict):
    webhooks = StationWebhook.objects.filter(
        station_id=station_id,
        is_enabled=True,
        triggers__contains=trigger_name
    )
    
    for webhook in webhooks:
        connector_class = CONNECTORS.get(webhook.type)
        if connector_class:
            connector = connector_class()
            connector.send(webhook.config, context)
