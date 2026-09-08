from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class Artwork(BaseModel):
    url: str
    width: Optional[int] = None
    height: Optional[int] = None

class ArtistBasic(BaseModel):
    id: Optional[str] = None
    name: str

class AlbumBasic(BaseModel):
    id: Optional[str] = None
    title: str

class Track(BaseModel):
    id: str
    title: str
    artists: List[ArtistBasic] = Field(default_factory=list)
    album: Optional[AlbumBasic] = None
    duration: Optional[str] = None
    duration_seconds: Optional[int] = None
    artwork: Optional[str] = None
    artworks: List[Artwork] = Field(default_factory=list)
    explicit: bool = False
    provider: str = "ytmusic"
    provider_id: str
    is_available: bool = True
    liked: bool = False
    in_library: bool = False
    video_id: Optional[str] = None

class Album(BaseModel):
    id: str
    title: str
    type: Optional[str] = "Album"
    artists: List[ArtistBasic] = Field(default_factory=list)
    year: Optional[str] = None
    track_count: Optional[int] = None
    duration: Optional[str] = None
    artwork: Optional[str] = None
    artworks: List[Artwork] = Field(default_factory=list)
    description: Optional[str] = None
    tracks: List[Track] = Field(default_factory=list)

class Artist(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    artwork: Optional[str] = None
    artworks: List[Artwork] = Field(default_factory=list)
    subscribers: Optional[str] = None
    top_songs: List[Track] = Field(default_factory=list)
    albums: List[Album] = Field(default_factory=list)
    singles: List[Album] = Field(default_factory=list)
    related: List[ArtistBasic] = Field(default_factory=list)

class Playlist(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    author: Optional[str] = None
    track_count: Optional[int] = None
    duration: Optional[str] = None
    artwork: Optional[str] = None
    artworks: List[Artwork] = Field(default_factory=list)
    tracks: List[Track] = Field(default_factory=list)
    is_editable: bool = False

class Lyrics(BaseModel):
    track_id: str
    lyrics: Optional[str] = None
    source: Optional[str] = None
    is_synced: bool = False
    synced_lyrics: Optional[List[Dict[str, Any]]] = None

class StreamInfo(BaseModel):
    track_id: str
    stream_url: str
    duration: Optional[float] = None
    format: Optional[str] = None
    bitrate: Optional[Union[int, float]] = None
    expires_at: Optional[float] = None

class HomeShelf(BaseModel):
    title: str
    contents: List[Dict[str, Any]] = Field(default_factory=list)

class SearchResults(BaseModel):
    query: str
    top_result: Optional[Dict[str, Any]] = None
    songs: List[Track] = Field(default_factory=list)
    artists: List[Artist] = Field(default_factory=list)
    albums: List[Album] = Field(default_factory=list)
    playlists: List[Playlist] = Field(default_factory=list)
    videos: List[Track] = Field(default_factory=list)

class RadioStation(BaseModel):
    seed_id: str
    tracks: List[Track] = Field(default_factory=list)
    lyrics_id: Optional[str] = None
