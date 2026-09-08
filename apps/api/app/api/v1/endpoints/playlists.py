from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Path
from app.api.deps import get_music_provider, get_db_repo, get_current_user
from app.services.music_provider import MusicProvider
from app.repositories.base import BaseRepository
from app.models.music import Playlist, Track
from app.models.user import User, PlaylistRecord

router = APIRouter()

class CreatePlaylistRequest(BaseModel):
    title: str
    description: Optional[str] = ""

class UpdatePlaylistRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class AddTrackRequest(BaseModel):
    track: Dict[str, Any]

class ReorderTracksRequest(BaseModel):
    tracks: List[Dict[str, Any]]

@router.get("/{playlist_id}", response_model=Playlist)
async def get_playlist(
    playlist_id: str = Path(...),
    provider: MusicProvider = Depends(get_music_provider),
    repo: BaseRepository = Depends(get_db_repo)
):
    # Check custom user playlists first
    if playlist_id.startswith("pl_"):
        user_pl = await repo.get_playlist(playlist_id)
        if user_pl:
            return Playlist(
                id=user_pl.id,
                title=user_pl.title,
                description=user_pl.description,
                author="You",
                track_count=len(user_pl.tracks),
                artwork=user_pl.artwork,
                tracks=[Track(**t) if isinstance(t, dict) and "title" in t else t for t in user_pl.tracks],
                is_editable=True
            )

    # Provider playlist
    playlist = await provider.get_playlist(playlist_id)
    if not playlist:
        # Fallback check if user playlist without pl_ prefix
        user_pl = await repo.get_playlist(playlist_id)
        if user_pl:
            return Playlist(
                id=user_pl.id,
                title=user_pl.title,
                description=user_pl.description,
                author="You",
                track_count=len(user_pl.tracks),
                artwork=user_pl.artwork,
                tracks=[Track(**t) if isinstance(t, dict) and "title" in t else t for t in user_pl.tracks],
                is_editable=True
            )
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@router.post("", response_model=Playlist)
async def create_playlist(
    req: CreatePlaylistRequest,
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    pl = await repo.create_playlist(user_id=user.id, title=req.title, description=req.description)
    return Playlist(
        id=pl.id,
        title=pl.title,
        description=pl.description,
        author="You",
        track_count=0,
        artwork=None,
        tracks=[],
        is_editable=True
    )

@router.patch("/{playlist_id}", response_model=Playlist)
async def update_playlist(
    playlist_id: str = Path(...),
    req: UpdatePlaylistRequest = None,
    repo: BaseRepository = Depends(get_db_repo)
):
    title = req.title if req else None
    desc = req.description if req else None
    pl = await repo.update_playlist(playlist_id, title=title, description=desc)
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return Playlist(
        id=pl.id,
        title=pl.title,
        description=pl.description,
        author="You",
        track_count=len(pl.tracks),
        artwork=pl.artwork,
        tracks=[Track(**t) if isinstance(t, dict) and "title" in t else t for t in pl.tracks],
        is_editable=True
    )

@router.delete("/{playlist_id}")
async def delete_playlist(
    playlist_id: str = Path(...),
    repo: BaseRepository = Depends(get_db_repo)
):
    success = await repo.delete_playlist(playlist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist deleted successfully", "id": playlist_id}

@router.post("/{playlist_id}/tracks", response_model=Playlist)
async def add_track(
    playlist_id: str = Path(...),
    req: AddTrackRequest = None,
    repo: BaseRepository = Depends(get_db_repo)
):
    if not req or not req.track:
        raise HTTPException(status_code=400, detail="Track payload required")
    pl = await repo.add_track_to_playlist(playlist_id, req.track)
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return Playlist(
        id=pl.id,
        title=pl.title,
        description=pl.description,
        author="You",
        track_count=len(pl.tracks),
        artwork=pl.artwork,
        tracks=[Track(**t) if isinstance(t, dict) and "title" in t else t for t in pl.tracks],
        is_editable=True
    )

@router.delete("/{playlist_id}/tracks/{track_id}", response_model=Playlist)
async def remove_track(
    playlist_id: str = Path(...),
    track_id: str = Path(...),
    repo: BaseRepository = Depends(get_db_repo)
):
    pl = await repo.remove_track_from_playlist(playlist_id, track_id)
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return Playlist(
        id=pl.id,
        title=pl.title,
        description=pl.description,
        author="You",
        track_count=len(pl.tracks),
        artwork=pl.artwork,
        tracks=[Track(**t) if isinstance(t, dict) and "title" in t else t for t in pl.tracks],
        is_editable=True
    )

@router.put("/{playlist_id}/tracks", response_model=Playlist)
async def reorder_tracks(
    playlist_id: str = Path(...),
    req: ReorderTracksRequest = None,
    repo: BaseRepository = Depends(get_db_repo)
):
    if not req:
        raise HTTPException(status_code=400, detail="Tracks payload required")
    pl = await repo.reorder_playlist_tracks(playlist_id, req.tracks)
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return Playlist(
        id=pl.id,
        title=pl.title,
        description=pl.description,
        author="You",
        track_count=len(pl.tracks),
        artwork=pl.artwork,
        tracks=[Track(**t) if isinstance(t, dict) and "title" in t else t for t in pl.tracks],
        is_editable=True
    )
