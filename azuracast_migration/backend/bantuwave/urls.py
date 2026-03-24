from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .internal_api import dj_auth
from .health import health_check

from users.auth_views import MyTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/internal/auth', dj_auth),
    
    # Auth
    path('api/auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API Users
    path('api/users/', include('users.urls')),
    
    # API Stations
    path('api/stations/', include('stations.urls')),
    
    # API Media
    path('api/media/', include('media.urls')),
    
    # API AutoDJ
    path('api/autodj/', include('autodj.urls')),
    
    # API Webhooks
    path('api/webhooks/', include('webhooks.urls')),
    
    # API Now Playing
    path('api/nowplaying/', include('now_playing.urls')),
    
    # API Analytics
    path('api/analytics/', include('analytics.urls')),
    
    # API Podcasts
    path('api/podcasts/', include('podcasts.urls')),
    
    # API Settings
    path('api/settings/', include('settings.urls')),
    
    # API Schema & Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Prometheus Metrics
    path('', include('django_prometheus.urls')),
]
