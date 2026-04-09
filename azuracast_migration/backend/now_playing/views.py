from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import NowPlaying

class NowPlayingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NowPlaying.objects.all()
    permission_classes = [permissions.AllowAny]
    lookup_field = 'station__short_name'
    lookup_value_regex = '[^/.]+'


    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [np.cache for np in queryset]
        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('station__short_name')
        try:
            if pk and pk.isdigit():
                np = NowPlaying.objects.get(station_id=pk)
            else:
                np = NowPlaying.objects.get(station__short_name=pk)
            return Response(np.cache)
        except NowPlaying.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

