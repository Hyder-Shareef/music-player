from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.api.deps import get_music_provider, get_db_repo, get_current_user
from app.services.music_provider import MusicProvider
from app.repositories.base import BaseRepository
from app.models.music import HomeShelf
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[HomeShelf])
async def get_home(
    provider: MusicProvider = Depends(get_music_provider),
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    shelves = await provider.get_home()
    
    # Prepend Recently Played shelf if user has history
    history = await repo.get_history(user.id, limit=10)
    if history:
        history_shelf = HomeShelf(
            title="Recently Played",
            contents=[{"type": "track", "data": t} for t in history[:10]]
        )
        shelves.insert(0, history_shelf)
        
    return shelves
