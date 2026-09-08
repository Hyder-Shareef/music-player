import React, { useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useQueueStore } from '../../stores/queueStore';
import { useAudioEngine } from '../../features/player/useAudioEngine';
import { musicApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  ListPlus,
  ListOrdered,
  PlusCircle,
  Heart,
  User,
  Disc,
  Share2,
} from 'lucide-react';

export const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu, openAddToPlaylistModal, addToast } = useUIStore();
  const { playNext, addToQueue } = useQueueStore();
  const { play } = useAudioEngine();
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen || !contextMenu.track) return null;

  const track = contextMenu.track;

  const handlePlay = () => {
    play(track);
    closeContextMenu();
  };

  const handlePlayNext = () => {
    playNext(track);
    addToast(`"${track.title}" will play next`, 'info');
    closeContextMenu();
  };

  const handleAddToQueue = () => {
    addToQueue(track);
    addToast(`Added "${track.title}" to queue`, 'info');
    closeContextMenu();
  };

  const handleAddToPlaylist = () => {
    openAddToPlaylistModal(track);
    closeContextMenu();
  };

  const handleLike = async () => {
    try {
      await musicApi.likeTrack(track);
      addToast(`Added "${track.title}" to Favorites`, 'success');
    } catch {
      addToast('Failed to favorite track', 'error');
    }
    closeContextMenu();
  };

  const handleGoToArtist = () => {
    const artistId = track.artists?.[0]?.id;
    if (artistId) {
      navigate(`/artist/${artistId}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(track.artists?.[0]?.name || '')}`);
    }
    closeContextMenu();
  };

  const handleGoToAlbum = () => {
    const albumId = track.album?.id;
    if (albumId) {
      navigate(`/album/${albumId}`);
    }
    closeContextMenu();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/search?q=${encodeURIComponent(track.title)}`;
    navigator.clipboard.writeText(url);
    addToast('Link copied to clipboard', 'info');
    closeContextMenu();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        zIndex: 200,
        width: 220,
        backgroundColor: '#1c1c1e',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        padding: '6px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.artists.map((a) => a.name).join(', ')}
        </div>
      </div>

      <MenuItem icon={<Play size={14} />} label="Play" onClick={handlePlay} />
      <MenuItem icon={<ListOrdered size={14} />} label="Play Next" onClick={handlePlayNext} />
      <MenuItem icon={<ListPlus size={14} />} label="Add to Queue" onClick={handleAddToQueue} />
      <MenuItem icon={<PlusCircle size={14} />} label="Add to Playlist..." onClick={handleAddToPlaylist} />
      <MenuItem icon={<Heart size={14} />} label="Favorite" onClick={handleLike} />
      
      <div style={{ height: 1, backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

      <MenuItem icon={<User size={14} />} label="Go to Artist" onClick={handleGoToArtist} />
      {track.album?.id && <MenuItem icon={<Disc size={14} />} label="Go to Album" onClick={handleGoToAlbum} />}
      <MenuItem icon={<Share2 size={14} />} label="Copy Share Link" onClick={handleShare} />
    </div>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background-color 0.15s ease',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>{icon}</span>
    <span>{label}</span>
  </button>
);
