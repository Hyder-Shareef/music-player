import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { musicApi } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Music } from 'lucide-react';
import { ArtworkImage } from './ArtworkImage';

export const AddToPlaylistModal: React.FC = () => {
  const {
    isAddToPlaylistModalOpen,
    closeAddToPlaylistModal,
    selectedTrackForPlaylist,
    setCreatePlaylistModalOpen,
    addToast,
  } = useUIStore();

  const queryClient = useQueryClient();

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['library-playlists'],
    queryFn: musicApi.getLibraryPlaylists,
    enabled: isAddToPlaylistModalOpen,
  });

  const addMutation = useMutation({
    mutationFn: ({ playlistId }: { playlistId: string }) => {
      if (!selectedTrackForPlaylist) throw new Error('No track selected');
      return musicApi.addTrackToPlaylist(playlistId, selectedTrackForPlaylist);
    },
    onSuccess: (updatedPlaylist) => {
      queryClient.invalidateQueries({ queryKey: ['library-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', updatedPlaylist.id] });
      addToast(`Added to "${updatedPlaylist.title}"`, 'success');
      closeAddToPlaylistModal();
    },
    onError: () => {
      addToast('Failed to add track to playlist', 'error');
    },
  });

  if (!isAddToPlaylistModalOpen || !selectedTrackForPlaylist) return null;

  return (
    <div className="modal-overlay" onClick={closeAddToPlaylistModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Add to Playlist</h3>
          <button className="btn-icon" onClick={closeAddToPlaylistModal}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Track Preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 20,
          }}
        >
          <ArtworkImage src={selectedTrackForPlaylist.artwork} size={40} className="rounded" />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedTrackForPlaylist.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedTrackForPlaylist.artists.map((a) => a.name).join(', ')}
            </div>
          </div>
        </div>

        {/* Create New Playlist option */}
        <button
          onClick={() => {
            closeAddToPlaylistModal();
            setCreatePlaylistModalOpen(true);
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            backgroundColor: 'var(--bg-hover)',
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          <Plus size={18} />
          <span>New Playlist...</span>
        </button>

        {/* Playlist list */}
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Loading playlists...
            </div>
          ) : playlists.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No custom playlists created yet.
            </div>
          ) : (
            playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => addMutation.mutate({ playlistId: pl.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    backgroundColor: '#27272a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {pl.artwork ? (
                    <img src={pl.artwork} alt={pl.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Music size={16} color="rgba(255,255,255,0.4)" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pl.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {pl.tracks?.length || 0} songs
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
