import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musicApi } from '../services/api';
import { TrackRow } from '../components/common/TrackRow';
import { MediaCard } from '../components/common/MediaCard';
import { Skeleton } from '../components/common/Skeleton';
import { useUIStore } from '../stores/uiStore';
import { useAudioEngine } from '../features/player/useAudioEngine';
import { useQueueStore } from '../stores/queueStore';
import {
  Heart,
  Clock,
  Plus,
  Play,
  Trash2,
  ListMusic,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const LibraryPage: React.FC = () => {
  const location = useLocation();
  const initialTab = location.pathname.includes('liked')
    ? 'liked'
    : location.pathname.includes('history')
    ? 'history'
    : 'playlists';

  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'history'>(initialTab);
  const { setCreatePlaylistModalOpen, addToast } = useUIStore();
  const { play } = useAudioEngine();
  const { setQueue } = useQueueStore();
  const queryClient = useQueryClient();

  // Queries
  const { data: playlists = [], isLoading: isPlaylistsLoading } = useQuery({
    queryKey: ['library-playlists'],
    queryFn: musicApi.getLibraryPlaylists,
  });

  const { data: likedSongs = [], isLoading: isLikesLoading } = useQuery({
    queryKey: ['liked-songs'],
    queryFn: musicApi.getLikes,
  });

  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['play-history'],
    queryFn: musicApi.getHistory,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: musicApi.clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['play-history'] });
      addToast('Playback history cleared', 'info');
    },
  });

  const handlePlayLikedAll = () => {
    if (likedSongs.length > 0) {
      setQueue(likedSongs, 0);
      play(likedSongs[0]);
    }
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Header & Tabs */}
      <div style={{ padding: '24px 32px 16px 32px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px' }}>Your Library</h1>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setActiveTab('playlists')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: activeTab === 'playlists' ? 'var(--text-primary)' : 'var(--bg-hover)',
              color: activeTab === 'playlists' ? '#000000' : 'var(--text-primary)',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all var(--transition-fast)',
            }}
          >
            <ListMusic size={15} />
            <span>Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('liked')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: activeTab === 'liked' ? 'var(--text-primary)' : 'var(--bg-hover)',
              color: activeTab === 'liked' ? '#000000' : 'var(--text-primary)',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all var(--transition-fast)',
            }}
          >
            <Heart size={15} />
            <span>Favorites ({likedSongs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: activeTab === 'history' ? 'var(--text-primary)' : 'var(--bg-hover)',
              color: activeTab === 'history' ? '#000000' : 'var(--text-primary)',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all var(--transition-fast)',
            }}
          >
            <Clock size={15} />
            <span>History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Tab: Playlists */}
      {activeTab === 'playlists' && (
        <section className="section-container">
          <div className="section-header">
            <h2 className="section-title">Playlists</h2>
            <button className="btn-primary" onClick={() => setCreatePlaylistModalOpen(true)}>
              <Plus size={16} />
              <span>New Playlist</span>
            </button>
          </div>

          {isPlaylistsLoading ? (
            <div className="cards-grid">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} width="100%" height={160} borderRadius={10} />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
              <ListMusic size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>No playlists yet</h3>
              <p style={{ fontSize: 13, margin: '6px 0 20px 0' }}>Create custom playlists and organize your favorite songs.</p>
              <button className="btn-primary" onClick={() => setCreatePlaylistModalOpen(true)}>
                <Plus size={16} />
                <span>Create Playlist</span>
              </button>
            </div>
          ) : (
            <div className="cards-grid">
              {playlists.map((pl) => (
                <MediaCard
                  key={pl.id}
                  id={pl.id}
                  title={pl.title}
                  subtitle={`${pl.tracks?.length || 0} songs`}
                  artwork={pl.artwork}
                  type="playlist"
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab: Liked Songs */}
      {activeTab === 'liked' && (
        <section className="section-container">
          <div className="section-header">
            <h2 className="section-title">Liked Songs</h2>
            {likedSongs.length > 0 && (
              <button className="btn-primary" onClick={handlePlayLikedAll}>
                <Play size={16} fill="#ffffff" />
                <span>Play All</span>
              </button>
            )}
          </div>

          {isLikesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} width="100%" height={48} borderRadius={8} />
              ))}
            </div>
          ) : likedSongs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
              <Heart size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>No favorites yet</h3>
              <p style={{ fontSize: 13, marginTop: 6 }}>Click the heart icon on any song to add it to your favorites.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {likedSongs.map((track, idx) => (
                <TrackRow key={`${track.id || track.provider_id}_${idx}`} track={{ ...track, liked: true }} index={idx} contextTracks={likedSongs} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <section className="section-container">
          <div className="section-header">
            <h2 className="section-title">Recently Played</h2>
            {history.length > 0 && (
              <button
                className="btn-secondary"
                onClick={() => {
                  if (window.confirm('Clear your listening history?')) {
                    clearHistoryMutation.mutate();
                  }
                }}
              >
                <Trash2 size={16} />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {isHistoryLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} width="100%" height={48} borderRadius={8} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
              <Clock size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>No listening history</h3>
              <p style={{ fontSize: 13, marginTop: 6 }}>Your played songs will show up here as you listen.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {history.map((track, idx) => (
                <TrackRow key={`${track.id || track.provider_id}_${idx}`} track={track} index={idx} contextTracks={history} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
