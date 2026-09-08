import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioEngine } from './useAudioEngine';
import { Copy, Check, ArrowDown } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface SyncedLyricsViewProps {
  rawLyrics?: string | null;
  className?: string;
  isCompact?: boolean;
}

interface LyricLine {
  id: number;
  time: number;
  endTime?: number;
  text: string;
}

export const SyncedLyricsView: React.FC<SyncedLyricsViewProps> = ({
  rawLyrics,
  className = '',
  isCompact = false,
}) => {
  const { currentTime, duration, seek } = useAudioEngine();
  const { addToast } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);

  // Parse raw lyrics into timed lines
  const lyricLines: LyricLine[] = useMemo(() => {
    if (!rawLyrics) return [];

    const rawLines = rawLyrics
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const timeRegex = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g;
    const hasLrcTimestamps = rawLines.some((l) => /\[\d{1,2}:\d{2}/.test(l));

    if (hasLrcTimestamps) {
      const parsed: LyricLine[] = [];
      let idCounter = 0;

      rawLines.forEach((line) => {
        let match;
        timeRegex.lastIndex = 0;
        const text = line.replace(timeRegex, '').trim();

        timeRegex.lastIndex = 0;
        while ((match = timeRegex.exec(line)) !== null) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseFloat(match[2]);
          const time = minutes * 60 + seconds;
          if (text) {
            parsed.push({ id: idCounter++, time, text });
          }
        }
      });

      const sorted = parsed.sort((a, b) => a.time - b.time);
      // Calculate endTime for karaoke progressive glow
      return sorted.map((line, idx) => ({
        ...line,
        endTime: sorted[idx + 1]?.time || line.time + 4.5,
      }));
    }

    // If plain text (no LRC tags), distribute lines organically across track duration
    const songDuration = duration > 10 ? duration : 180;
    const introOffset = 8;
    const usableDuration = Math.max(10, songDuration - introOffset - 10);
    const step = usableDuration / Math.max(1, rawLines.length);

    return rawLines.map((text, idx) => ({
      id: idx,
      time: introOffset + idx * step,
      endTime: introOffset + (idx + 1) * step,
      text,
    }));
  }, [rawLyrics, duration]);

  const isProgrammaticScrollRef = useRef(false);
  const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Determine current active line index
  const activeIndex = useMemo(() => {
    if (lyricLines.length === 0) return -1;
    let found = -1;
    for (let i = 0; i < lyricLines.length; i++) {
      if (currentTime >= lyricLines[i].time) {
        found = i;
      } else {
        break;
      }
    }
    return found;
  }, [lyricLines, currentTime]);

  // Smooth scroll active line into center unless user is manually exploring lyrics
  useEffect(() => {
    if (isUserScrolling || activeIndex === -1) return;

    const container = containerRef.current;
    const activeEl = lineRefs.current[activeIndex];

    if (container && activeEl) {
      isProgrammaticScrollRef.current = true;
      const targetScrollTop =
        activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });

      // Clear programmatic lock after animation completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 400);
    }
  }, [activeIndex, isUserScrolling]);

  // Handle user manual scroll exclusively on user interaction
  const handleUserInteraction = () => {
    if (isProgrammaticScrollRef.current) return;
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    // Auto-resume sync after 4 seconds of idle
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
  };

  const handleResumeSync = () => {
    setIsUserScrolling(false);
    if (activeIndex !== -1) {
      const container = containerRef.current;
      const activeEl = lineRefs.current[activeIndex];
      if (container && activeEl) {
        isProgrammaticScrollRef.current = true;
        const targetScrollTop =
          activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 400);
      }
    }
  };

  const handleCopyLyrics = () => {
    if (!rawLyrics) return;
    const plain = rawLyrics.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
    navigator.clipboard.writeText(plain);
    setCopied(true);
    addToast('Lyrics copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!rawLyrics || lyricLines.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 240,
          color: 'var(--vision-text-tertiary)',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 500 }}>No lyrics available for this track.</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Enjoy the music in 3D Spatial Audio!</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Action Header bar: Copy & Status */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 16,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={handleCopyLyrics}
          className="vision-pill-btn"
          style={{ width: 30, height: 30 }}
          title="Copy lyrics text"
        >
          {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
        </button>
      </div>

      {/* Lyrics Scrollable Stream */}
      <div
        ref={containerRef}
        onWheel={handleUserInteraction}
        onTouchMove={handleUserInteraction}
        onPointerDown={handleUserInteraction}
        className={`synced-lyrics-container ${className}`}
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: isCompact ? '40px 16px 80px 16px' : '60px 36px 120px 36px',
          scrollBehavior: 'smooth',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? 20 : 36 }}>
          {lyricLines.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;
            const distanceFromActive = Math.abs(idx - activeIndex);

            return (
              <div
                key={line.id}
                ref={(el) => {
                  lineRefs.current[idx] = el;
                }}
                onClick={() => {
                  seek(line.time);
                  setIsUserScrolling(false);
                }}
                className="lyric-line-item"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  fontSize: isCompact
                    ? isActive
                      ? 20
                      : 15
                    : isActive
                    ? 32
                    : distanceFromActive === 1
                    ? 22
                    : 17,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive
                    ? '#ffffff'
                    : isPast
                    ? 'rgba(255, 255, 255, 0.4)'
                    : 'rgba(255, 255, 255, 0.65)',
                  cursor: 'pointer',
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isActive
                    ? 'scale(1.04) translateX(8px)'
                    : 'scale(1)',
                  filter: !isActive && distanceFromActive > 3 ? 'blur(1px)' : 'none',
                  textShadow: isActive
                    ? '0 0 35px var(--vision-accent, #fa233b), 0 0 12px rgba(255, 255, 255, 0.9)'
                    : 'none',
                  lineHeight: 1.45,
                  userSelect: 'none',
                  borderRadius: 16,
                  padding: '8px 14px',
                  background: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.filter = 'none';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = isPast
                      ? 'rgba(255, 255, 255, 0.4)'
                      : 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'none';
                    if (distanceFromActive > 3) {
                      e.currentTarget.style.filter = 'blur(1px)';
                    }
                  }
                }}
              >
                <span style={{ letterSpacing: isActive ? '-0.3px' : '0' }}>{line.text}</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--vision-text-tertiary)',
                    opacity: isActive ? 0.95 : 0.4,
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 8,
                    flexShrink: 0,
                    fontWeight: 600,
                  }}
                >
                  {formatTime(line.time)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Resume Sync Pill when user scrolls manually */}
      {isUserScrolling && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <button
            onClick={handleResumeSync}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'var(--vision-glass-thick)',
              backdropFilter: 'var(--vision-blur-deep)',
              WebkitBackdropFilter: 'var(--vision-blur-deep)',
              border: '1px solid var(--vision-accent)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowDown size={12} color="var(--vision-accent)" />
            <span>Resume Auto-Scroll</span>
          </button>
        </div>
      )}
    </div>
  );
};
