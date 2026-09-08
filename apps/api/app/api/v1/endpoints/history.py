from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_db_repo, get_current_user
from app.repositories.base import BaseRepository
from app.models.user import User

router = APIRouter()

class RecordHistoryRequest(BaseModel):
    track_id: str
    track: Dict[str, Any]
    duration_seconds: Optional[int] = 0

@router.get("", response_model=List[Dict[str, Any]])
async def get_playback_history(
    limit: int = Query(50, ge=1, le=100),
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    return await repo.get_history(user.id, limit=limit)

@router.post("")
async def record_playback(
    req: RecordHistoryRequest,
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    await repo.add_history_entry(
        user_id=user.id,
        track_id=req.track_id,
        track_data=req.track,
        duration_seconds=req.duration_seconds or 0
    )
    return {"status": "recorded", "track_id": req.track_id}

@router.delete("")
async def clear_playback_history(
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    await repo.clear_history(user.id)
    return {"status": "cleared"}
