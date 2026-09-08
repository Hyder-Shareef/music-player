from typing import Optional
from fastapi import Header, Depends
from app.repositories import get_repository
from app.repositories.base import BaseRepository
from app.services.music_provider import MusicProvider
from app.services.ytmusic.provider import YTMusicProvider
from app.services.auth.auth_service import auth_service
from app.models.user import User

_music_provider: Optional[MusicProvider] = None

def get_music_provider() -> MusicProvider:
    global _music_provider
    if _music_provider is None:
        _music_provider = YTMusicProvider()
    return _music_provider

def get_db_repo() -> BaseRepository:
    return get_repository()

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    repo: BaseRepository = Depends(get_db_repo)
) -> User:
    user_id = "guest_default_user"
    if x_user_id:
        user_id = x_user_id
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = auth_service.decode_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    return await repo.get_or_create_user(user_id)
