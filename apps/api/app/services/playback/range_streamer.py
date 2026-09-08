from typing import AsyncGenerator, Optional, Tuple
import httpx
from fastapi import Request, Response
from fastapi.responses import StreamingResponse
from app.services.playback.stream_resolver import resolve_stream
from app.core.logging import logger

CHUNK_SIZE = 1024 * 256  # 256 KB

async def stream_audio_range(video_id: str, request: Request) -> Response:
    stream_info = await resolve_stream(video_id)
    stream_url = stream_info.stream_url

    headers = {}
    range_header = request.headers.get("range")
    if range_header:
        headers["Range"] = range_header

    client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
    
    try:
        upstream_req = client.build_request("GET", stream_url, headers=headers)
        upstream_resp = await client.send(upstream_req, stream=True)

        status_code = upstream_resp.status_code
        response_headers = {
            "Accept-Ranges": "bytes",
            "Content-Type": upstream_resp.headers.get("Content-Type", "audio/webm"),
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Range, Content-Range, Content-Type",
            "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges"
        }

        if "Content-Length" in upstream_resp.headers:
            response_headers["Content-Length"] = upstream_resp.headers["Content-Length"]
        if "Content-Range" in upstream_resp.headers:
            response_headers["Content-Range"] = upstream_resp.headers["Content-Range"]

        async def audio_generator() -> AsyncGenerator[bytes, None]:
            try:
                async for chunk in upstream_resp.aiter_bytes(chunk_size=CHUNK_SIZE):
                    yield chunk
            finally:
                await upstream_resp.aclose()
                await client.aclose()

        return StreamingResponse(
            audio_generator(),
            status_code=status_code,
            headers=response_headers,
            media_type=response_headers["Content-Type"]
        )
    except Exception as e:
        logger.error(f"Error streaming audio range for {video_id}: {e}")
        await client.aclose()
        return Response(content="Audio stream error", status_code=502)
