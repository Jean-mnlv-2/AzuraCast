from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_next_song, StationRequestViewSet

router = DefaultRouter()
router.register(r'requests/(?P<station_id>\d+)', StationRequestViewSet, basename='station-request')

urlpatterns = [
    path('nextsong/<int:station_id>/', get_next_song, name='get-next-song'),
    path('', include(router.urls)),
]
