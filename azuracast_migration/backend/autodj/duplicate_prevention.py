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

        # Extraire les IDs des chansons de l'historique récent
        recent_song_ids = {history['song_id'] for history in recent_history}

        # Essayer de trouver une chanson qui n'est pas dans l'historique récent
        for media in media_queue:
            if media.song_id not in recent_song_ids:
                return media

        # Si on arrive ici, toutes les chansons de la file d'attente sont des doublons potentiels.
        # Si les doublons ne sont pas autorisés, on ne retourne rien.
        if not allow_duplicates:
            return None

        # Sinon, retourner le premier élément de la file d'attente comme solution de repli.
        return media_queue[0]
