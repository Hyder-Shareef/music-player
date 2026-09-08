import React, { useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useQueueStore } from '../../stores/queueStore';
import { ArtworkImage } from '../../components/common/ArtworkImage';
import { useAudioEngine } from './useAudioEngine';
import {
  X,
  Trash2,
  ListMusic,
  History,
  ChevronUp,
  ChevronDown,
  Play,
  Volume2,
} from 'lucide-react';
import { Track } from '../../types/music';

export const QueueDrawer: React.FC = () => {
  const { isQueueOpen, toggleQueue, currentTrack } = usePlayerStore();
  const { queue, history, currentIndex, reorderQueue, removeFromQueue, clearQueue } = useQueueStore();
  const { play } = useAudioEngine();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  if (!isQueueOpen) return null;

  const currentTrackId = currentTrack?.id || currentTrack?.provider_id;

  const handlePlayTrackFromQueue = (track: Track, idx: number) => {
    useQueueStore.getState().setQueue(queue, idx);
    play(track);
  };

  const handlePlayFromHistory = (track: Track) => {
    play(track);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 400,
        maxWidth: '100vw',
        background: 'var(--vision-glass-thick)',
        backdropFilter: 'var(--vision-blur-deep)',
        WebkitBackdropFilter: 'var(--vision-blur-deep)',
        borderLeft: 'var(--vision-specular-border)',
        zIndex: 85,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--vision-spatial-shadow)',
        color: '#ffffff',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ListMusic size={18} color="var(--vision-accent)" />
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Queue &amp; Up Next</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {activeTab === 'queue' && queue.length > 0 && (
            <button
              className="vision-pill-btn"
              onClick={clearQueue}
              title="Clear Queue"
              style={{ width: 30, height: 30 }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            className="vision-pill-btn"
            onClick={toggleQueue}
            style={{ width: 30, height: 30 }}
            title="Close Queue"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs: Up Next vs History */}
      <div style={{ display: 'flex', padding: '10px 16px', gap: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 9999,
            background: activeTab === 'queue' ? 'var(--vision-glass-control)' : 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'queue' ? '#ffffff' : 'var(--vision-text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <ListMusic size={13} />
          <span>Up Next ({queue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 9999,
            background: activeTab === 'history' ? 'var(--vision-glass-control)' : 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'history' ? '#ffffff' : 'var(--vision-text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <History size={13} />
          <span>History ({history.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {activeTab === 'queue' ? (
          queue.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--vision-text-tertiary)' }}>
              <ListMusic size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>Your queue is empty</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Play songs or albums to build your stream.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {queue.map((track, idx) => {
                const trackId = track.id || track.provider_id;
                const isCurrent = trackId === currentTrackId || idx === currentIndex;

                return (
                  <div
                    key={`${trackId}_${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 14,
                      background: isCurrent ? 'rgba(250, 35, 59, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                      border: isCurrent ? '1px solid rgba(250, 35, 59, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Left: Artwork & Info */}
                    <div
                      onClick={() => handlePlayTrackFromQueue(track, idx)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden', cursor: 'pointer' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <ArtworkImage src={track.artwork} size={36} />
                        {isCurrent && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.45)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Volume2 size={14} color="#fa233b" />
                          </div>
                        )}
                      </div>

                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: isCurrent ? 700 : 600,
                            color: isCurrent ? '#fa233b' : '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {track.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--vision-text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {track.artists?.map((a) => a.name).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Right: Reorder & Remove Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                      {/* Move Up */}
                      {idx > 0 && (
                        <button
                          onClick={() => reorderQueue(idx, idx - 1)}
                          className="vision-pill-btn"
                          style={{ width: 24, height: 24 }}
                          title="Move Up"
                        >
                          <ChevronUp size={12} />
                        </button>
                      )}

                      {/* Move Down */}
                      {idx < queue.length - 1 && (
                        <button
                          onClick={() => reorderQueue(idx, idx + 1)}
                          className="vision-pill-btn"
                          style={{ width: 24, height: 24 }}
                          title="Move Down"
                        >
                          <ChevronDown size={12} />
                        </button>
                      )}

                      {/* Remove track */}
                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="vision-pill-btn"
                        style={{ width: 24, height: 24 }}
                        title="Remove from queue"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* History View */
          history.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--vision-text-tertiary)' }}>
              <History size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>No play history yet</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Tracks you listen to will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((track, idx) => (
                <div
                  key={`${track.id || track.provider_id}_hist_${idx}`}
                  onClick={() => handlePlayFromHistory(track)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <ArtworkImage src={track.artwork} size={36} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--vision-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.artists?.map((a) => a.name).join(', ')}
                      </div>
                    </div>
                  </div>

                  <button className="vision-pill-btn" style={{ width: 28, height: 28 }} title="Replay">
                    <Play size={10} fill="#ffffff" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
