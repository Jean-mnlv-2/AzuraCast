import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import now_playing.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bantuwave.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            now_playing.routing.websocket_urlpatterns
        )
    ),
})
