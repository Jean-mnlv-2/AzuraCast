from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StationWebhookViewSet

urlpatterns = [
    # Station-specific nested routes
    path('<str:station_short_name>/webhooks/', StationWebhookViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<str:station_short_name>/webhooks/<int:pk>/', StationWebhookViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
]
