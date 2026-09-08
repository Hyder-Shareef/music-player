import axios from 'axios';
import {
  Track,
  Album,
  Artist,
  Playlist,
  Lyrics,
  HomeShelf,
  SearchResults,
  RadioStation,
  User,
  PlaylistRecord
} from '../types/music';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token and user ID header from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('chong_auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  let userId = localStorage.getItem('chong_user_id');
  if (!userId) {
    userId = `chong_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('chong_user_id', userId);
  }
  config.headers['x-user-id'] = userId;
  return config;
});

export const musicApi = {
  // Home
  getHome: async (): Promise<HomeShelf[]> => {
    const res = await apiClient.get<HomeShelf[]>('/home');
    return res.data;
  },

  // Search
  search: async (q: string, filter?: string): Promise<SearchResults> => {
    const res = await apiClient.get<SearchResults>('/search', {
      params: { q, filter, limit: 30 }
    });
    return res.data;
  },

  // Artists
  getArtist: async (id: string): Promise<Artist> => {
    const res = await apiClient.get<Artist>(`/artists/${id}`);
    return res.data;
  },

  // Albums
  getAlbum: async (id: string): Promise<Album> => {
    const res = await apiClient.get<Album>(`/albums/${id}`);
    return res.data;
  },

  // Playlists
  getPlaylist: async (id: string): Promise<Playlist> => {
    const res = await apiClient.get<Playlist>(`/playlists/${id}`);
    return res.data;
  },

  createPlaylist: async (title: string, description: string = ''): Promise<Playlist> => {
    const res = await apiClient.post<Playlist>('/playlists', { title, description });
    return res.data;
  },

  updatePlaylist: async (id: string, title?: string, description?: string): Promise<Playlist> => {
    const res = await apiClient.patch<Playlist>(`/playlists/${id}`, { title, description });
    return res.data;
  },

  deletePlaylist: async (id: string): Promise<void> => {
    await apiClient.delete(`/playlists/${id}`);
  },

  addTrackToPlaylist: async (playlistId: string, track: Track): Promise<Playlist> => {
    const res = await apiClient.post<Playlist>(`/playlists/${playlistId}/tracks`, { track });
    return res.data;
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string): Promise<Playlist> => {
    const res = await apiClient.delete<Playlist>(`/playlists/${playlistId}/tracks/${trackId}`);
    return res.data;
  },

  reorderPlaylist: async (playlistId: string, tracks: Track[]): Promise<Playlist> => {
    const res = await apiClient.put<Playlist>(`/playlists/${playlistId}/tracks`, { tracks });
    return res.data;
  },

  // Playback
  getStreamUrl: (trackId: string): string => {
    return `${API_BASE}/playback/stream/${trackId}`;
  },

  // Lyrics
  getLyrics: async (trackIdOrLyricsId: string): Promise<Lyrics> => {
    const res = await apiClient.get<Lyrics>(`/lyrics/${trackIdOrLyricsId}`);
    return res.data;
  },

  // Radio
  getRadioStation: async (trackId: string): Promise<RadioStation> => {
    const res = await apiClient.get<RadioStation>(`/radio/${trackId}`);
    return res.data;
  },

  // Charts
  getCharts: async (country: string = 'US'): Promise<any> => {
    const res = await apiClient.get('/charts', { params: { country } });
    return res.data;
  },

  // Explore
  getExplore: async (): Promise<any> => {
    const res = await apiClient.get('/explore');
    return res.data;
  },

  // Library & Likes
  getLibrary: async (): Promise<any> => {
    const res = await apiClient.get('/library');
    return res.data;
  },

  getLibraryPlaylists: async (): Promise<PlaylistRecord[]> => {
    const res = await apiClient.get<PlaylistRecord[]>('/library/playlists');
    return res.data;
  },

  getLikes: async (): Promise<Track[]> => {
    const res = await apiClient.get<Track[]>('/likes');
    return res.data;
  },

  checkLike: async (trackId: string): Promise<boolean> => {
    const res = await apiClient.get<{ liked: boolean }>(`/likes/${trackId}`);
    return res.data.liked;
  },

  likeTrack: async (track: Track): Promise<void> => {
    await apiClient.post(`/likes/${track.id || track.provider_id}`, { track });
  },

  unlikeTrack: async (trackId: string): Promise<void> => {
    await apiClient.delete(`/likes/${trackId}`);
  },

  // History
  getHistory: async (): Promise<Track[]> => {
    const res = await apiClient.get<Track[]>('/history');
    return res.data;
  },

  recordHistory: async (track: Track, durationSeconds: number = 0): Promise<void> => {
    try {
      await apiClient.post('/history', {
        track_id: track.id || track.provider_id,
        track,
        duration_seconds: durationSeconds
      });
    } catch {
      // Non-blocking
    }
  },

  clearHistory: async (): Promise<void> => {
    await apiClient.delete('/history');
  },

  // User & Auth
  loginWithGoogle: async (email: string, name?: string, avatar?: string): Promise<{ token: string; user: User }> => {
    const res = await apiClient.post<{ token: string; user: User }>('/auth/google', {
      email,
      name,
      avatar
    });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  }
};
