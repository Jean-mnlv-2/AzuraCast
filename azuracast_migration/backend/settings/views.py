from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Settings
from .serializers import SettingsSerializer, LogEntrySerializer
from auditlog.models import LogEntry
from stations.models import Station
from now_playing.models import NowPlaying
import psutil
import shutil
import docker
import logging

logger = logging.getLogger(__name__)

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from billing.models import Plan, Subscription, Transaction, Coupon

from users.permissions import IsBantuWaveAdmin

class SettingsViewSet(viewsets.ViewSet):
    permission_classes = [IsBantuWaveAdmin]
    serializer_class = SettingsSerializer

    def get_serializer_class(self):
        if self.action == 'log_streamer' or self.action == 'audit_logs':
            return LogEntrySerializer
        return SettingsSerializer

    @action(detail=False, methods=['get'], url_path='admin/fleet', required_action='manage_stations_tech')
    def fleet_management(self, request):
        """
        List all stations with their current status, plan, and resource usage.
        """
        stations = Station.objects.all().order_by('-created_at')
        data = []
        for s in stations:
            data.append({
                'id': s.id,
                'name': s.name,
                'short_name': s.short_name,
                'is_enabled': s.is_enabled,
                'has_started': s.has_started,
                'plan': s.get_plan_display(),
                'storage_used_pct': 0,
                'listeners': 0,
                'user_id': s.creator_id if s.creator else None,
                'user_email': s.creator.email if s.creator else 'System',
                'max_storage_gb': s.max_storage_gb,
                'max_mounts': s.max_mounts,
            })
        return Response(data)

    @action(detail=False, methods=['get'], url_path='admin/nodes', required_action='manage_infrastructure')
    def node_manager(self, request):
        """
        List nodes and their resource usage.
        For now, we handle the single local node.
        """
        cpu = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory()
        disk = shutil.disk_usage("/")            # Count running station containers
        try:
            client = docker.from_env()
            containers = client.containers.list()
            station_containers = [c for c in containers if c.name.startswith('bantuwave_station_')]
        except:
            station_containers = []

        return Response({
            'nodes': [{
                'id': 'local-node',
                'name': 'Main Server (Douala)',
                'status': 'online',
                'cpu_usage': cpu,
                'memory_usage': mem.percent,
                'disk_usage': round((disk.used / disk.total) * 100, 1),
                'active_containers': len(station_containers),
                'load_avg': psutil.getloadavg(),
            }]
        })

    @action(detail=False, methods=['get'], url_path='admin/logs', required_action='view_logs')
    def log_streamer(self, request):
        """
        Returns recent system logs from multiple sources.
        """
        # In a real scenario, this would tail files or query a log aggregator.
        # For now, we return the last 100 audit logs as a start.
        logs = LogEntry.objects.all().select_related('actor').order_by('-timestamp')[:100]
        serializer = LogEntrySerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='admin/storage', required_action='manage_infrastructure')
    def storage_monitor(self, request):
        """
        Returns detailed storage usage by category.
        """
        from stations.models import Station
        
        total_used = 0
        stations_data = []
        
        # This is a simplified calculation. Real one would check file sizes.
        for station in Station.objects.all():
            used_gb = 0
            stations_data.append({
                'id': station.id,
                'name': station.name,
                'quota_gb': station.max_storage_gb,
                'used_gb': used_gb,
                'usage_percent': round((used_gb / station.max_storage_gb * 100), 1) if station.max_storage_gb > 0 else 0
            })

        return Response({
            'total_capacity_gb': shutil.disk_usage("/").total / (1024**3),
            'total_used_gb': shutil.disk_usage("/").used / (1024**3),
            'stations': stations_data
        })

    @action(detail=False, methods=['get'], url_path='admin/audit')
    def audit_logs(self, request):
        """
        Returns recent audit logs.
        """
        if not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
            
        logs = LogEntry.objects.all().select_related('actor').order_by('-timestamp')[:100]
        serializer = LogEntrySerializer(logs, many=True)
        return Response(serializer.data)

    def list(self, request):
        if not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        settings = Settings.get_instance()
        serializer = SettingsSerializer(settings)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='admin/stats')
    def admin_stats(self, request):
        """
        Returns global administrative statistics for the dashboard.
        """
        if not (request.user.is_superuser or request.user.groups.filter(name__in=['Commercial & Billing', 'Tech Support']).exists()):
            return Response(status=status.HTTP_403_FORBIDDEN)

        stations = Station.objects.all()
        active_stations = stations.filter(is_enabled=True).count()
        
        # System stats
        cpu_usage = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = shutil.disk_usage("/")
        
        # Listeners
        active_listeners = sum(np.listeners_total for np in NowPlaying.objects.all())
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        mrr = Transaction.objects.filter(
            status='completed', 
            created_at__gte=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        active_subs = Subscription.objects.filter(status='active').count()
        total_revenue = Transaction.objects.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
        
        canceled_subs = Subscription.objects.filter(status='canceled', start_date__gte=thirty_days_ago).count()
        churn_rate = (canceled_subs / active_subs * 100) if active_subs > 0 else 0

        return Response({
            'business': {
                'mrr': float(mrr),
                'total_revenue': float(total_revenue),
                'active_subscriptions': active_subs,
                'churn_rate': round(churn_rate, 2),
                'currency': 'XAF'
            },
            'stations': {
                'total': stations.count(),
                'active': active_stations,
                'suspended': stations.filter(is_enabled=False).count(),
                'trial': Subscription.objects.filter(status='trialing').count(),
            },
            'server': {
                'cpu': cpu_usage,
                'ram': memory.percent,
                'disk': round((disk.used / disk.total) * 100, 1),
                'load_avg': psutil.getloadavg(),
            },
            'bandwidth': {
                'total_listeners': active_listeners,
                'outgoing_gbps': round((active_listeners * 128) / 1000000, 4)
            },
            'alerts': self._get_critical_alerts()
        })

    def _get_critical_alerts(self):
        alerts = []
        cpu = psutil.cpu_percent()
        if cpu > 90:
            alerts.append({'level': 'critical', 'message': f'CPU Load extremely high: {cpu}%'})
        
        disk = shutil.disk_usage("/")
        disk_pct = (disk.used / disk.total) * 100
        if disk_pct > 85:
            alerts.append({'level': 'warning', 'message': f'Disk space low: {round(disk_pct, 1)}% used'})
            
        return alerts

    @action(detail=False, methods=['get'], url_path='admin/billing')
    def billing_dashboard(self, request):
        """
        Stats for the billing dashboard.
        """
        if not (request.user.is_superuser or request.user.groups.filter(name='Commercial & Billing').exists()):
            return Response(status=status.HTTP_403_FORBIDDEN)
            
        transactions = Transaction.objects.all().order_by('-created_at')[:20]
        plans = Plan.objects.annotate(sub_count=Count('subscription'))
        
        return Response({
            'recent_transactions': [{
                'id': t.id,
                'user': t.user.email,
                'amount': float(t.amount),
                'status': t.status,
                'date': t.created_at
            } for t in transactions],
            'plans_popularity': [{
                'name': p.name,
                'count': p.sub_count
            } for p in plans]
        })

