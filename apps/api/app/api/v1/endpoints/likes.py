from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Path, HTTPException
from app.api.deps import get_db_repo, get_current_user
from app.repositories.base import BaseRepository
from app.models.user import User

router = APIRouter()

class LikeTrackRequest(BaseModel):
    track: Dict[str, Any]

@router.get("", response_model=List[Dict[str, Any]])
async def get_all_likes(
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    return await repo.get_liked_tracks(user.id)

@router.get("/{track_id}")
async def check_like(
    track_id: str = Path(...),
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    is_liked = await repo.is_track_liked(user.id, track_id)
    return {"track_id": track_id, "liked": is_liked}

@router.post("/{track_id}")
async def like_track(
    track_id: str = Path(...),
    req: LikeTrackRequest = None,
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    track_data = req.track if req else {"id": track_id, "provider_id": track_id, "title": "Track"}
    await repo.set_track_like(user.id, track_id, track_data, liked=True)
    return {"track_id": track_id, "liked": True}

@router.delete("/{track_id}")
async def unlike_track(
    track_id: str = Path(...),
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    await repo.set_track_like(user.id, track_id, {}, liked=False)
    return {"track_id": track_id, "liked": False}
