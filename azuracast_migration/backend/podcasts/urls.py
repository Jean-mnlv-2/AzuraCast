from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PodcastViewSet, PodcastEpisodeViewSet, PodcastCategoryViewSet

router = DefaultRouter()
router.register(r'categories', PodcastCategoryViewSet)
router.register(r'episodes', PodcastEpisodeViewSet)
router.register(r'', PodcastViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
