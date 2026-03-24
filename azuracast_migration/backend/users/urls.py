from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GroupViewSet, ApiKeyViewSet

router = DefaultRouter()
router.register(r'', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'api-keys', ApiKeyViewSet, basename='api-key')

urlpatterns = [
    path('', include(router.urls)),
]
