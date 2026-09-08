from typing import List, Optional, Dict, Any
from app.services.music_provider import MusicProvider
from app.services.ytmusic.client import get_ytmusic_client, run_in_threadpool
from app.services.ytmusic.normalizer import (
    normalize_track,
    normalize_album,
    normalize_artist,
    normalize_playlist,
    normalize_thumbnails
)
from app.models.music import (
    Track, Album, Artist, Playlist, Lyrics, HomeShelf, SearchResults, RadioStation
)
from app.core.logging import logger

class YTMusicProvider(MusicProvider):
    def __init__(self):
        pass

    async def get_home(self) -> List[HomeShelf]:
        client = get_ytmusic_client()
        try:
            raw_home = await run_in_threadpool(client.get_home, limit=8)
            shelves = []
            for shelf in raw_home:
                title = shelf.get("title", "")
                contents = []
                for item in shelf.get("contents", []):
                    item_type = item.get("type", "").lower()
                    if item.get("videoId"):
                        contents.append({"type": "track", "data": normalize_track(item).model_dump()})
                    elif "album" in item_type or item.get("browseId", "").startswith("MPREb_"):
                        contents.append({"type": "album", "data": normalize_album(item).model_dump()})
                    elif "artist" in item_type or item.get("browseId", "").startswith("UC"):
                        contents.append({"type": "artist", "data": normalize_artist(item).model_dump()})
                    elif "playlist" in item_type or item.get("browseId", "").startswith("VL") or item.get("playlistId"):
                        contents.append({"type": "playlist", "data": normalize_playlist(item).model_dump()})
                    elif item.get("thumbnails"):
                        best_art, _ = normalize_thumbnails(item.get("thumbnails"))
                        contents.append({
                            "type": "generic",
                            "data": {
                                "id": item.get("browseId") or item.get("id") or item.get("playlistId"),
                                "title": item.get("title"),
                                "description": item.get("description"),
                                "artwork": best_art
                            }
                        })
                if contents:
                    shelves.append(HomeShelf(title=title, contents=contents))
            return shelves
        except Exception as e:
            logger.error(f"Error in YTMusicProvider.get_home: {e}", exc_info=True)
            return []

    async def search(self, query: str, filter_type: Optional[str] = None, limit: int = 25) -> SearchResults:
        import asyncio
        client = get_ytmusic_client()
        valid_filter = filter_type if filter_type in ["songs", "videos", "albums", "artists", "playlists", "podcasts"] else None
        
        try:
            if valid_filter:
                raw_results = await run_in_threadpool(client.search, query=query, filter=valid_filter, limit=limit)
                songs = []
                artists = []
                albums = []
                playlists = []
                videos = []

                for item in raw_results:
                    category = item.get("resultType", item.get("category", "")).lower()
                    if valid_filter == "songs" or category == "song" or (item.get("videoId") and category != "video"):
                        songs.append(normalize_track(item))
                    elif valid_filter == "artists" or category == "artist":
                        artists.append(normalize_artist(item))
                    elif valid_filter == "albums" or category == "album":
                        albums.append(normalize_album(item))
                    elif valid_filter == "playlists" or category == "playlist":
                        playlists.append(normalize_playlist(item))
                    elif valid_filter == "videos" or category == "video":
                        videos.append(normalize_track(item))

                return SearchResults(
                    query=query,
                    top_result=None,
                    songs=songs,
                    artists=artists,
                    albums=albums,
                    playlists=playlists,
                    videos=videos
                )

            # For 'all' search: query songs, artists, albums in parallel for maximum richness
            raw_gen, raw_songs, raw_artists, raw_albums = await asyncio.gather(
                run_in_threadpool(client.search, query=query, limit=10),
                run_in_threadpool(client.search, query=query, filter="songs", limit=15),
                run_in_threadpool(client.search, query=query, filter="artists", limit=8),
                run_in_threadpool(client.search, query=query, filter="albums", limit=8),
                return_exceptions=True
            )

            songs = []
            artists = []
            albums = []
            playlists = []
            videos = []

            # Populate artists
            if isinstance(raw_artists, list):
                for item in raw_artists:
                    artists.append(normalize_artist(item))

            # Populate songs
            if isinstance(raw_songs, list):
                for item in raw_songs:
                    songs.append(normalize_track(item))

            # Populate albums
            if isinstance(raw_albums, list):
                for item in raw_albums:
                    albums.append(normalize_album(item))

            # Populate general search extras (e.g. playlists or top hits)
            if isinstance(raw_gen, list):
                for item in raw_gen:
                    cat = item.get("resultType", "").lower()
                    if cat == "playlist":
                        playlists.append(normalize_playlist(item))
                    elif cat == "artist" and not any(a.id == (item.get("browseId") or item.get("id")) for a in artists):
                        artists.append(normalize_artist(item))
                    elif cat == "album" and not any(al.id == (item.get("browseId") or item.get("id")) for al in albums):
                        albums.append(normalize_album(item))

            # Deduplicate by ID
            seen_song_ids = set()
            unique_songs = []
            for s in songs:
                sid = s.id or s.provider_id
                if sid and sid not in seen_song_ids:
                    seen_song_ids.add(sid)
                    unique_songs.append(s)

            seen_artist_ids = set()
            unique_artists = []
            for a in artists:
                aid = a.id
                if aid and aid not in seen_artist_ids:
                    seen_artist_ids.add(aid)
                    unique_artists.append(a)

            # Determine Top Result intelligently
            top_result = None
            q_lower = query.strip().lower()
            
            # Check if query matches artist name
            matching_artist = next((a for a in unique_artists if a.name.lower() == q_lower or q_lower in a.name.lower()), None)
            if matching_artist:
                top_result = {"type": "artist", "item": matching_artist.model_dump()}
            elif unique_songs:
                top_result = {"type": "song", "item": unique_songs[0].model_dump()}
            elif unique_artists:
                top_result = {"type": "artist", "item": unique_artists[0].model_dump()}
            elif albums:
                top_result = {"type": "album", "item": albums[0].model_dump()}

            return SearchResults(
                query=query,
                top_result=top_result,
                songs=unique_songs,
                artists=unique_artists,
                albums=albums,
                playlists=playlists,
                videos=videos
            )
        except Exception as e:
            logger.error(f"Error in YTMusicProvider.search for '{query}': {e}", exc_info=True)
            return SearchResults(query=query)

    async def get_artist(self, artist_id: str) -> Optional[Artist]:
        client = get_ytmusic_client()
        try:
            raw = await run_in_threadpool(client.get_artist, channelId=artist_id)
            if not raw:
                return None
            return normalize_artist(raw)
        except Exception as e:
            logger.error(f"Error in YTMusicProvider.get_artist({artist_id}): {e}")
            return None

    async def get_album(self, album_id: str) -> Optional[Album]:
        client = get_ytmusic_client()
        try:
            raw = await run_in_threadpool(client.get_album, browseId=album_id)
            if not raw:
                return None
            return normalize_album(raw)
        except Exception as e:
            logger.error(f"Error in YTMusicProvider.get_album({album_id}): {e}")
            return None

    async def get_playlist(self, playlist_id: str) -> Optional[Playlist]:
        client = get_ytmusic_client()
        try:
            raw = await run_in_threadpool(client.get_playlist, playlistId=playlist_id, limit=100)
            if not raw:
                return None
            return normalize_playlist(raw)
        except Exception as e:
            logger.error(f"Error in YTMusicProvider.get_playlist({playlist_id}): {e}")
            return None

    async def get_watch_playlist(self, video_id: str, playlist_id: Optional[str] = None, limit: int = 50) -> RadioStation:
        client = get_ytmusic_client()
        try:
            raw = await run_in_threadpool(client.get_watch_playlist, videoId=video_id, playlistId=playlist_id, limit=limit)
            tracks = []
            for t in raw.get("tracks", []):
                if t.get("videoId"):
                    tracks.append(normalize_track(t))
            lyrics_id = raw.get("lyrics")
            return RadioStation(seed_id=video_id, tracks=tracks, lyrics_id=lyrics_id)
        except Exception as e:
            logger.error(f"Error in YTMusicProvider.get_watch_playlist({video_id}): {e}")
            return RadioStation(seed_id=video_id, tracks=[])

    async def get_lyrics(self, browse_id_or_video_id: str) -> Lyrics:
        import httpx
        client = get_ytmusic_client()
        lyrics_id = browse_id_or_video_id
        track_title = ""
        artist_name = ""
        duration_sec = 0

        # Step 1: If it's a videoId, resolve watch playlist to obtain track title, artist, and lyrics browse ID
        if len(browse_id_or_video_id) == 11 and not browse_id_or_video_id.startswith("MPLY"):
            try:
                watch = await run_in_threadpool(client.get_watch_playlist, videoId=browse_id_or_video_id)
                if watch.get("lyrics"):
                    lyrics_id = watch.get("lyrics")
                tracks = watch.get("tracks", [])
                if tracks:
                    current_track = tracks[0]
                    track_title = current_track.get("title", "")
                    raw_arts = current_track.get("artists", [])
                    if raw_arts:
                        artist_name = raw_arts[0].get("name", "") if isinstance(raw_arts[0], dict) else str(raw_arts[0])
            except Exception as e:
                logger.warning(f"Failed to resolve watch info for lyrics {browse_id_or_video_id}: {e}")

        # Step 2: Query LRCLIB for millisecond-precision synced lyrics
        if track_title:
            try:
                async with httpx.AsyncClient(timeout=4.0) as http_client:
                    params = {
                        "track_name": track_title,
                    }
                    if artist_name:
                        params["artist_name"] = artist_name
                    res = await http_client.get("https://lrclib.net/api/get", params=params)
                    if res.status_code == 200:
                        lrc_json = res.json()
                        if lrc_json.get("syncedLyrics"):
                            return Lyrics(
                                track_id=browse_id_or_video_id,
                                lyrics=lrc_json["syncedLyrics"],
                                source="LRCLIB Synced",
                                is_synced=True
                            )
                        elif lrc_json.get("plainLyrics"):
                            return Lyrics(
                                track_id=browse_id_or_video_id,
                                lyrics=lrc_json["plainLyrics"],
                                source="LRCLIB",
                                is_synced=False
                            )
            except Exception as e:
                logger.debug(f"LRCLIB direct fetch omitted: {e}")

        # Step 3: Fallback to YouTube Music lyrics
        try:
            raw_lyrics = await run_in_threadpool(client.get_lyrics, browseId=lyrics_id)
            if raw_lyrics and raw_lyrics.get("lyrics"):
                return Lyrics(
                    track_id=browse_id_or_video_id,
                    lyrics=raw_lyrics.get("lyrics"),
                    source=raw_lyrics.get("source") or "YouTube Music",
                    is_synced=False
                )
        except Exception as e:
            logger.warning(f"YTMusic lyrics lookup error for {lyrics_id}: {e}")

        return Lyrics(track_id=browse_id_or_video_id, lyrics=None)

    async def get_charts(self, country: str = "US") -> Dict[str, Any]:
        client = get_ytmusic_client()
        try:
            raw = await run_in_threadpool(client.get_charts, country=country)
            songs = [normalize_track(t).model_dump() for t in (raw.get("videos", {}).get("items") or raw.get("songs", {}).get("items") or [])]
            artists = [normalize_artist(a).model_dump() for a in (raw.get("artists", {}).get("items") or [])]
            genres = raw.get("genres", {}).get("items", [])
            return {
                "country": country,
                "songs": songs,
                "artists": artists,
                "genres": genres
            }
        except Exception as e:
            logger.error(f"Error in YTMusicProvider.get_charts: {e}")
            return {"country": country, "songs": [], "artists": [], "genres": []}

    async def get_explore_genres(self) -> Dict[str, Any]:
        client = get_ytmusic_client()
        try:
            mood_categories = await run_in_threadpool(client.get_mood_categories)
            return {"categories": mood_categories}
        except Exception as e:
            logger.error(f"Error in YTMusicProvider.get_explore_genres: {e}")
            return {"categories": {}}
