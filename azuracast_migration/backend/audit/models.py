from django.db import models
from auditlog.registry import auditlog
from stations.models import Station
from users.models import User
from billing.models import Plan, Subscription, Transaction, Coupon

auditlog.register(Station)
auditlog.register(User)
auditlog.register(Plan)
auditlog.register(Subscription)
auditlog.register(Transaction)
auditlog.register(Coupon)
