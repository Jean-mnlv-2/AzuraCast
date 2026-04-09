from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet

urlpatterns = [
    path('global-dashboard/', AnalyticsViewSet.as_view({'get': 'global_dashboard'})),
    path('<str:station_short_name>/geography/', AnalyticsViewSet.as_view({'get': 'geography'})),
    path('<str:station_short_name>/reports/royalty/', AnalyticsViewSet.as_view({'get': 'royalty_report'})),
    path('<str:station_short_name>/advertisements/', AnalyticsViewSet.as_view({'get': 'advertisement_report'})),
    path('<str:station_short_name>/minim-impact/', AnalyticsViewSet.as_view({'get': 'minim_impact'})),
    path('<str:station_short_name>/', AnalyticsViewSet.as_view({'get': 'list'})),
    path('', AnalyticsViewSet.as_view({'get': 'list'})),
]



