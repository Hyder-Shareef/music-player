from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path
from app.api.deps import get_music_provider
from app.services.music_provider import MusicProvider
from app.models.music import Artist, Album, Track

router = APIRouter()

@router.get("/{artist_id}", response_model=Artist)
async def get_artist(
    artist_id: str = Path(...),
    provider: MusicProvider = Depends(get_music_provider)
):
    artist = await provider.get_artist(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist

@router.get("/{artist_id}/songs", response_model=List[Track])
async def get_artist_songs(
    artist_id: str = Path(...),
    provider: MusicProvider = Depends(get_music_provider)
):
    artist = await provider.get_artist(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist.top_songs

@router.get("/{artist_id}/albums", response_model=List[Album])
async def get_artist_albums(
    artist_id: str = Path(...),
    provider: MusicProvider = Depends(get_music_provider)
):
    artist = await provider.get_artist(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist.albums
