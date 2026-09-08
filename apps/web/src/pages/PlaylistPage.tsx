import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musicApi } from '../services/api';
import { TrackRow } from '../components/common/TrackRow';
import { Skeleton } from '../components/common/Skeleton';
import { ArtworkImage } from '../components/common/ArtworkImage';
import { useAudioEngine } from '../features/player/useAudioEngine';
import { useQueueStore } from '../stores/queueStore';
import { useUIStore } from '../stores/uiStore';
import { Play, Shuffle, Trash2, Edit3, ListMusic, X, Check } from 'lucide-react';

export const PlaylistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { play } = useAudioEngine();
  const { setQueue } = useQueueStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const { data: playlist, isLoading, error } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => (id ? musicApi.getPlaylist(id) : null),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => (id ? musicApi.deletePlaylist(id) : Promise.reject()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-playlists'] });
      addToast('Playlist deleted', 'info');
      navigate('/library');
    },
    onError: () => addToast('Failed to delete playlist', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: () => (id ? musicApi.updatePlaylist(id, editTitle, editDesc) : Promise.reject()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
      queryClient.invalidateQueries({ queryKey: ['library-playlists'] });
      addToast('Playlist updated', 'success');
      setIsEditing(false);
    },
    onError: () => addToast('Failed to update playlist', 'error'),
  });

  if (isLoading) {
    return (
      <div className="section-container" style={{ display: 'flex', gap: 32, padding: '40px 32px' }}>
        <Skeleton width={220} height={220} borderRadius={16} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton width={120} height={16} />
          <Skeleton width={320} height={36} />
          <Skeleton width={180} height={20} />
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="section-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <ListMusic size={48} color="var(--accent)" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Playlist Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          The requested playlist could not be loaded.
        </p>
      </div>
    );
  }

  const tracks = playlist.tracks || [];

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setQueue(tracks, 0);
      play(tracks[0]);
    }
  };

  const handleShuffleAll = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      setQueue(shuffled, 0);
      play(shuffled[0]);
    }
  };

  const handleStartEdit = () => {
    setEditTitle(playlist.title);
    setEditDesc(playlist.description || '');
    setIsEditing(true);
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Playlist Hero */}
      <div
        style={{
          padding: '40px 32px 32px 32px',
          background: 'linear-gradient(180deg, rgba(30, 30, 35, 0.7) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ width: 220, height: 220, borderRadius: 'var(--radius-lg)', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-lg)' }}>
          <ArtworkImage src={playlist.artwork} alt={playlist.title} size={220} />
        </div>

        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: 0.8 }}>
            PLAYLIST
          </span>

          {isEditing ? (
            <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 460 }}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn-primary" onClick={() => updateMutation.mutate()} style={{ padding: '6px 14px', fontSize: 12 }}>
                  <Check size={14} /> Save
                </button>
                <button className="btn-secondary" onClick={() => setIsEditing(false)} style={{ padding: '6px 14px', fontSize: 12 }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.8px', margin: '4px 0 8px 0' }}>
                {playlist.title}
              </h1>
              {playlist.description && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, maxWidth: 600 }}>
                  {playlist.description}
                </p>
              )}
            </>
          )}

          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {playlist.author && <span>By {playlist.author}</span>}
            <span>• {tracks.length} songs</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-primary" onClick={handlePlayAll} disabled={tracks.length === 0}>
              <Play size={18} fill="#ffffff" />
              <span>Play</span>
            </button>

            <button className="btn-secondary" onClick={handleShuffleAll} disabled={tracks.length === 0}>
              <Shuffle size={18} />
              <span>Shuffle</span>
            </button>

            {playlist.is_editable && (
              <>
                <button className="btn-icon" onClick={handleStartEdit} title="Edit Playlist Info">
                  <Edit3 size={18} />
                </button>

                <button
                  className="btn-icon"
                  onClick={() => {
                    if (window.confirm('Delete this playlist?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  title="Delete Playlist"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <section className="section-container">
        {tracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
            <ListMusic size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p style={{ fontSize: 16, fontWeight: 600 }}>No songs in this playlist</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Find songs and click &quot;... &gt; Add to Playlist&quot; to populate it.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tracks.map((track, idx) => (
              <TrackRow
                key={`${track.id || track.provider_id}_${idx}`}
                track={track}
                index={idx}
                contextTracks={tracks}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
