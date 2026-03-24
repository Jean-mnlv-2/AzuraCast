from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import NowPlaying

class NowPlayingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NowPlaying.objects.all()
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        # AzuraCast NP API returns a list of all stations
        queryset = self.get_queryset()
        data = [np.cache for np in queryset]
        return Response(data)

    def retrieve(self, request, pk=None):
        # Get by station ID or short name
        try:
            if pk.isdigit():
                np = NowPlaying.objects.get(station_id=pk)
            else:
                np = NowPlaying.objects.get(station__short_name=pk)
            return Response(np.cache)
        except NowPlaying.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
