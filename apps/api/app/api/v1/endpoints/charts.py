from typing import Dict, Any
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_music_provider
from app.services.music_provider import MusicProvider

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
async def get_charts(
    country: str = Query("US", description="Two-letter country code"),
    provider: MusicProvider = Depends(get_music_provider)
):
    return await provider.get_charts(country=country)
