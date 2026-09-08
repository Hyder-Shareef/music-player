from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from app.api.deps import get_db_repo, get_current_user
from app.repositories.base import BaseRepository
from app.models.user import User, PlaylistRecord

router = APIRouter()

@router.get("")
async def get_full_library(
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    playlists = await repo.get_user_playlists(user.id)
    likes = await repo.get_liked_tracks(user.id)
    history = await repo.get_history(user.id, limit=30)
    
    return {
        "user": user,
        "playlists": playlists,
        "liked_count": len(likes),
        "liked_tracks": likes,
        "recently_played": history
    }

@router.get("/playlists", response_model=List[PlaylistRecord])
async def get_library_playlists(
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    return await repo.get_user_playlists(user.id)

@router.get("/songs")
async def get_library_songs(
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    return await repo.get_liked_tracks(user.id)
