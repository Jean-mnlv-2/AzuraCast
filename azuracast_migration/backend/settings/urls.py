from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SettingsViewSet

urlpatterns = [
    path('', SettingsViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('admin/stats/', SettingsViewSet.as_view({'get': 'admin_stats'})),
]
