from fastapi import APIRouter, Depends, Path
from app.api.deps import get_music_provider
from app.services.music_provider import MusicProvider
from app.models.music import Lyrics

router = APIRouter()

@router.get("/{track_id_or_lyrics_id}", response_model=Lyrics)
async def get_lyrics(
    track_id_or_lyrics_id: str = Path(...),
    provider: MusicProvider = Depends(get_music_provider)
):
    return await provider.get_lyrics(track_id_or_lyrics_id)
