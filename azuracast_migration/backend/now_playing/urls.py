from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NowPlayingViewSet

router = DefaultRouter()
router.register(r'', NowPlayingViewSet, basename='nowplaying')

urlpatterns = [
    path('', include(router.urls)),
]
