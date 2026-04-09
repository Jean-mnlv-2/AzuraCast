from django.db import models
from django.conf import settings

class Plan(models.Model):
    name = models.CharField(max_length=100)
    code = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XAF')
    
    # Quotas
    max_stations = models.IntegerField(default=1)
    max_storage_gb = models.IntegerField(default=5)
    max_listeners = models.IntegerField(default=100)
    max_mounts = models.IntegerField(default=3)
    max_bitrate_kbps = models.IntegerField(default=128)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('trialing', 'En essai'),
        ('past_due', 'Impayé'),
        ('canceled', 'Annulé'),
        ('suspended', 'Suspendu'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trialing')
    
    start_date = models.DateTimeField(auto_now_add=True)
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    
    # Billing info
    external_customer_id = models.CharField(max_length=255, blank=True, null=True) # Stripe customer ID etc
    
    class Meta:
        db_table = 'billing_subscriptions'

    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"

class Transaction(models.Model):
    GATEWAY_CHOICES = [
        ('stripe', 'Stripe'),
        ('mobile_money', 'Mobile Money'),
        ('manual', 'Manuel'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XAF')
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    status = models.CharField(max_length=20, default='pending')
    
    reference = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'billing_transactions'

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.IntegerField(default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    max_redemptions = models.IntegerField(default=100)
    times_redeemed = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code
