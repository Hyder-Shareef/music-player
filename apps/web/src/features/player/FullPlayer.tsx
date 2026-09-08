import React, { useState } from 'react';
import { useAudioEngine } from './useAudioEngine';
import { ArtworkImage } from '../../components/common/ArtworkImage';
import { usePlayerStore } from '../../stores/playerStore';
import { useUIStore } from '../../stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../../services/api';
import { TiltCard } from '../../components/common/TiltCard';
import {
  ChevronDown,
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
  PlusCircle,
  Share2,
  Loader2,
  Headphones,
  Sliders,
  Disc,
} from 'lucide-react';
import { TrackRow } from '../../components/common/TrackRow';
import { SyncedLyricsView } from './SyncedLyricsView';

export const FullPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    queue,
    isFullPlayerOpen,
    isSpatialAudio,
    accentColor,
    toggleSpatialAudio,
    togglePlay,
    handleNext,
    handlePrevious,
    seek,
    changeVolume,
    cycleRepeatMode,
    handleToggleShuffle,
    toggleFullPlayer,
  } = useAudioEngine();

  const { isLoading } = usePlayerStore();
  const { openAddToPlaylistModal, addToast, toggleEqualizer } = useUIStore();
  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'queue'>('cover');

  // Fetch Lyrics for full player
  const trackId = currentTrack?.id || currentTrack?.provider_id;
  const { data: lyricsData, isLoading: isLyricsLoading } = useQuery({
    queryKey: ['lyrics', trackId],
    queryFn: () => (trackId ? musicApi.getLyrics(trackId) : null),
    enabled: isFullPlayerOpen && !!trackId,
  });

  if (!isFullPlayerOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Track link copied', 'info');
  };

  return (
    <div className="fullscreen-player">
      {/* Blurred dynamic artwork backdrop */}
      {currentTrack.artwork && (
        <div
          className="fullscreen-backdrop"
          style={{ backgroundImage: `url(${currentTrack.artwork})` }}
        />
      )}

      {/* Main Fullscreen UI */}
      <div className="fullscreen-content">
        {/* Top Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
          <button
            className="btn-icon"
            onClick={toggleFullPlayer}
            style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.1)' }}
            title="Minimize"
          >
            <ChevronDown size={24} color="#ffffff" />
          </button>

          {/* Center Tabs: Cover / Lyrics / Queue */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-full)',
              padding: 3,
              backdropFilter: 'blur(20px)',
            }}
          >
            <button
              onClick={() => setActiveTab('cover')}
              style={{
                background: activeTab === 'cover' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Disc size={14} />
              <span>Cover</span>
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              style={{
                background: activeTab === 'lyrics' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Mic2 size={14} />
              <span>Lyrics</span>
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              style={{
                background: activeTab === 'queue' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ListMusic size={14} />
              <span>Queue</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Equalizer Button */}
            <button
              onClick={toggleEqualizer}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '9999px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--vision-text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Open 10-Band Equalizer"
            >
              <Sliders size={14} color="currentColor" />
              <span>Equalizer</span>
            </button>

            {/* 3D Spatial Concert Audio Toggle */}
            <button
              onClick={toggleSpatialAudio}
              style={{
                background: isSpatialAudio ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.08)',
                border: isSpatialAudio ? '1px solid var(--vision-accent)' : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '9999px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: isSpatialAudio ? '#ffffff' : 'var(--vision-text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: 120,
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Toggle 3D Concert Hall Spatial Sound"
            >
              <Headphones size={14} color={isSpatialAudio ? 'var(--vision-accent)' : 'currentColor'} />
              <span>Spatial Audio</span>
            </button>

            <button
              className="btn-icon"
              onClick={handleShare}
              style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.1)' }}
              title="Share"
            >
              <Share2 size={20} color="#ffffff" />
            </button>
          </div>
        </div>

        {/* Center Dynamic Body View */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '16px 0', position: 'relative' }}>
          {activeTab === 'cover' && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              {/* Dynamic ambient backlight aura */}
              <div
                style={{
                  position: 'absolute',
                  width: 'min(380px, 80vw)',
                  height: 'min(380px, 80vw)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${accentColor}88 0%, ${accentColor}11 70%, transparent 100%)`,
                  filter: 'blur(50px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                  transform: isPlaying ? 'scale(1.15)' : 'scale(0.95)',
                  transition: 'transform 0.6s ease',
                  opacity: 0.75,
                }}
              />

              {/* 3D Tilt Album Artwork Card */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  maxWidth: 380,
                  width: '100%',
                  aspectRatio: '1 / 1',
                  transform: isPlaying ? 'scale(1)' : 'scale(0.94)',
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <TiltCard maxTilt={10} scale={1.02} className="w-full h-full">
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 24,
                      overflow: 'hidden',
                      boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: '#18181b',
                    }}
                  >
                    <ArtworkImage
                      src={currentTrack.artwork}
                      alt={currentTrack.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </TiltCard>
              </div>
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div style={{ width: '100%', height: '100%', maxWidth: 680, overflow: 'hidden' }}>
              {isLyricsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--vision-text-secondary)' }}>
                  <Loader2 size={32} className="animate-spin" />
                </div>
              ) : (
                <SyncedLyricsView rawLyrics={lyricsData?.lyrics} />
              )}
            </div>
          )}

          {activeTab === 'queue' && (
            <div
              style={{
                maxWidth: 680,
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                backgroundColor: 'rgba(20, 20, 22, 0.6)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase' }}>
                Up Next ({queue.length} tracks)
              </div>
              {queue.map((t, idx) => (
                <TrackRow key={`${t.id || t.provider_id}_${idx}`} track={t} index={idx} contextTracks={queue} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Playback Engine & Controls Container */}
        <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Metadata Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.title}
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.artists.map((a) => a.name).join(', ')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn-icon"
                onClick={() => openAddToPlaylistModal(currentTrack)}
                style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' }}
                title="Add to Playlist"
              >
                <PlusCircle size={20} color="#ffffff" />
              </button>
            </div>
          </div>

          {/* Scrubber */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="audio-slider"
              style={{ height: 6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Big Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '6px 0' }}>
            <button
              className={`btn-icon ${isShuffled ? 'active' : ''}`}
              onClick={handleToggleShuffle}
              style={{ width: 44, height: 44 }}
              title="Shuffle"
            >
              <Shuffle size={20} />
            </button>

            <button
              className="btn-icon"
              onClick={handlePrevious}
              style={{ width: 52, height: 52 }}
              title="Previous Track"
            >
              <SkipBack size={26} fill="currentColor" />
            </button>

            <button
              onClick={togglePlay}
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: 'none',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isLoading ? (
                <Loader2 size={32} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" style={{ marginLeft: 4 }} />
              )}
            </button>

            <button
              className="btn-icon"
              onClick={handleNext}
              style={{ width: 52, height: 52 }}
              title="Next Track"
            >
              <SkipForward size={26} fill="currentColor" />
            </button>

            <button
              className={`btn-icon ${repeatMode !== 'off' ? 'active' : ''}`}
              onClick={cycleRepeatMode}
              style={{ width: 44, height: 44 }}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
          </div>

          {/* Volume Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, maxWidth: 360, width: '100%', margin: '0 auto' }}>
            <button
              className="btn-icon"
              onClick={() => usePlayerStore.getState().toggleMute()}
              style={{ width: 32, height: 32 }}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="audio-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
