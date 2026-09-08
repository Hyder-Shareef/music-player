import React, { useState } from 'react';
import { useAudioEngine } from '../player/useAudioEngine';
import { usePlayerStore } from '../../stores/playerStore';
import { useUIStore } from '../../stores/uiStore';
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
  Loader2,
  Headphones,
  Sliders,
} from 'lucide-react';

export const VisionPlayerPill: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isSpatialAudio,
    toggleSpatialAudio,
    cycleRepeatMode,
    handleToggleShuffle,
    togglePlay,
    handleNext,
    handlePrevious,
    seek,
    changeVolume,
    toggleFullPlayer,
    toggleLyrics,
    toggleQueue,
    isLyricsOpen,
    isQueueOpen,
  } = useAudioEngine();

  const { isLoading, isBuffering } = usePlayerStore();
  const { isEqualizerOpen, toggleEqualizer } = useUIStore();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

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

  const handleSliderMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * (duration || 100));
  };

  return (
    <div className="vision-player-pill" role="region" aria-label="Spatial Media Player">
      {/* 1. Playback & Order Controls (Shuffle, Prev, Play, Next, Repeat) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Shuffle Button */}
        <button
          className={`vision-pill-btn magnetic-button ${isShuffled ? 'active' : ''}`}
          onClick={handleToggleShuffle}
          title={isShuffled ? 'Shuffle: Enabled' : 'Shuffle: Disabled'}
          style={{ width: 32, height: 32, minWidth: 32, flexShrink: 0, color: isShuffled ? 'var(--vision-accent)' : 'inherit' }}
        >
          <Shuffle size={13} />
        </button>

        {/* Previous */}
        <button
          className="vision-pill-btn magnetic-button"
          onClick={handlePrevious}
          title="Previous Track"
          style={{ width: 32, height: 32, minWidth: 32, flexShrink: 0 }}
        >
          <SkipBack size={15} fill="currentColor" />
        </button>

        {/* Play/Pause */}
        <button
          className="vision-pill-btn magnetic-button"
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            minHeight: 36,
            flexShrink: 0,
            background: '#ffffff',
            color: '#000000',
            boxShadow: '0 4px 16px rgba(255, 255, 255, 0.3)',
          }}
        >
          {isLoading || isBuffering ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />
          )}
        </button>

        {/* Next */}
        <button
          className="vision-pill-btn magnetic-button"
          onClick={handleNext}
          title="Next Track"
          style={{ width: 32, height: 32, minWidth: 32, flexShrink: 0 }}
        >
          <SkipForward size={15} fill="currentColor" />
        </button>

        {/* Repeat Mode */}
        <button
          className={`vision-pill-btn magnetic-button ${repeatMode !== 'off' ? 'active' : ''}`}
          onClick={cycleRepeatMode}
          title={`Repeat: ${repeatMode}`}
          style={{ width: 32, height: 32, minWidth: 32, flexShrink: 0, color: repeatMode !== 'off' ? 'var(--vision-accent)' : 'inherit' }}
        >
          {repeatMode === 'one' ? <Repeat1 size={13} /> : <Repeat size={13} />}
        </button>
      </div>

      {/* 2. Track Artwork & Info (Opens Fullscreen Player) */}
      <div
        onClick={toggleFullPlayer}
        className="magnetic-button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255, 255, 255, 0.06)',
          padding: '3px 12px 3px 3px',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          width: 220,
          maxWidth: 220,
          minWidth: 180,
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
        title="Open Fullscreen Player"
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
            animation: isPlaying ? 'spin 18s linear infinite' : 'none',
          }}
        >
          <ArtworkImage src={currentTrack.artwork} size={34} />
        </div>

        <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentTrack.title}
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--vision-text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentTrack.artists?.map((a) => a.name).join(', ')}
          </div>
        </div>
      </div>

      {/* 3. Sleek Scrubber Pill with Hover Tooltip */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '4px 12px',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          width: 170,
          flexShrink: 0,
        }}
      >
        {hoverTime !== null && (
          <div
            style={{
              position: 'absolute',
              top: -26,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--vision-glass-thick)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              padding: '2px 6px',
              fontSize: 10,
              fontWeight: 700,
              color: '#ffffff',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        <span style={{ fontSize: 10, color: 'var(--vision-text-tertiary)', minWidth: 24, fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeekChange}
          onMouseMove={handleSliderMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          className="audio-slider glass-slider"
          style={{ height: 4, flex: 1 }}
        />

        <span style={{ fontSize: 10, color: 'var(--vision-text-tertiary)', minWidth: 24, fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* 4. Action Controls: 3D Spatial Audio, Lyrics, Queue, Equalizer, Volume, Fullscreen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', flexShrink: 0 }}>
        {/* 3D Spatial Audio Toggle */}
        <button
          className={`vision-pill-btn magnetic-button ${isSpatialAudio ? 'active' : ''}`}
          onClick={toggleSpatialAudio}
          title={isSpatialAudio ? '3D Spatial Audio: ON' : 'Spatial Audio: OFF'}
          style={{
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            flexShrink: 0,
            color: isSpatialAudio ? 'var(--vision-accent)' : 'inherit',
          }}
        >
          <Headphones size={14} />
        </button>

        {/* Lyrics */}
        <button
          className={`vision-pill-btn magnetic-button ${isLyricsOpen ? 'active' : ''}`}
          onClick={toggleLyrics}
          title="Synced Lyrics (L)"
          style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, flexShrink: 0 }}
        >
          <Mic2 size={14} />
        </button>

        {/* Queue */}
        <button
          className={`vision-pill-btn magnetic-button ${isQueueOpen ? 'active' : ''}`}
          onClick={toggleQueue}
          title="Play Queue (Q)"
          style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, flexShrink: 0 }}
        >
          <ListMusic size={14} />
        </button>

        {/* 10-Band Graphic Equalizer */}
        <button
          className={`vision-pill-btn magnetic-button ${isEqualizerOpen ? 'active' : ''}`}
          onClick={toggleEqualizer}
          title="10-Band Equalizer & Visualizer (E)"
          style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, flexShrink: 0, color: isEqualizerOpen ? 'var(--vision-accent)' : 'inherit' }}
        >
          <Sliders size={14} />
        </button>

        {/* Volume Popover Toggle */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            className="vision-pill-btn magnetic-button"
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            title="Volume (M to Mute)"
            style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, flexShrink: 0 }}
          >
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {showVolumeSlider && (
            <div
              style={{
                position: 'absolute',
                bottom: 44,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--vision-glass-thick)',
                backdropFilter: 'var(--vision-blur-deep)',
                WebkitBackdropFilter: 'var(--vision-blur-deep)',
                border: 'var(--vision-specular-border)',
                borderRadius: '16px',
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                boxShadow: 'var(--vision-spatial-shadow)',
                zIndex: 60,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--vision-text-secondary)' }}>
                {Math.round(volume * 100)}%
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                style={{
                  writingMode: 'bt-lr' as any,
                  WebkitAppearance: 'slider-vertical',
                  width: 8,
                  height: 90,
                  cursor: 'pointer',
                  accentColor: 'var(--vision-accent)',
                }}
              />
            </div>
          )}
        </div>

        {/* Fullscreen Expand */}
        <button
          className="vision-pill-btn magnetic-button"
          onClick={toggleFullPlayer}
          title="Fullscreen Now Playing (F)"
          style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, flexShrink: 0 }}
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
};
