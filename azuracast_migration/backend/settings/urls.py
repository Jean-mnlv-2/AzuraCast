from django.urls import path
from .views import SettingsViewSet

urlpatterns = [
    path('admin/fleet/', SettingsViewSet.as_view({'get': 'fleet_management'})),
    path('admin/nodes/', SettingsViewSet.as_view({'get': 'node_manager'})),
    path('admin/logs/', SettingsViewSet.as_view({'get': 'log_streamer'})),
    path('admin/storage/', SettingsViewSet.as_view({'get': 'storage_monitor'})),
    path('admin/audit/', SettingsViewSet.as_view({'get': 'audit_logs'})),
    path('admin/stats/', SettingsViewSet.as_view({'get': 'admin_stats'})),
    path('admin/billing/', SettingsViewSet.as_view({'get': 'billing_dashboard'})),
    path('', SettingsViewSet.as_view({'get': 'list'})),
]
