# YTMusicAPI Capabilities & Integration Reference

## Supported Capabilities in ytmusicapi (v1.12+)

| Feature | Method | Notes |
| :--- | :--- | :--- |
| **Search** | `YTMusic.search(query, filter=...)` | Filters: `songs`, `videos`, `albums`, `artists`, `playlists`, `podcasts` |
| **Home / Recommendations** | `YTMusic.get_home()` | Returns curated shelves, quick picks, recommended albums |
| **Charts** | `YTMusic.get_charts(country=...)` | Returns top songs, videos, artists, genres |
| **Artist** | `YTMusic.get_artist(channelId)` | Returns header, top songs, albums, singles, related artists |
| **Album** | `YTMusic.get_album(browseId)` | Returns album metadata, description, tracklist |
| **Playlist** | `YTMusic.get_playlist(playlistId)` | Returns playlist metadata and tracks |
| **Watch / Radio Queue** | `YTMusic.get_watch_playlist(videoId=...)` | Generates station queue of related tracks and lyrics token |
| **Lyrics** | `YTMusic.get_lyrics(browseId)` | Returns song lyrics text |
| **Moods & Genres** | `YTMusic.get_mood_categories()` | Curated categories and playlists |
| **User Library (Auth)** | `YTMusic.get_library_songs()`, etc. | Requires optional oauth/headers.json configuration |

## Streaming Capability
- Stream extraction is handled via `yt-dlp` backend worker with caching and direct range-stream proxy at `/api/v1/playback/stream/{track_id}`.
- Audio format: High-bitrate Opus / AAC / WebM / M4A.
