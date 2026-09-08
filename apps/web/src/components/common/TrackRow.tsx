import React, { useState } from 'react';
import { Track } from '../../types/music';
import { usePlayerStore } from '../../stores/playerStore';
import { useQueueStore } from '../../stores/queueStore';
import { useUIStore } from '../../stores/uiStore';
import { useAudioEngine } from '../../features/player/useAudioEngine';
import { ArtworkImage } from './ArtworkImage';
import { Play, Heart, MoreHorizontal, PlusCircle } from 'lucide-react';
import { musicApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface TrackRowProps {
  track: Track;
  index?: number;
  contextTracks?: Track[];
  showArtwork?: boolean;
  showAlbum?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  contextTracks,
  showArtwork = true,
  showAlbum = true,
}) => {
  const { currentTrack, isPlaying } = usePlayerStore();
  const { play, togglePlay } = useAudioEngine();
  const { openContextMenu, addToast } = useUIStore();
  const { playNext } = useQueueStore();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState<boolean>(Boolean(track.liked));
  const isCurrent = (currentTrack?.id || currentTrack?.provider_id) === (track.id || track.provider_id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      play(track, contextTracks);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isLiked;
    setIsLiked(next);
    try {
      if (next) {
        await musicApi.likeTrack(track);
        addToast(`Added "${track.title}" to Favorites`, 'success');
      } else {
        await musicApi.unlikeTrack(track.id || track.provider_id);
        addToast(`Removed "${track.title}" from Favorites`, 'info');
      }
    } catch {
      setIsLiked(!next);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, track);
  };

  const handleArtistClick = (e: React.MouseEvent, artistId?: string | null) => {
    e.stopPropagation();
    if (artistId) {
      navigate(`/artist/${artistId}`);
    }
  };

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNext(track);
    addToast(`"${track.title}" will play next`, 'info');
  };

  return (
    <div
      className={`track-row ${isCurrent ? 'active' : ''}`}
      onClick={handleRowClick}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, track);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 14,
        background: isCurrent ? 'rgba(250, 35, 59, 0.12)' : 'transparent',
        border: isCurrent ? '1px solid rgba(250, 35, 59, 0.25)' : '1px solid transparent',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
    >
      {/* Index / Live Volt Equalizer Bars */}
      <div className="track-index" style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isCurrent && isPlaying ? (
          <div className="volt-equalizer-bars" title="Playing">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : isCurrent ? (
          <div style={{ color: 'var(--vision-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={13} fill="currentColor" />
          </div>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--vision-text-tertiary)', fontWeight: 600 }}>
            {index !== undefined ? index + 1 : ''}
          </span>
        )}
      </div>

      {/* Artwork */}
      {showArtwork && (
        <div style={{ position: 'relative', width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <ArtworkImage src={track.artwork} alt={track.title} className="track-art" size={42} />
        </div>
      )}

      {/* Title & Artist */}
      <div className="track-info" style={{ flex: 1, minWidth: 0 }}>
        <div
          className="track-title"
          title={track.title}
          style={{
            fontSize: 14,
            fontWeight: isCurrent ? 700 : 600,
            color: isCurrent ? 'var(--vision-accent)' : '#ffffff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {track.title}
          {track.explicit && (
            <span
              style={{
                fontSize: 9,
                padding: '1px 4px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 3,
                marginLeft: 6,
                fontWeight: 700,
                verticalAlign: 'middle',
              }}
            >
              E
            </span>
          )}
        </div>
        <div
          className="track-artists"
          style={{
            fontSize: 12,
            color: 'var(--vision-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 2,
          }}
        >
          {track.artists.map((artist, idx) => (
            <span key={idx}>
              <span
                style={{ cursor: artist.id ? 'pointer' : 'default' }}
                onClick={(e) => handleArtistClick(e, artist.id)}
                className="artist-link"
              >
                {artist.name}
              </span>
              {idx < track.artists.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Album name */}
      {showAlbum && track.album && (
        <div
          className="track-album-col"
          style={{
            flex: 0.8,
            fontSize: 13,
            color: 'var(--vision-text-tertiary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span
            style={{ cursor: track.album.id ? 'pointer' : 'default' }}
            onClick={(e) => {
              e.stopPropagation();
              if (track.album?.id) navigate(`/album/${track.album.id}`);
            }}
          >
            {track.album.title}
          </span>
        </div>
      )}

      {/* Quick Play Next Button on hover */}
      <button
        className="btn-icon magnetic-button"
        style={{ width: 30, height: 30, color: 'var(--vision-text-tertiary)' }}
        onClick={handlePlayNext}
        title="Play Next"
      >
        <PlusCircle size={15} />
      </button>

      {/* Like Button */}
      <button
        className="btn-icon magnetic-button"
        style={{ width: 30, height: 30, color: isLiked ? 'var(--vision-accent)' : 'var(--vision-text-tertiary)' }}
        onClick={handleLikeToggle}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
      </button>

      {/* Duration */}
      <div
        className="track-duration"
        style={{
          fontSize: 12,
          color: 'var(--vision-text-tertiary)',
          minWidth: 38,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {track.duration || '3:30'}
      </div>

      {/* More actions */}
      <button
        className="btn-icon magnetic-button"
        style={{ width: 30, height: 30, color: 'var(--vision-text-tertiary)' }}
        onClick={handleMenuClick}
        title="More Actions"
      >
        <MoreHorizontal size={15} />
      </button>
    </div>
  );
};
