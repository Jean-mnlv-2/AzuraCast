from django.db import models
from stations.models import Station
from media.models import StorageLocation

class PodcastCategory(models.Model):
    title = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'podcast_categories'
        verbose_name_plural = 'podcast categories'

    def __str__(self):
        return self.title

class Podcast(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='podcasts')
    storage_location = models.ForeignKey(StorageLocation, on_delete=models.SET_NULL, null=True, blank=True)
    
    title = models.CharField(max_length=150)
    description = models.TextField(null=True, blank=True)
    link = models.URLField(max_length=255, null=True, blank=True)
    language = models.CharField(max_length=10, default='en')
    author = models.CharField(max_length=150, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    image = models.ImageField(upload_to='podcast_art/', null=True, blank=True)
    
    categories = models.ManyToManyField(PodcastCategory, related_name='podcasts', blank=True)
    
    is_enabled = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'podcasts'

    def __str__(self):
        return self.title

class PodcastEpisode(models.Model):
    podcast = models.ForeignKey(Podcast, on_delete=models.CASCADE, related_name='episodes')
    
    title = models.CharField(max_length=150)
    description = models.TextField(null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    link = models.URLField(max_length=255, null=True, blank=True)
    
    publish_at = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=True)
    explicit = models.BooleanField(default=False)
    
    season = models.IntegerField(null=True, blank=True)
    episode = models.IntegerField(null=True, blank=True)
    
    EPISODE_TYPE_CHOICES = [
        ('full', 'Full'),
        ('trailer', 'Trailer'),
        ('bonus', 'Bonus'),
    ]
    episode_type = models.CharField(max_length=10, choices=EPISODE_TYPE_CHOICES, default='full')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'podcast_episodes'

    def __str__(self):
        return self.title

class PodcastMedia(models.Model):
    episode = models.OneToOneField(PodcastEpisode, on_delete=models.CASCADE, related_name='media')
    storage_location = models.ForeignKey(StorageLocation, on_delete=models.CASCADE)
    
    path = models.CharField(max_length=255)
    length = models.FloatField(default=0)
    length_text = models.CharField(max_length=10, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'podcast_media'
