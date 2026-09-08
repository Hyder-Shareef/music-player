from fastapi import APIRouter, Path, Request, Response
from app.services.playback.stream_resolver import resolve_stream
from app.services.playback.range_streamer import stream_audio_range
from app.models.music import StreamInfo

router = APIRouter()

@router.get("/info/{track_id}", response_model=StreamInfo)
async def get_stream_info(track_id: str = Path(...)):
    """Returns direct audio stream URL and format metadata."""
    return await resolve_stream(track_id)

@router.api_route("/stream/{track_id}", methods=["GET", "HEAD"])
async def stream_track(track_id: str = Path(...), request: Request = None):
    """Streams audio supporting HTTP 206 Partial Content (Range requests) for seeking and buffering."""
    return await stream_audio_range(track_id, request)
