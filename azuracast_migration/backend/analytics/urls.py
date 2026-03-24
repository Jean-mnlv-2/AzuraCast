from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet

urlpatterns = [
    path('<str:station_short_name>/geography/', AnalyticsViewSet.as_view({'get': 'geography'})),
    path('<str:station_short_name>/reports/royalty/', AnalyticsViewSet.as_view({'get': 'royalty_report'})),
    path('<str:station_short_name>/', AnalyticsViewSet.as_view({'get': 'list'})),
    path('', AnalyticsViewSet.as_view({'get': 'list'})),
]
