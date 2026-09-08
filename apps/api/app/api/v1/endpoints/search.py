from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_music_provider
from app.services.music_provider import MusicProvider
from app.models.music import SearchResults, Track, Artist, Album, Playlist

router = APIRouter()

@router.get("", response_model=SearchResults)
async def search_all(
    q: str = Query(..., description="Search query string"),
    filter: Optional[str] = Query(None, description="songs, albums, artists, playlists, videos"),
    limit: int = Query(25, ge=1, le=50),
    provider: MusicProvider = Depends(get_music_provider)
):
    return await provider.search(query=q, filter_type=filter, limit=limit)

@router.get("/songs", response_model=List[Track])
async def search_songs(
    q: str = Query(...),
    limit: int = Query(25, ge=1, le=50),
    provider: MusicProvider = Depends(get_music_provider)
):
    results = await provider.search(query=q, filter_type="songs", limit=limit)
    return results.songs

@router.get("/artists", response_model=List[Artist])
async def search_artists(
    q: str = Query(...),
    limit: int = Query(20, ge=1, le=40),
    provider: MusicProvider = Depends(get_music_provider)
):
    results = await provider.search(query=q, filter_type="artists", limit=limit)
    return results.artists

@router.get("/albums", response_model=List[Album])
async def search_albums(
    q: str = Query(...),
    limit: int = Query(20, ge=1, le=40),
    provider: MusicProvider = Depends(get_music_provider)
):
    results = await provider.search(query=q, filter_type="albums", limit=limit)
    return results.albums

@router.get("/playlists", response_model=List[Playlist])
async def search_playlists(
    q: str = Query(...),
    limit: int = Query(20, ge=1, le=40),
    provider: MusicProvider = Depends(get_music_provider)
):
    results = await provider.search(query=q, filter_type="playlists", limit=limit)
    return results.playlists
