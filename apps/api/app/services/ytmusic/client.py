import os
import asyncio
from pathlib import Path
from typing import Optional
from ytmusicapi import YTMusic
from app.core.config import settings
from app.core.logging import logger

_ytmusic_instance: Optional[YTMusic] = None
_lock = asyncio.Lock()

def get_ytmusic_client() -> YTMusic:
    global _ytmusic_instance
    if _ytmusic_instance is None:
        auth_path = Path(settings.YTMUSIC_AUTH_PATH)
        if auth_path.exists():
            logger.info(f"Initializing authenticated YTMusic client with {auth_path}")
            try:
                _ytmusic_instance = YTMusic(auth=str(auth_path), language=settings.YTMUSIC_LANGUAGE, location=settings.YTMUSIC_LOCATION)
            except Exception as e:
                logger.warning(f"Failed to load YTMusic auth file: {e}. Falling back to guest client.")
                _ytmusic_instance = YTMusic(language=settings.YTMUSIC_LANGUAGE, location=settings.YTMUSIC_LOCATION)
        else:
            logger.info("Initializing guest YTMusic client")
            _ytmusic_instance = YTMusic(language=settings.YTMUSIC_LANGUAGE, location=settings.YTMUSIC_LOCATION)
    return _ytmusic_instance

async def run_in_threadpool(func, *args, **kwargs):
    """Executes blocking sync ytmusicapi call in an asyncio thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: func(*args, **kwargs))
