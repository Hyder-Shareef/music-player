import time
import asyncio
from typing import Dict, Any, Optional
import yt_dlp
from app.models.music import StreamInfo
from app.core.logging import logger
from app.core.exceptions import PlaybackException

_stream_cache: Dict[str, Dict[str, Any]] = {}

def _extract_stream_info(video_id: str) -> Dict[str, Any]:
    urls_to_try = [
        f"https://music.youtube.com/watch?v={video_id}",
        f"https://www.youtube.com/watch?v={video_id}"
    ]
    
    ydl_opts = {
        'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
        'nocheckcertificate': True,
        'cachedir': False,
        'youtube_include_dash_manifest': False,
        'headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }
    
    last_err = None
    for url in urls_to_try:
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info and info.get("url"):
                    return {
                        "stream_url": info.get("url"),
                        "duration": info.get("duration"),
                        "format": info.get("ext") or "m4a",
                        "bitrate": info.get("abr") or 128,
                        "title": info.get("title")
                    }
        except Exception as e:
            last_err = e
            continue

    if last_err:
        raise last_err
    raise Exception(f"Unable to extract stream for video ID: {video_id}")

async def resolve_stream(video_id: str) -> StreamInfo:
    global _stream_cache
    now = time.time()
    
    # Check cache (valid for 4 hours)
    if video_id in _stream_cache:
        cached = _stream_cache[video_id]
        if cached["expires_at"] > now:
            return StreamInfo(
                track_id=video_id,
                stream_url=cached["stream_url"],
                duration=cached["duration"],
                format=cached["format"],
                bitrate=cached["bitrate"],
                expires_at=cached["expires_at"]
            )

    try:
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(None, _extract_stream_info, video_id)
        stream_url = data.get("stream_url")
        if not stream_url:
            raise PlaybackException(f"No streamable URL found for video ID: {video_id}")

        expires_at = now + 14400 # 4 hours
        _stream_cache[video_id] = {
            "stream_url": stream_url,
            "duration": data.get("duration"),
            "format": data.get("format"),
            "bitrate": data.get("bitrate"),
            "expires_at": expires_at
        }

        return StreamInfo(
            track_id=video_id,
            stream_url=stream_url,
            duration=data.get("duration"),
            format=data.get("format"),
            bitrate=data.get("bitrate"),
            expires_at=expires_at
        )
    except Exception as e:
        logger.error(f"Error resolving stream for {video_id}: {e}", exc_info=True)
        raise PlaybackException(f"Failed to extract audio stream for {video_id}: {str(e)}")
