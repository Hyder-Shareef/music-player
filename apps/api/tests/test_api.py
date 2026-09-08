import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.repositories import get_repository

@pytest_asyncio.fixture(autouse=True)
async def initialize_test_database():
    repo = get_repository()
    await repo.init_db()

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_search():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/search?q=The+Weeknd&limit=5")
        assert res.status_code == 200
        data = res.json()
        assert "query" in data
        assert len(data.get("songs", [])) > 0 or len(data.get("artists", [])) > 0

@pytest.mark.asyncio
async def test_custom_playlist_crud():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create
        res = await ac.post("/api/v1/playlists", json={"title": "Test Chill Vibes", "description": "My test playlist"})
        assert res.status_code == 200
        pl = res.json()
        pl_id = pl["id"]
        assert pl["title"] == "Test Chill Vibes"

        # Add track
        res = await ac.post(f"/api/v1/playlists/{pl_id}/tracks", json={
            "track": {
                "id": "J7p4bzqLvCw",
                "title": "Blinding Lights",
                "provider_id": "J7p4bzqLvCw",
                "artists": [{"id": "1", "name": "The Weeknd"}]
            }
        })
        assert res.status_code == 200
        assert len(res.json()["tracks"]) == 1

        # Delete
        res = await ac.delete(f"/api/v1/playlists/{pl_id}")
        assert res.status_code == 200

@pytest.mark.asyncio
async def test_likes_and_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Like track
        res = await ac.post("/api/v1/likes/test_track_1", json={
            "track": {"id": "test_track_1", "provider_id": "test_track_1", "title": "Starboy"}
        })
        assert res.status_code == 200
        assert res.json()["liked"] is True

        # Check like
        res = await ac.get("/api/v1/likes/test_track_1")
        assert res.status_code == 200
        assert res.json()["liked"] is True

        # Record history
        res = await ac.post("/api/v1/history", json={
            "track_id": "test_track_1",
            "track": {"id": "test_track_1", "provider_id": "test_track_1", "title": "Starboy"},
            "duration_seconds": 120
        })
        assert res.status_code == 200

        # Get history
        res = await ac.get("/api/v1/history")
        assert res.status_code == 200
        assert len(res.json()) >= 1
