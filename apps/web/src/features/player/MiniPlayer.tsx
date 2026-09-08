import React from 'react';
import { useAudioEngine } from './useAudioEngine';
import { ArtworkImage } from '../../components/common/ArtworkImage';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Mic2,
  ListMusic,
  Maximize2,
  Heart,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { musicApi } from '../../services/api';
import { useUIStore } from '../../stores/uiStore';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    togglePlay,
    handleNext,
    handlePrevious,
    seek,
    changeVolume,
    cycleRepeatMode,
    handleToggleShuffle,
    toggleFullPlayer,
    toggleLyrics,
    toggleQueue,
    isLyricsOpen,
    isQueueOpen,
  } = useAudioEngine();

  const { isLoading, isBuffering } = usePlayerStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeVolume(parseFloat(e.target.value));
  };

  const handleToggleLike = async () => {
    if (!currentTrack) return;
    try {
      if (currentTrack.liked) {
        await musicApi.unlikeTrack(currentTrack.id || currentTrack.provider_id);
        currentTrack.liked = false;
        addToast('Removed from Favorites', 'info');
      } else {
        await musicApi.likeTrack(currentTrack);
        currentTrack.liked = true;
        addToast('Added to Favorites', 'success');
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="global-player">
      {/* Left: Track Artwork & Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flex: '0 1 280px',
          minWidth: 0,
        }}
      >
        <div
          onClick={toggleFullPlayer}
          style={{
            position: 'relative',
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
          }}
          title="Open Fullscreen Player"
        >
          <ArtworkImage src={currentTrack.artwork} size={48} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          >
            <Maximize2 size={16} color="#ffffff" />
          </div>
        </div>

        <div style={{ overflow: 'hidden', minWidth: 0 }}>
          <div
            onClick={toggleFullPlayer}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
            }}
            title={currentTrack.title}
          >
            {currentTrack.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 2,
            }}
          >
            {currentTrack.artists.map((artist, idx) => (
              <span
                key={idx}
                style={{ cursor: artist.id ? 'pointer' : 'default' }}
                onClick={() => artist.id && navigate(`/artist/${artist.id}`)}
              >
                {artist.name}
                {idx < currentTrack.artists.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>

        <button
          className="btn-icon"
          onClick={handleToggleLike}
          style={{ color: currentTrack.liked ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }}
          title="Favorite"
        >
          <Heart size={16} fill={currentTrack.liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Center: Controls & Scrubber */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: '1 1 500px',
          maxWidth: 620,
          padding: '0 16px',
        }}
      >
        {/* Playback action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <button
            className={`btn-icon ${isShuffled ? 'active' : ''}`}
            onClick={handleToggleShuffle}
            title="Shuffle"
            style={{ width: 28, height: 28 }}
          >
            <Shuffle size={15} />
          </button>

          <button
            className="btn-icon"
            onClick={handlePrevious}
            title="Previous (P)"
            style={{ width: 32, height: 32 }}
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            title="Play/Pause (Space)"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: 'none',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isLoading || isBuffering ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>

          <button
            className="btn-icon"
            onClick={handleNext}
            title="Next (N)"
            style={{ width: 32, height: 32 }}
          >
            <SkipForward size={18} fill="currentColor" />
          </button>

          <button
            className={`btn-icon ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={cycleRepeatMode}
            title={`Repeat: ${repeatMode}`}
            style={{ width: 28, height: 28 }}
          >
            {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
          </button>
        </div>

        {/* Progress Bar & Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="audio-slider"
          />

          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', minWidth: 32, fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Lyrics, Queue, Volume */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          flex: '0 1 280px',
        }}
      >
        <button
          className={`btn-icon ${isLyricsOpen ? 'active' : ''}`}
          onClick={toggleLyrics}
          title="Lyrics"
        >
          <Mic2 size={17} />
        </button>

        <button
          className={`btn-icon ${isQueueOpen ? 'active' : ''}`}
          onClick={toggleQueue}
          title="Queue"
        >
          <ListMusic size={18} />
        </button>

        {/* Volume Scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 110 }}>
          <button
            className="btn-icon"
            onClick={() => usePlayerStore.getState().toggleMute()}
            style={{ width: 28, height: 28 }}
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="audio-slider"
          />
        </div>
      </div>
    </div>
  );
};
