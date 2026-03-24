import datetime
import random
import logging
import math
from typing import List, Optional

from django.utils import timezone
from django.db.models import Q
from stations.models import Station, StationPlaylist
from media.models import StationMedia, Song
from .models import StationQueue, StationRequest
from .scheduler import Scheduler

logger = logging.getLogger(__name__)

class QueueBuilder:
    def __init__(self, scheduler: Scheduler = None):
        self.scheduler = scheduler or Scheduler()

    def calculate_next_song(self, station: Station, expected_play_time: datetime.datetime = None, is_interrupting: bool = False) -> Optional[StationQueue]:
        if expected_play_time is None:
            expected_play_time = timezone.now()
            
        logger.info(f"Calculating next song for station {station.name} at {expected_play_time}")

        if not is_interrupting:
            existing_queue = StationQueue.objects.filter(
                station=station,
                is_played=False
            ).order_by('timestamp_cued').first()
            
            if existing_queue:
                return existing_queue

        if not is_interrupting:
            next_request = StationRequest.objects.filter(
                station=station,
                played_at__isnull=True
            ).order_by('timestamp').first()
        
        if next_request:
            return self.create_queue_from_request(next_request)
            
        # 2. Get recently played song history for duplicate prevention
        history_minutes = station.backend_config.get('duplicate_prevention_time_range', 15) if station.backend_config else 15
        threshold = expected_play_time - datetime.timedelta(minutes=history_minutes)
        
        recent_history = StationQueue.objects.filter(
            station=station,
            timestamp_played__gte=threshold
        ).values_list('media__unique_id', flat=True)
        recent_history_set = set(recent_history)

        # 3. Define playlist types by priority (matching original)
        playlist_types_by_priority = [
            'once_per_hour',
            'once_per_x_songs',
            'once_per_x_minutes',
            'default', # Standard
        ]

        for playlist_type in playlist_types_by_priority:
            for is_scheduled in [True, False]:
                playlists = StationPlaylist.objects.filter(
                    station=station,
                    is_enabled=True,
                    type=playlist_type
                )
                
                # Filter by whether they have schedule items or not
                if is_scheduled:
                    playlists = playlists.filter(schedule_items__isnull=False).distinct()
                else:
                    playlists = playlists.filter(schedule_items__isnull=True)

                eligible_playlists = {}
                for playlist in playlists:
                    if self.scheduler.should_playlist_play_now(playlist, expected_play_time):
                        eligible_playlists[playlist.id] = playlist.weight
                
                if not eligible_playlists:
                    continue

                shuffled_playlist_ids = self.weighted_shuffle(eligible_playlists)

                for allow_duplicates in [False, True]:
                    for playlist_id in shuffled_playlist_ids:
                        playlist = playlists.get(id=playlist_id)
                        
                        if playlist.source == 'remote_url':
                            return self.create_queue_from_remote_url(station, playlist)
                        
                        media = self.choose_media_from_playlist(playlist, recent_history_set, allow_duplicates)
                        if media:
                            logger.info(f"Selected song '{media.title}' from playlist '{playlist.name}'")
                            return self.create_queue_from_media(station, media, playlist)
        
        logger.warning(f"No playable tracks found for station {station.name}")
        return None

    def weighted_shuffle(self, items: dict) -> List[int]:
        """
        Implements an exponential weighted shuffle.
        items: { id: weight }
        """
        if not items:
            return []
            
        weighted_items = []
        for item_id, weight in items.items():
            score = random.random() ** (1.0 / max(weight, 1))
            weighted_items.append((score, item_id))
            
        weighted_items.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in weighted_items]

    def choose_media_from_playlist(self, playlist: StationPlaylist, recent_history: set, allow_duplicates: bool) -> Optional[StationMedia]:
        media_items = playlist.media_items.all()
        if not media_items.exists():
            return None

        if playlist.playback_order == 'random':
            # Try random selection
            media_list = list(media_items)
            random.shuffle(media_list)
            for media in media_list:
                if not playlist.avoid_duplicates or allow_duplicates or media.unique_id not in recent_history:
                    return media
            return None

        # For sequential and shuffle, we manage a persistent queue in JSON
        queue = playlist.queue or []
        if not queue:
            all_media_ids = list(media_items.values_list('id', flat=True))
            if playlist.playback_order == 'shuffle':
                random.shuffle(all_media_ids)
            else:
                all_media_ids.sort()
            queue = all_media_ids

        # Find the next playable song in the queue
        original_queue = list(queue)
        while queue:
            next_media_id = queue.pop(0)
            media = StationMedia.objects.filter(id=next_media_id).first()
            
            if media:
                if playlist.avoid_duplicates and not allow_duplicates and media.unique_id in recent_history:
                    continue
                
                playlist.queue = queue
                playlist.save()
                return media

        if allow_duplicates and original_queue:
            playlist.queue = []
            playlist.save()
            return StationMedia.objects.filter(id=original_queue[0]).first()

        return None

    def create_queue_from_request(self, request: StationRequest) -> StationQueue:
        queue = StationQueue.objects.create(
            station=request.station,
            media=request.track,
            request=request,
            title=request.track.title,
            artist=request.track.artist,
            album=request.track.album,
            duration=request.track.length,
            is_visible=True
        )
        request.played_at = timezone.now()
        request.save()
        return queue

    def create_queue_from_media(self, station: Station, media: StationMedia, playlist: StationPlaylist) -> StationQueue:
        return StationQueue.objects.create(
            station=station,
            playlist=playlist,
            media=media,
            title=media.title,
            artist=media.artist,
            album=media.album,
            duration=media.length,
            is_visible=not playlist.is_jingle
        )

    def create_queue_from_remote_url(self, station: Station, playlist: StationPlaylist) -> StationQueue:
        return StationQueue.objects.create(
            station=station,
            playlist=playlist,
            title="Remote Playlist URL",
            artist=playlist.name,
            autodj_custom_uri=playlist.remote_url,
            duration=0,
            is_visible=True
        )
