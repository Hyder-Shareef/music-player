from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.api.deps import get_db_repo, get_current_user
from app.repositories.base import BaseRepository
from app.models.user import User, UserSettings

router = APIRouter()

@router.get("/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    return user

@router.get("/settings", response_model=UserSettings)
async def get_settings(
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    return await repo.get_settings(user.id)

@router.patch("/settings", response_model=UserSettings)
async def update_settings(
    settings_dict: Dict[str, Any],
    repo: BaseRepository = Depends(get_db_repo),
    user: User = Depends(get_current_user)
):
    return await repo.update_settings(user.id, settings_dict)
