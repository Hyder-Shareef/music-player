from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from app.models.user import User, LikeItem, PlaylistRecord, TrackHistory, UserSettings

class BaseRepository(ABC):
    @abstractmethod
    async def init_db(self) -> None:
        pass

    # Playlists
    @abstractmethod
    async def get_user_playlists(self, user_id: str) -> List[PlaylistRecord]:
        pass

    @abstractmethod
    async def get_playlist(self, playlist_id: str) -> Optional[PlaylistRecord]:
        pass

    @abstractmethod
    async def create_playlist(self, user_id: str, title: str, description: str = "") -> PlaylistRecord:
        pass

    @abstractmethod
    async def update_playlist(self, playlist_id: str, title: Optional[str] = None, description: Optional[str] = None) -> Optional[PlaylistRecord]:
        pass

    @abstractmethod
    async def delete_playlist(self, playlist_id: str) -> bool:
        pass

    @abstractmethod
    async def add_track_to_playlist(self, playlist_id: str, track: Dict[str, Any]) -> Optional[PlaylistRecord]:
        pass

    @abstractmethod
    async def remove_track_from_playlist(self, playlist_id: str, track_id: str) -> Optional[PlaylistRecord]:
        pass

    @abstractmethod
    async def reorder_playlist_tracks(self, playlist_id: str, tracks: List[Dict[str, Any]]) -> Optional[PlaylistRecord]:
        pass

    # Likes / Favorites
    @abstractmethod
    async def get_liked_tracks(self, user_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def is_track_liked(self, user_id: str, track_id: str) -> bool:
        pass

    @abstractmethod
    async def set_track_like(self, user_id: str, track_id: str, track_data: Dict[str, Any], liked: bool) -> bool:
        pass

    # History
    @abstractmethod
    async def add_history_entry(self, user_id: str, track_id: str, track_data: Dict[str, Any], duration_seconds: int = 0) -> TrackHistory:
        pass

    @abstractmethod
    async def get_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def clear_history(self, user_id: str) -> bool:
        pass

    # User & Settings
    @abstractmethod
    async def get_or_create_user(self, user_id: str) -> User:
        pass

    @abstractmethod
    async def get_or_create_user_by_email(self, email: str, name: Optional[str] = None, avatar: Optional[str] = None) -> User:
        pass

    @abstractmethod
    async def get_settings(self, user_id: str) -> UserSettings:
        pass

    @abstractmethod
    async def update_settings(self, user_id: str, settings_dict: Dict[str, Any]) -> UserSettings:
        pass
