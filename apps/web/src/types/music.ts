export interface Artwork {
  url: string;
  width?: number;
  height?: number;
}

export interface ArtistBasic {
  id?: string | null;
  name: string;
}

export interface AlbumBasic {
  id?: string | null;
  title: string;
}

export interface Track {
  id: string;
  title: string;
  artists: ArtistBasic[];
  album?: AlbumBasic | null;
  duration?: string | null;
  duration_seconds?: number | null;
  artwork?: string | null;
  artworks?: Artwork[];
  explicit?: boolean;
  provider?: string;
  provider_id: string;
  is_available?: boolean;
  liked?: boolean;
  in_library?: boolean;
  video_id?: string | null;
}

export interface Album {
  id: string;
  title: string;
  type?: string;
  artists: ArtistBasic[];
  year?: string | null;
  track_count?: number | null;
  duration?: string | null;
  artwork?: string | null;
  artworks?: Artwork[];
  description?: string | null;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  description?: string | null;
  artwork?: string | null;
  artworks?: Artwork[];
  subscribers?: string | null;
  top_songs: Track[];
  albums: Album[];
  singles: Album[];
  related: ArtistBasic[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string | null;
  author?: string | null;
  track_count?: number | null;
  duration?: string | null;
  artwork?: string | null;
  artworks?: Artwork[];
  tracks: Track[];
  is_editable?: boolean;
}

export interface Lyrics {
  track_id: string;
  lyrics?: string | null;
  source?: string | null;
  is_synced?: boolean;
  synced_lyrics?: Array<{ time: number; text: string }>;
}

export interface HomeShelf {
  title: string;
  contents: Array<{
    type: 'track' | 'album' | 'artist' | 'playlist' | 'generic';
    data: any;
  }>;
}

export interface SearchResults {
  query: string;
  top_result?: {
    type: 'song' | 'artist' | 'album' | 'playlist';
    item: any;
  } | null;
  songs: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  videos: Track[];
}

export interface RadioStation {
  seed_id: string;
  tracks: Track[];
  lyrics_id?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface PlaylistRecord {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  artwork?: string | null;
  tracks: Track[];
  created_at?: string;
  updated_at?: string;
}
