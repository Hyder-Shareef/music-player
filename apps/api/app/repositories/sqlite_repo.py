import aiosqlite
import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
from app.repositories.base import BaseRepository
from app.models.user import User, LikeItem, PlaylistRecord, TrackHistory, UserSettings
from app.core.config import settings
from app.core.logging import logger

class SQLiteRepository(BaseRepository):
    def __init__(self, db_path: str = None):
        self.db_path = db_path or settings.DATABASE_PATH
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

    async def init_db(self) -> None:
        logger.info(f"Initializing SQLite database at {self.db_path}")
        async with aiosqlite.connect(self.db_path) as db:
            # Users table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT,
                    name TEXT,
                    avatar TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Playlists table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS playlists (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    artwork TEXT,
                    tracks_json TEXT DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.execute("CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id)")

            # Likes table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS likes (
                    user_id TEXT NOT NULL,
                    track_id TEXT NOT NULL,
                    track_data_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, track_id)
                )
            """)

            # History table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    track_id TEXT NOT NULL,
                    track_data_json TEXT NOT NULL,
                    duration_seconds INTEGER DEFAULT 0,
                    completion_rate REAL DEFAULT 1.0,
                    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.execute("CREATE INDEX IF NOT EXISTS idx_history_user_played ON history(user_id, played_at DESC)")

            # Settings table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS user_settings (
                    user_id TEXT PRIMARY KEY,
                    theme TEXT DEFAULT 'dark',
                    audio_quality TEXT DEFAULT 'high',
                    autoplay INTEGER DEFAULT 1,
                    volume REAL DEFAULT 0.8
                )
            """)
            
            await db.commit()

    async def get_or_create_user(self, user_id: str) -> User:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = await cursor.fetchone()
            if row:
                return User(
                    id=row["id"],
                    email=row["email"],
                    name=row["name"],
                    avatar=row["avatar"]
                )
            else:
                user = User(id=user_id, name="Chong Listener", email="listener@chong.music")
                await db.execute(
                    "INSERT INTO users (id, email, name, avatar) VALUES (?, ?, ?, ?)",
                    (user.id, user.email, user.name, user.avatar)
                )
                await db.commit()
                return user

    async def get_or_create_user_by_email(self, email: str, name: Optional[str] = None, avatar: Optional[str] = None) -> User:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
            row = await cursor.fetchone()
            if row:
                user_id = row["id"]
                current_name = name or row["name"]
                current_avatar = avatar or row["avatar"]
                if name or avatar:
                    await db.execute("UPDATE users SET name = ?, avatar = ? WHERE id = ?", (current_name, current_avatar, user_id))
                    await db.commit()
                return User(
                    id=user_id,
                    email=row["email"],
                    name=current_name,
                    avatar=current_avatar
                )
            else:
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                clean_email = email.strip().lower()
                display_name = name or (clean_email.split("@")[0].capitalize() if "@" in clean_email else "Chong Listener")
                user = User(id=user_id, email=clean_email, name=display_name, avatar=avatar)
                await db.execute(
                    "INSERT INTO users (id, email, name, avatar) VALUES (?, ?, ?, ?)",
                    (user.id, user.email, user.name, user.avatar)
                )
                await db.commit()
                return user

    # Playlists
    async def get_user_playlists(self, user_id: str) -> List[PlaylistRecord]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM playlists WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
            rows = await cursor.fetchall()
            playlists = []
            for row in rows:
                tracks = json.loads(row["tracks_json"] or "[]")
                artwork = row["artwork"] or (tracks[0].get("artwork") if tracks else None)
                playlists.append(PlaylistRecord(
                    id=row["id"],
                    user_id=row["user_id"],
                    title=row["title"],
                    description=row["description"],
                    artwork=artwork,
                    tracks=tracks,
                    created_at=datetime.fromisoformat(row["created_at"]) if isinstance(row["created_at"], str) else datetime.utcnow(),
                    updated_at=datetime.fromisoformat(row["updated_at"]) if isinstance(row["updated_at"], str) else datetime.utcnow()
                ))
            return playlists

    async def get_playlist(self, playlist_id: str) -> Optional[PlaylistRecord]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM playlists WHERE id = ?", (playlist_id,))
            row = await cursor.fetchone()
            if not row:
                return None
            tracks = json.loads(row["tracks_json"] or "[]")
            artwork = row["artwork"] or (tracks[0].get("artwork") if tracks else None)
            return PlaylistRecord(
                id=row["id"],
                user_id=row["user_id"],
                title=row["title"],
                description=row["description"],
                artwork=artwork,
                tracks=tracks
            )

    async def create_playlist(self, user_id: str, title: str, description: str = "") -> PlaylistRecord:
        playlist_id = f"pl_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO playlists (id, user_id, title, description, tracks_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (playlist_id, user_id, title, description, "[]", now.isoformat(), now.isoformat())
            )
            await db.commit()
        return PlaylistRecord(
            id=playlist_id,
            user_id=user_id,
            title=title,
            description=description,
            tracks=[],
            created_at=now,
            updated_at=now
        )

    async def update_playlist(self, playlist_id: str, title: Optional[str] = None, description: Optional[str] = None) -> Optional[PlaylistRecord]:
        async with aiosqlite.connect(self.db_path) as db:
            now = datetime.utcnow().isoformat()
            if title is not None and description is not None:
                await db.execute("UPDATE playlists SET title = ?, description = ?, updated_at = ? WHERE id = ?", (title, description, now, playlist_id))
            elif title is not None:
                await db.execute("UPDATE playlists SET title = ?, updated_at = ? WHERE id = ?", (title, now, playlist_id))
            elif description is not None:
                await db.execute("UPDATE playlists SET description = ?, updated_at = ? WHERE id = ?", (description, now, playlist_id))
            await db.commit()
        return await self.get_playlist(playlist_id)

    async def delete_playlist(self, playlist_id: str) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
            await db.commit()
            return cursor.rowcount > 0

    async def add_track_to_playlist(self, playlist_id: str, track: Dict[str, Any]) -> Optional[PlaylistRecord]:
        playlist = await self.get_playlist(playlist_id)
        if not playlist:
            return None
        # Avoid duplicate track addition if identical ID
        track_id = track.get("id") or track.get("provider_id")
        tracks = [t for t in playlist.tracks if (t.get("id") or t.get("provider_id")) != track_id]
        tracks.append(track)
        
        artwork = playlist.artwork or track.get("artwork")
        now = datetime.utcnow().isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE playlists SET tracks_json = ?, artwork = ?, updated_at = ? WHERE id = ?",
                (json.dumps(tracks), artwork, now, playlist_id)
            )
            await db.commit()
        return await self.get_playlist(playlist_id)

    async def remove_track_from_playlist(self, playlist_id: str, track_id: str) -> Optional[PlaylistRecord]:
        playlist = await self.get_playlist(playlist_id)
        if not playlist:
            return None
        tracks = [t for t in playlist.tracks if (t.get("id") or t.get("provider_id")) != track_id]
        artwork = tracks[0].get("artwork") if tracks else None
        now = datetime.utcnow().isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE playlists SET tracks_json = ?, artwork = ?, updated_at = ? WHERE id = ?",
                (json.dumps(tracks), artwork, now, playlist_id)
            )
            await db.commit()
        return await self.get_playlist(playlist_id)

    async def reorder_playlist_tracks(self, playlist_id: str, tracks: List[Dict[str, Any]]) -> Optional[PlaylistRecord]:
        playlist = await self.get_playlist(playlist_id)
        if not playlist:
            return None
        artwork = tracks[0].get("artwork") if tracks else None
        now = datetime.utcnow().isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE playlists SET tracks_json = ?, artwork = ?, updated_at = ? WHERE id = ?",
                (json.dumps(tracks), artwork, now, playlist_id)
            )
            await db.commit()
        return await self.get_playlist(playlist_id)

    # Likes
    async def get_liked_tracks(self, user_id: str) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT track_data_json FROM likes WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            rows = await cursor.fetchall()
            tracks = []
            for row in rows:
                try:
                    data = json.loads(row["track_data_json"])
                    data["liked"] = True
                    tracks.append(data)
                except Exception:
                    continue
            return tracks

    async def is_track_liked(self, user_id: str, track_id: str) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?", (user_id, track_id))
            row = await cursor.fetchone()
            return bool(row)

    async def set_track_like(self, user_id: str, track_id: str, track_data: Dict[str, Any], liked: bool) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            if liked:
                await db.execute(
                    "INSERT OR REPLACE INTO likes (user_id, track_id, track_data_json, created_at) VALUES (?, ?, ?, ?)",
                    (user_id, track_id, json.dumps(track_data), datetime.utcnow().isoformat())
                )
            else:
                await db.execute("DELETE FROM likes WHERE user_id = ? AND track_id = ?", (user_id, track_id))
            await db.commit()
            return liked

    # History
    async def add_history_entry(self, user_id: str, track_id: str, track_data: Dict[str, Any], duration_seconds: int = 0) -> TrackHistory:
        entry_id = f"hist_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO history (id, user_id, track_id, track_data_json, duration_seconds, played_at) VALUES (?, ?, ?, ?, ?, ?)",
                (entry_id, user_id, track_id, json.dumps(track_data), duration_seconds, now.isoformat())
            )
            # Limit history to 200 items per user
            await db.execute("""
                DELETE FROM history WHERE id NOT IN (
                    SELECT id FROM history WHERE user_id = ? ORDER BY played_at DESC LIMIT 200
                ) AND user_id = ?
            """, (user_id, user_id))
            await db.commit()
        return TrackHistory(
            user_id=user_id,
            track_id=track_id,
            track_data=track_data,
            duration_seconds=duration_seconds,
            played_at=now
        )

    async def get_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT track_data_json, played_at FROM history WHERE user_id = ? ORDER BY played_at DESC LIMIT ?", (user_id, limit))
            rows = await cursor.fetchall()
            history = []
            seen_ids = set()
            for row in rows:
                try:
                    data = json.loads(row["track_data_json"])
                    track_id = data.get("id") or data.get("provider_id")
                    if track_id not in seen_ids:
                        seen_ids.add(track_id)
                        data["played_at"] = row["played_at"]
                        history.append(data)
                except Exception:
                    continue
            return history

    async def clear_history(self, user_id: str) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM history WHERE user_id = ?", (user_id,))
            await db.commit()
            return True

    # Settings
    async def get_settings(self, user_id: str) -> UserSettings:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM user_settings WHERE user_id = ?", (user_id,))
            row = await cursor.fetchone()
            if row:
                return UserSettings(
                    user_id=row["user_id"],
                    theme=row["theme"],
                    audio_quality=row["audio_quality"],
                    autoplay=bool(row["autoplay"]),
                    volume=row["volume"]
                )
            else:
                s = UserSettings(user_id=user_id)
                await db.execute(
                    "INSERT INTO user_settings (user_id, theme, audio_quality, autoplay, volume) VALUES (?, ?, ?, ?, ?)",
                    (s.user_id, s.theme, s.audio_quality, int(s.autoplay), s.volume)
                )
                await db.commit()
                return s

    async def update_settings(self, user_id: str, settings_dict: Dict[str, Any]) -> UserSettings:
        s = await self.get_settings(user_id)
        theme = settings_dict.get("theme", s.theme)
        quality = settings_dict.get("audio_quality", s.audio_quality)
        autoplay = settings_dict.get("autoplay", s.autoplay)
        volume = settings_dict.get("volume", s.volume)
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT OR REPLACE INTO user_settings (user_id, theme, audio_quality, autoplay, volume) VALUES (?, ?, ?, ?, ?)",
                (user_id, theme, quality, int(autoplay), volume)
            )
            await db.commit()
        return UserSettings(
            user_id=user_id,
            theme=theme,
            audio_quality=quality,
            autoplay=autoplay,
            volume=volume
        )
