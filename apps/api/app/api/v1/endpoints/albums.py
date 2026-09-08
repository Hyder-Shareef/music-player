from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path
from app.api.deps import get_music_provider
from app.services.music_provider import MusicProvider
from app.models.music import Album, Track

router = APIRouter()

@router.get("/{album_id}", response_model=Album)
async def get_album(
    album_id: str = Path(...),
    provider: MusicProvider = Depends(get_music_provider)
):
    album = await provider.get_album(album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.get("/{album_id}/tracks", response_model=List[Track])
async def get_album_tracks(
    album_id: str = Path(...),
    provider: MusicProvider = Depends(get_music_provider)
):
    album = await provider.get_album(album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album.tracks
