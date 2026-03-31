import os
import glob
from celery import shared_task
from django.utils import timezone
from .models import Podcast, PodcastEpisode, PodcastMedia
from stations.models import Station
from media.models import StorageLocation

@shared_task
def scan_recordings():
    """
    Scans the recordings/ folder for each station and creates podcast episodes.
    """
    stations = Station.objects.all()
    for station in stations:
        recording_dir = os.path.join(station.radio_base_dir, 'recordings')
        if not os.path.exists(recording_dir):
            continue
            
        recording_files = glob.glob(os.path.join(recording_dir, '*.mp3'))
        
        podcast, created = Podcast.objects.get_or_create(
            station=station,
            title=f"Direct Replays - {station.name}",
            defaults={
                'description': f"Enregistrements automatiques des directs de {station.name}.",
                'is_published': True
            }
        )
        
        for file_path in recording_files:
            filename = os.path.basename(file_path)
            
            if PodcastMedia.objects.filter(path=filename).exists():
                continue
                
            mod_time = os.path.getmtime(file_path)
            publish_at = timezone.datetime.fromtimestamp(mod_time, tz=timezone.utc)
            
            episode = PodcastEpisode.objects.create(
                podcast=podcast,
                title=f"Direct du {publish_at.strftime('%d/%m/%Y à %H:%M')}",
                description="Enregistrement automatique du direct.",
                publish_at=publish_at,
                is_published=True
            )
            
            storage = StorageLocation.objects.first()
            
            PodcastMedia.objects.create(
                episode=episode,
                storage_location=storage,
                path=filename,
                length=0
            )
            
            print(f"Imported recording: {filename} into Podcast: {podcast.title}")
