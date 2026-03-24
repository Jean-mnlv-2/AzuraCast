from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions
from .models import StationWebhook
from .serializers import StationWebhookSerializer

class StationWebhookViewSet(viewsets.ModelViewSet):
    queryset = StationWebhook.objects.all()
    serializer_class = StationWebhookSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(station__short_name=self.kwargs['station_short_name'])

    def perform_create(self, serializer):
        from stations.models import Station
        station = get_object_or_404(Station, short_name=self.kwargs['station_short_name'])
        serializer.save(station=station)
