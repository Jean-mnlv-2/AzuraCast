from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Settings
from .serializers import SettingsSerializer

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
