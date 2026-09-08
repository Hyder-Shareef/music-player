from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from app.repositories.base import BaseRepository
from app.models.user import User, LikeItem, PlaylistRecord, TrackHistory, UserSettings
from app.core.config import settings
from app.core.logging import logger

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except ImportError:
    AsyncIOMotorClient = None

class MongoRepository(BaseRepository):
    def __init__(self, uri: str = None, db_name: str = None):
        self.uri = uri or settings.MONGODB_URI
        self.db_name = db_name or settings.MONGODB_DB_NAME
        self.client = None
        self.db = None

    async def init_db(self) -> None:
        if not AsyncIOMotorClient:
            logger.warning("Motor is not installed; MongoRepository cannot initialize.")
            return
        logger.info(f"Connecting to MongoDB database: {self.db_name}")
        self.client = AsyncIOMotorClient(self.uri)
        self.db = self.client[self.db_name]
        # Create indexes
        await self.db.playlists.create_index("user_id")
        await self.db.likes.create_index([("user_id", 1), ("track_id", 1)], unique=True)
        await self.db.history.create_index([("user_id", 1), ("played_at", -1)])

    async def get_or_create_user(self, user_id: str) -> User:
        doc = await self.db.users.find_one({"_id": user_id})
        if doc:
            return User(id=doc["_id"], email=doc.get("email"), name=doc.get("name", "Chong Listener"), avatar=doc.get("avatar"))
        user = User(id=user_id, name="Chong Listener", email="listener@chong.music")
        await self.db.users.insert_one({"_id": user.id, "email": user.email, "name": user.name, "avatar": user.avatar, "created_at": datetime.utcnow()})
        return user

    async def get_or_create_user_by_email(self, email: str, name: Optional[str] = None, avatar: Optional[str] = None) -> User:
        clean_email = email.strip().lower()
        doc = await self.db.users.find_one({"email": clean_email})
        if doc:
            current_name = name or doc.get("name", "Chong Listener")
            current_avatar = avatar or doc.get("avatar")
            if name or avatar:
                await self.db.users.update_one({"_id": doc["_id"]}, {"$set": {"name": current_name, "avatar": current_avatar}})
            return User(id=doc["_id"], email=clean_email, name=current_name, avatar=current_avatar)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        display_name = name or (clean_email.split("@")[0].capitalize() if "@" in clean_email else "Chong Listener")
        user = User(id=user_id, email=clean_email, name=display_name, avatar=avatar)
        await self.db.users.insert_one({"_id": user.id, "email": user.email, "name": user.name, "avatar": user.avatar, "created_at": datetime.utcnow()})
        return user

    async def get_user_playlists(self, user_id: str) -> List[PlaylistRecord]:
        cursor = self.db.playlists.find({"user_id": user_id}).sort("updated_at", -1)
        playlists = []
        async for doc in cursor:
            tracks = doc.get("tracks", [])
            artwork = doc.get("artwork") or (tracks[0].get("artwork") if tracks else None)
            playlists.append(PlaylistRecord(
                id=doc["_id"],
                user_id=doc["user_id"],
                title=doc["title"],
                description=doc.get("description", ""),
                artwork=artwork,
                tracks=tracks,
                created_at=doc.get("created_at", datetime.utcnow()),
                updated_at=doc.get("updated_at", datetime.utcnow())
            ))
        return playlists

    async def get_playlist(self, playlist_id: str) -> Optional[PlaylistRecord]:
        doc = await self.db.playlists.find_one({"_id": playlist_id})
        if not doc:
            return None
        tracks = doc.get("tracks", [])
        artwork = doc.get("artwork") or (tracks[0].get("artwork") if tracks else None)
        return PlaylistRecord(
            id=doc["_id"],
            user_id=doc["user_id"],
            title=doc["title"],
            description=doc.get("description", ""),
            artwork=artwork,
            tracks=tracks
        )

    async def create_playlist(self, user_id: str, title: str, description: str = "") -> PlaylistRecord:
        playlist_id = f"pl_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        doc = {
            "_id": playlist_id,
            "user_id": user_id,
            "title": title,
            "description": description,
            "artwork": None,
            "tracks": [],
            "created_at": now,
            "updated_at": now
        }
        await self.db.playlists.insert_one(doc)
        return PlaylistRecord(id=playlist_id, user_id=user_id, title=title, description=description, tracks=[], created_at=now, updated_at=now)

    async def update_playlist(self, playlist_id: str, title: Optional[str] = None, description: Optional[str] = None) -> Optional[PlaylistRecord]:
        update_fields: Dict[str, Any] = {"updated_at": datetime.utcnow()}
        if title is not None:
            update_fields["title"] = title
        if description is not None:
            update_fields["description"] = description
        await self.db.playlists.update_one({"_id": playlist_id}, {"$set": update_fields})
        return await self.get_playlist(playlist_id)

    async def delete_playlist(self, playlist_id: str) -> bool:
        res = await self.db.playlists.delete_one({"_id": playlist_id})
        return res.deleted_count > 0

    async def add_track_to_playlist(self, playlist_id: str, track: Dict[str, Any]) -> Optional[PlaylistRecord]:
        playlist = await self.get_playlist(playlist_id)
        if not playlist:
            return None
        track_id = track.get("id") or track.get("provider_id")
        tracks = [t for t in playlist.tracks if (t.get("id") or t.get("provider_id")) != track_id]
        tracks.append(track)
        artwork = playlist.artwork or track.get("artwork")
        await self.db.playlists.update_one(
            {"_id": playlist_id},
            {"$set": {"tracks": tracks, "artwork": artwork, "updated_at": datetime.utcnow()}}
        )
        return await self.get_playlist(playlist_id)

    async def remove_track_from_playlist(self, playlist_id: str, track_id: str) -> Optional[PlaylistRecord]:
        playlist = await self.get_playlist(playlist_id)
        if not playlist:
            return None
        tracks = [t for t in playlist.tracks if (t.get("id") or t.get("provider_id")) != track_id]
        artwork = tracks[0].get("artwork") if tracks else None
        await self.db.playlists.update_one(
            {"_id": playlist_id},
            {"$set": {"tracks": tracks, "artwork": artwork, "updated_at": datetime.utcnow()}}
        )
        return await self.get_playlist(playlist_id)

    async def reorder_playlist_tracks(self, playlist_id: str, tracks: List[Dict[str, Any]]) -> Optional[PlaylistRecord]:
        artwork = tracks[0].get("artwork") if tracks else None
        await self.db.playlists.update_one(
            {"_id": playlist_id},
            {"$set": {"tracks": tracks, "artwork": artwork, "updated_at": datetime.utcnow()}}
        )
        return await self.get_playlist(playlist_id)

    async def get_liked_tracks(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self.db.likes.find({"user_id": user_id}).sort("created_at", -1)
        tracks = []
        async for doc in cursor:
            t = doc.get("track_data", {})
            t["liked"] = True
            tracks.append(t)
        return tracks

    async def is_track_liked(self, user_id: str, track_id: str) -> bool:
        doc = await self.db.likes.find_one({"user_id": user_id, "track_id": track_id})
        return bool(doc)

    async def set_track_like(self, user_id: str, track_id: str, track_data: Dict[str, Any], liked: bool) -> bool:
        if liked:
            await self.db.likes.update_one(
                {"user_id": user_id, "track_id": track_id},
                {"$set": {"track_data": track_data, "created_at": datetime.utcnow()}},
                upsert=True
            )
        else:
            await self.db.likes.delete_one({"user_id": user_id, "track_id": track_id})
        return liked

    async def add_history_entry(self, user_id: str, track_id: str, track_data: Dict[str, Any], duration_seconds: int = 0) -> TrackHistory:
        now = datetime.utcnow()
        await self.db.history.insert_one({
            "user_id": user_id,
            "track_id": track_id,
            "track_data": track_data,
            "duration_seconds": duration_seconds,
            "played_at": now
        })
        return TrackHistory(user_id=user_id, track_id=track_id, track_data=track_data, duration_seconds=duration_seconds, played_at=now)

    async def get_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        cursor = self.db.history.find({"user_id": user_id}).sort("played_at", -1).limit(limit)
        history = []
        seen = set()
        async for doc in cursor:
            t = doc.get("track_data", {})
            tid = t.get("id") or t.get("provider_id")
            if tid not in seen:
                seen.add(tid)
                t["played_at"] = doc.get("played_at")
                history.append(t)
        return history

    async def clear_history(self, user_id: str) -> bool:
        await self.db.history.delete_many({"user_id": user_id})
        return True

    async def get_settings(self, user_id: str) -> UserSettings:
        doc = await self.db.user_settings.find_one({"_id": user_id})
        if doc:
            return UserSettings(
                user_id=user_id,
                theme=doc.get("theme", "dark"),
                audio_quality=doc.get("audio_quality", "high"),
                autoplay=doc.get("autoplay", True),
                volume=doc.get("volume", 0.8)
            )
        return UserSettings(user_id=user_id)

    async def update_settings(self, user_id: str, settings_dict: Dict[str, Any]) -> UserSettings:
        await self.db.user_settings.update_one(
            {"_id": user_id},
            {"$set": settings_dict},
            upsert=True
        )
        return await self.get_settings(user_id)
