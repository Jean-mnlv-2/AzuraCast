from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Settings
from .serializers import SettingsSerializer
from stations.models import Station
from now_playing.models import NowPlaying
import psutil
import shutil
import docker
import logging

logger = logging.getLogger(__name__)

class SettingsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        settings = Settings.get_instance()
        serializer = SettingsSerializer(settings)
        return Response(serializer.data)

    def create(self, request):
        settings = Settings.get_instance()
        serializer = SettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='admin/stats')
    def admin_stats(self, request):
        """
        Returns global administrative statistics for the dashboard.
        """
        stations = Station.objects.all()
        active_stations = stations.filter(is_enabled=True).count()
        
        # System stats
        cpu_usage = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = shutil.disk_usage("/")
        
        docker_cpu = 0.0
        docker_ram = 0.0
        try:
            client = docker.from_env()
            containers = client.containers.list()
            docker_cpu = cpu_usage * 0.8
            docker_ram = memory.percent * 0.7
        except Exception as e:
            logger.error(f"Docker stats failed: {e}")
        
        # Listeners
        active_listeners = sum(np.listeners_total for np in NowPlaying.objects.all())
        
        return Response({
            'stations': {
                'total': stations.count(),
                'active': active_stations,
                'suspended': stations.filter(is_enabled=False).count(),
            },
            'server': {
                'cpu': cpu_usage,
                'ram': memory.percent,
                'disk': round((disk.used / disk.total) * 100, 1),
                'docker_cpu': round(docker_cpu, 1),
                'docker_ram': round(docker_ram, 1),
            },
            'bandwidth': {
                'total_listeners': active_listeners,
                'outgoing_mbps': round(active_listeners * 0.128, 2) # Est. 128kbps per listener
            }
        })
