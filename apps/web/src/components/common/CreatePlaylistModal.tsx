import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { musicApi } from '../../services/api';
import { X, FolderPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreatePlaylistModal: React.FC = () => {
  const { isCreatePlaylistModalOpen, setCreatePlaylistModalOpen, addToast } = useUIStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isCreatePlaylistModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const pl = await musicApi.createPlaylist(title.trim(), description.trim());
      addToast(`Created playlist "${pl.title}"`, 'success');
      setTitle('');
      setDescription('');
      setCreatePlaylistModalOpen(false);
      navigate(`/playlist/${pl.id}`);
    } catch {
      addToast('Failed to create playlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setCreatePlaylistModalOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderPlus size={22} color="var(--accent)" />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>New Playlist</h3>
          </div>
          <button className="btn-icon" onClick={() => setCreatePlaylistModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              TITLE
            </label>
            <input
              type="text"
              autoFocus
              placeholder="My Playlist"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              DESCRIPTION (OPTIONAL)
            </label>
            <textarea
              placeholder="Give your playlist a vibe or description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: 14,
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCreatePlaylistModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!title.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
