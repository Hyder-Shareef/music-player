from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class User(BaseModel):
    id: str
    email: Optional[str] = "guest@chong.music"
    name: str = "Chong Listener"
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LikeItem(BaseModel):
    user_id: str
    track_id: str
    track_data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PlaylistRecord(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = ""
    artwork: Optional[str] = None
    tracks: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TrackHistory(BaseModel):
    user_id: str
    track_id: str
    track_data: Dict[str, Any]
    played_at: datetime = Field(default_factory=datetime.utcnow)
    duration_seconds: Optional[int] = 0
    completion_rate: Optional[float] = 1.0

class UserSettings(BaseModel):
    user_id: str
    theme: str = "dark"
    audio_quality: str = "high"
    autoplay: bool = True
    volume: float = 0.8
