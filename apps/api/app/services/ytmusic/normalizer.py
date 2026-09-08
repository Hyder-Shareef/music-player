from typing import List, Optional, Dict, Any
from app.models.music import Track, Album, Artist, Playlist, Artwork, ArtistBasic, AlbumBasic
import re

def clean_title(title: Optional[str]) -> str:
    if not title:
        return "Unknown Track"
    # Remove common YouTube noise suffixes
    cleaned = title
    patterns = [
        r'\s*[\(\[]\s*official\s*(music\s*)?(video|audio|visualizer|lyric\s*video|stream|hd|4k)\s*[\)\]]',
        r'\s*[\(\[]\s*lyrics?\s*(video)?\s*[\)\]]',
        r'\s*[\(\[]\s*audio\s*[\)\]]',
        r'\s*[\(\[]\s*visualizer\s*[\)\]]',
        r'\s*[\(\[]\s*explicit\s*[\)\]]',
        r'\s*[\(\[]\s*clean\s*[\)\]]',
        r'\s*[\(\[]\s*remastered(\s*\d{4})?\s*[\)\]]',
        r'\s*[\(\[]\s*4k\s*[\)\]]',
        r'\s*[\(\[]\s*hd\s*[\)\]]',
        r'\s*[\(\[]\s*premiere\s*[\)\]]',
        r'\s*[\(\[]\s*full\s*song\s*[\)\]]',
        r'\s*\|\s*Official\s*(Music\s*)?Video.*$',
    ]
    for pat in patterns:
        cleaned = re.sub(pat, '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    return cleaned if cleaned else title

def clean_artist_name(name: Optional[str]) -> str:
    if not name:
        return "Unknown Artist"
    cleaned = re.sub(r'\s*-\s*Topic$', '', name, flags=re.IGNORECASE)
    cleaned = re.sub(r'VEVO$', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    return cleaned if cleaned else name

def clean_album_title(title: Optional[str]) -> str:
    if not title:
        return "Single"
    cleaned = re.sub(r'\s*[\(\[]\s*explicit\s*[\)\]]', '', title, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*[\(\[]\s*clean\s*[\)\]]', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    return cleaned if cleaned else title

def parse_duration_to_seconds(duration_str: Optional[str]) -> Optional[int]:
    if not duration_str:
        return None
    parts = duration_str.split(":")
    try:
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    except Exception:
        return None
    return None

def normalize_thumbnails(thumbnails: Optional[List[Dict[str, Any]]]) -> tuple[Optional[str], List[Artwork]]:
    if not thumbnails:
        return None, []
    artworks = []
    for t in thumbnails:
        url = t.get("url", "")
        # Upgrade standard youtube thumbnail resolution if applicable
        if "=w" in url and "=h" in url:
            url = re.sub(r"=w\d+-h\d+", "=w800-h800-l90-rj", url)
        elif "=s" in url:
            url = re.sub(r"=s\d+", "=s800-l90-rj", url)
        artworks.append(Artwork(url=url, width=t.get("width"), height=t.get("height")))
    
    # Highest quality artwork
    best_art = artworks[-1].url if artworks else None
    return best_art, artworks

def normalize_track(raw: Dict[str, Any]) -> Track:
    video_id = raw.get("videoId") or raw.get("id") or raw.get("provider_id") or ""
    raw_title = raw.get("title") or "Unknown Track"
    title = clean_title(raw_title)
    
    # Artists Extraction
    artists = []
    raw_artists = raw.get("artists") or raw.get("author") or raw.get("artist") or []
    if isinstance(raw_artists, list):
        for a in raw_artists:
            if isinstance(a, dict):
                artists.append(ArtistBasic(id=a.get("id"), name=clean_artist_name(a.get("name") or a.get("artist"))))
            elif isinstance(a, str) and a.strip():
                artists.append(ArtistBasic(id=None, name=clean_artist_name(a)))
    elif isinstance(raw_artists, dict):
        artists.append(ArtistBasic(id=raw_artists.get("id"), name=clean_artist_name(raw_artists.get("name") or raw_artists.get("artist"))))
    elif isinstance(raw_artists, str) and raw_artists.strip():
        artists.append(ArtistBasic(id=None, name=clean_artist_name(raw_artists)))
        
    # Check subtitle for artist if empty (e.g. "The Weeknd • Starboy")
    if not artists and raw.get("subtitle"):
        sub = raw.get("subtitle")
        if isinstance(sub, str) and "•" in sub:
            part = sub.split("•")[0].strip()
            if part:
                artists.append(ArtistBasic(id=None, name=clean_artist_name(part)))

    # If title has "Artist - Song Title" format, extract artist
    if (not artists or artists[0].name == "Unknown Artist") and " - " in raw_title:
        parts = raw_title.split(" - ", 1)
        possible_artist = parts[0].strip()
        possible_title = parts[1].strip()
        if possible_artist and possible_title:
            artists = [ArtistBasic(id=None, name=clean_artist_name(possible_artist))]
            title = clean_title(possible_title)

    if not artists:
        artists.append(ArtistBasic(id=None, name="Unknown Artist"))

    # Album
    album_obj = None
    raw_album = raw.get("album")
    if isinstance(raw_album, dict):
        album_name = clean_album_title(raw_album.get("name") or raw_album.get("title"))
        album_obj = AlbumBasic(id=raw_album.get("id"), title=album_name)
    elif isinstance(raw_album, str):
        album_obj = AlbumBasic(id=None, title=clean_album_title(raw_album))

    duration_str = raw.get("duration") or raw.get("length")
    duration_secs = raw.get("duration_seconds") or parse_duration_to_seconds(duration_str)

    best_art, artworks = normalize_thumbnails(raw.get("thumbnails"))
    if not best_art and raw.get("artwork"):
        best_art = raw.get("artwork")
    if not best_art and video_id:
        best_art = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

    explicit = bool(raw.get("isExplicit") or raw.get("explicit", False))

    return Track(
        id=video_id,
        title=title,
        artists=artists,
        album=album_obj,
        duration=duration_str,
        duration_seconds=duration_secs,
        artwork=best_art,
        artworks=artworks,
        explicit=explicit,
        provider="ytmusic",
        provider_id=video_id,
        is_available=True,
        video_id=video_id
    )

def normalize_album(raw: Dict[str, Any]) -> Album:
    browse_id = raw.get("browseId") or raw.get("id") or raw.get("playlistId") or ""
    raw_title = raw.get("title") or "Unknown Album"
    title = clean_album_title(raw_title)
    
    artists = []
    raw_artists = raw.get("artists") or raw.get("artist") or raw.get("author") or []
    if isinstance(raw_artists, list):
        for a in raw_artists:
            if isinstance(a, dict):
                artists.append(ArtistBasic(id=a.get("id"), name=clean_artist_name(a.get("name") or a.get("artist"))))
            elif isinstance(a, str) and a.strip():
                artists.append(ArtistBasic(id=None, name=clean_artist_name(a)))
    elif isinstance(raw_artists, dict):
        artists.append(ArtistBasic(id=raw_artists.get("id"), name=clean_artist_name(raw_artists.get("name") or raw_artists.get("artist"))))
    elif isinstance(raw_artists, str) and raw_artists.strip():
        artists.append(ArtistBasic(id=None, name=clean_artist_name(raw_artists)))

    best_art, artworks = normalize_thumbnails(raw.get("thumbnails"))
    if not best_art and raw.get("artwork"):
        best_art = raw.get("artwork")

    tracks = []
    for t in raw.get("tracks", []):
        if not t.get("thumbnails") and raw.get("thumbnails"):
            t["thumbnails"] = raw.get("thumbnails")
        if not t.get("artists") and artists:
            t["artists"] = [{"id": a.id, "name": a.name} for a in artists]
        if not t.get("album"):
            t["album"] = {"id": browse_id, "name": title}
        tracks.append(normalize_track(t))

    return Album(
        id=browse_id,
        title=title,
        type=raw.get("type") or "Album",
        artists=artists,
        year=str(raw.get("year")) if raw.get("year") else None,
        track_count=len(tracks) if tracks else raw.get("trackCount"),
        duration=raw.get("duration"),
        artwork=best_art,
        artworks=artworks,
        description=raw.get("description"),
        tracks=tracks
    )

def normalize_artist(raw: Dict[str, Any]) -> Artist:
    channel_id = raw.get("channelId") or raw.get("id") or raw.get("browseId") or ""
    raw_name = raw.get("artist") or raw.get("name") or raw.get("title") or raw.get("author") or "Unknown Artist"
    name = clean_artist_name(raw_name)
    
    best_art, artworks = normalize_thumbnails(raw.get("thumbnails"))

    top_songs = []
    songs_section = raw.get("songs") or {}
    for s in songs_section.get("results", []):
        top_songs.append(normalize_track(s))

    albums = []
    albums_section = raw.get("albums") or {}
    for a in albums_section.get("results", []):
        albums.append(normalize_album(a))

    singles = []
    singles_section = raw.get("singles") or {}
    for s in singles_section.get("results", []):
        singles.append(normalize_album(s))

    related = []
    related_section = raw.get("related") or {}
    for r in related_section.get("results", []):
        r_id = r.get("browseId") or r.get("id")
        r_name = r.get("title") or r.get("name") or r.get("artist") or "Artist"
        related.append(ArtistBasic(id=r_id, name=r_name))

    return Artist(
        id=channel_id,
        name=name,
        description=raw.get("description"),
        artwork=best_art,
        artworks=artworks,
        subscribers=raw.get("subscribers"),
        top_songs=top_songs,
        albums=albums,
        singles=singles,
        related=related
    )

def normalize_playlist(raw: Dict[str, Any]) -> Playlist:
    playlist_id = raw.get("id") or raw.get("playlistId") or ""
    title = raw.get("title") or "Playlist"
    
    best_art, artworks = normalize_thumbnails(raw.get("thumbnails"))
    author = raw.get("author")
    if isinstance(author, list) and author:
        author = author[0].get("name")
    elif isinstance(author, dict):
        author = author.get("name")

    tracks = []
    for t in raw.get("tracks", []):
        if t.get("videoId"):
            tracks.append(normalize_track(t))

    return Playlist(
        id=playlist_id,
        title=title,
        description=raw.get("description"),
        author=author,
        track_count=len(tracks) if tracks else raw.get("trackCount"),
        duration=raw.get("duration"),
        artwork=best_art,
        artworks=artworks,
        tracks=tracks,
        is_editable=False
    )
