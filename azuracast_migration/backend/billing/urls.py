from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet, SubscriptionViewSet, TransactionViewSet, CouponViewSet

router = DefaultRouter()
router.register(r'plans', PlanViewSet)
router.register(r'subscriptions', SubscriptionViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'coupons', CouponViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
