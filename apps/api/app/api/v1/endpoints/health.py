from fastapi import APIRouter
import time

router = APIRouter()
_start_time = time.time()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "chong-api",
        "uptime_seconds": int(time.time() - _start_time)
    }

@router.get("/health/provider")
async def health_provider_check():
    return {
        "provider": "ytmusic",
        "status": "connected"
    }
