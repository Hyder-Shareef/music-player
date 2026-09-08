from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from app.models.music import Track, Album, Artist, Playlist, Lyrics, HomeShelf, SearchResults, RadioStation

class MusicProvider(ABC):
    @abstractmethod
    async def get_home(self) -> List[HomeShelf]:
        pass

    @abstractmethod
    async def search(self, query: str, filter_type: Optional[str] = None, limit: int = 25) -> SearchResults:
        pass

    @abstractmethod
    async def get_artist(self, artist_id: str) -> Optional[Artist]:
        pass

    @abstractmethod
    async def get_album(self, album_id: str) -> Optional[Album]:
        pass

    @abstractmethod
    async def get_playlist(self, playlist_id: str) -> Optional[Playlist]:
        pass

    @abstractmethod
    async def get_watch_playlist(self, video_id: str, playlist_id: Optional[str] = None, limit: int = 50) -> RadioStation:
        pass

    @abstractmethod
    async def get_lyrics(self, browse_id_or_video_id: str) -> Lyrics:
        pass

    @abstractmethod
    async def get_charts(self, country: str = "US") -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_explore_genres(self) -> Dict[str, Any]:
        pass
