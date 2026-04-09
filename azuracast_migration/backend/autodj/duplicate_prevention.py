from typing import List, Optional
from media.models import StationMedia

class DuplicatePrevention:
    def prevent_duplicates(self, media_queue: List[StationMedia], recent_history: List[dict], allow_duplicates: bool = False) -> Optional[StationMedia]:
        """
        Logique pour choisir un média dans la file d'attente tout en évitant les doublons
        basé sur l'historique récent.
        """
        if not media_queue:
            return None

        recent_song_ids = {history['song_id'] for history in recent_history}

        for media in media_queue:
            if media.song_id not in recent_song_ids:
                return media

        if not allow_duplicates:
            return None

        return media_queue[0]
