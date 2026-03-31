from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GroupViewSet, ApiKeyViewSet, RegisterView, RolePermissionViewSet

router = DefaultRouter()
router.register(r'groups', GroupViewSet)
router.register(r'role-permissions', RolePermissionViewSet)
router.register(r'api-keys', ApiKeyViewSet, basename='api-key')
router.register(r'', UserViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]
