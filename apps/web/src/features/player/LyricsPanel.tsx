import React from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../../services/api';
import { X, Mic2, Loader2 } from 'lucide-react';
import { SyncedLyricsView } from './SyncedLyricsView';

export const LyricsPanel: React.FC = () => {
  const { isLyricsOpen, toggleLyrics, currentTrack } = usePlayerStore();

  const trackId = currentTrack?.id || currentTrack?.provider_id;
  const { data, isLoading } = useQuery({
    queryKey: ['lyrics', trackId],
    queryFn: () => (trackId ? musicApi.getLyrics(trackId) : null),
    enabled: isLyricsOpen && !!trackId,
  });

  if (!isLyricsOpen || !currentTrack) return null;

  return (
    <div
      className="drawer"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 440,
        maxWidth: '100vw',
        background: 'var(--vision-glass-thick)',
        backdropFilter: 'var(--vision-blur-deep)',
        WebkitBackdropFilter: 'var(--vision-blur-deep)',
        borderLeft: 'var(--vision-specular-border)',
        zIndex: 85,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--vision-spatial-shadow)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mic2 size={18} color="var(--vision-accent)" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Live Synced Lyrics</h3>
        </div>

        <button className="vision-pill-btn" onClick={toggleLyrics} style={{ width: 32, height: 32 }}>
          <X size={16} />
        </button>
      </div>

      {/* Lyrics Body */}
      <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: 'var(--vision-text-secondary)' }}>
            <Loader2 size={26} className="animate-spin" />
          </div>
        ) : (
          <SyncedLyricsView rawLyrics={data?.lyrics} isCompact />
        )}
      </div>
    </div>
  );
};
