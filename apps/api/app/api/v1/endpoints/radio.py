from typing import Optional
from fastapi import APIRouter, Depends, Path, Query
from app.api.deps import get_music_provider
from app.services.music_provider import MusicProvider
from app.models.music import RadioStation

router = APIRouter()

@router.get("/{track_id}", response_model=RadioStation)
async def get_radio_station(
    track_id: str = Path(..., description="Seed video/track ID to generate station queue from"),
    playlist_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=10, le=100),
    provider: MusicProvider = Depends(get_music_provider)
):
    return await provider.get_watch_playlist(video_id=track_id, playlist_id=playlist_id, limit=limit)
