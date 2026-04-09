from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Plan, Subscription, Transaction, Coupon
from users.permissions import IsBantuWaveAdmin
from stations.models import Station
import logging

logger = logging.getLogger(__name__)

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsBantuWaveAdmin()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def public_list(self, request):
        """
        API endpoint for the external site to list available plans.
        """
        plans = self.get_queryset()
        data = [{
            'id': p.id,
            'name': p.name,
            'code': p.code,
            'description': p.description,
            'price': p.price_monthly,
            'currency': p.currency,
            'quotas': {
                'stations': p.max_stations,
                'storage_gb': p.max_storage_gb,
                'listeners': p.max_listeners,
                'mounts': p.max_mounts,
                'bitrate': p.max_bitrate_kbps,
            }
        } for p in plans]
        return Response(data)

class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser or self.request.user.groups.filter(name='Commercial & Billing').exists():
            return self.queryset
        return self.queryset.filter(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsBantuWaveAdmin])
    def force_suspend(self, request, pk=None):
        """
        Manually suspend a subscription and its stations.
        """
        sub = self.get_object()
        sub.status = 'suspended'
        sub.save()
        
        stations = Station.objects.filter(subscription=sub)
        from bantuwave.container_manager import ContainerManager
        cm = ContainerManager()
        
        for station in stations:
            station.is_enabled = False
            station.save()
            cm.stop_station(station)
            
        return Response({'status': 'suspended'})

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser or self.request.user.groups.filter(name='Commercial & Billing').exists():
            return self.queryset
        return self.queryset.filter(user=self.request.user)

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    permission_classes = [IsBantuWaveAdmin]
