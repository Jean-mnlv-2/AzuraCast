from celery import shared_task
from django.utils import timezone
from .models import Subscription
from stations.models import Station
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_subscriptions_status():
    """
    Task to check subscriptions and suspend stations if past due.
    "Kill Switch" logic: if past due for > 3 days, disable the station.
    """
    now = timezone.now()
    three_days_ago = now - timezone.timedelta(days=3)
    
    expiring_soon = Subscription.objects.filter(
        status='active', 
        current_period_end__lt=now
    ).iterator()
    for sub in expiring_soon:
        sub.status = 'past_due'
        sub.save()
        logger.info(f"Subscription {sub.id} marked as past_due.")

    # 2. Suspend stations for subscriptions past_due for > 3 days
    to_suspend = Subscription.objects.filter(
        status='past_due',
        current_period_end__lt=three_days_ago
    ).iterator()
    for sub in to_suspend:
        sub.status = 'suspended'
        sub.save()
        stations = Station.objects.filter(subscription=sub).iterator()
        for station in stations:
            station.is_enabled = False
            station.save()
            from bantuwave.container_manager import ContainerManager
            cm = ContainerManager()
            cm.stop_station(station)
            logger.warning(f"Station {station.name} (ID: {station.id}) suspended due to non-payment.")

@shared_task
def send_billing_reminders():
    """
    Send email reminders for upcoming or past due payments.
    """
    pass
