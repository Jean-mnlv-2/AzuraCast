from django.core.management.base import BaseCommand
from billing.models import Plan, Subscription, Transaction
from users.models import User
from django.utils import timezone
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Populate sample billing data for BantuWave SaaS'

    def handle(self, *args, **options):
        # 1. Create Plans
        free_plan, _ = Plan.objects.get_or_create(
            code='free',
            defaults={
                'name': 'Free Trial',
                'price_monthly': 0,
                'max_storage_gb': 1,
                'max_listeners': 10
            }
        )
        pro_plan, _ = Plan.objects.get_or_create(
            code='pro',
            defaults={
                'name': 'Pro Radio',
                'price_monthly': 5000,
                'max_storage_gb': 10,
                'max_listeners': 250
            }
        )
        business_plan, _ = Plan.objects.get_or_create(
            code='business',
            defaults={
                'name': 'Business',
                'price_monthly': 15000,
                'max_storage_gb': 50,
                'max_listeners': 1000
            }
        )

        self.stdout.write(self.style.SUCCESS('Plans created'))

        # 2. Get Users
        users = User.objects.all()
        if not users.exists():
            self.stdout.write(self.style.ERROR('No users found. Run create_superuser first.'))
            return

        # 3. Create Subscriptions and Transactions
        now = timezone.now()
        gateways = ['stripe', 'mobile_money', 'manual']
        statuses = ['active', 'active', 'active', 'active', 'canceled']

        for i, user in enumerate(users):
            plan = random.choice([pro_plan, business_plan])
            status = random.choice(statuses)
            
            sub = Subscription.objects.create(
                user=user,
                plan=plan,
                status=status,
                current_period_end=now + timedelta(days=30)
            )
            
            # Create some transactions
            for month in range(3):
                Transaction.objects.create(
                    user=user,
                    subscription=sub,
                    amount=plan.price_monthly,
                    gateway=random.choice(gateways),
                    status='completed',
                    reference=f"TXN-{user.id}-{month}-{random.randint(1000, 9999)}",
                    created_at=now - timedelta(days=30*month)
                )

        self.stdout.write(self.style.SUCCESS(f'Created {users.count()} subscriptions and many transactions'))
