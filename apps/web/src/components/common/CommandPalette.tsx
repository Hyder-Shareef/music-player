import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useAudioEngine } from '../../features/player/useAudioEngine';
import { useNavigate } from 'react-router-dom';
import { musicApi } from '../../services/api';
import { ArtworkImage } from '../common/ArtworkImage';
import {
  Search,
  Home,
  Compass,
  Library,
  Play,
  PlusCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { Track } from '../../types/music';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setCreatePlaylistModalOpen } = useUIStore();
  const { togglePlay, currentTrack, play } = useAudioEngine();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSearchResults([]);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await musicApi.search(query, 'songs');
        setSearchResults(res.songs.slice(0, 6));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const handleNavigate = (path: string) => {
    setCommandPaletteOpen(false);
    navigate(path);
  };

  const handlePlaySong = (track: Track) => {
    play(track, searchResults);
    setCommandPaletteOpen(false);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: 580,
          padding: 0,
          overflow: 'hidden',
          background: 'rgba(18, 20, 28, 0.75)',
          backdropFilter: 'blur(50px) saturate(210%)',
          WebkitBackdropFilter: 'blur(50px) saturate(210%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 28,
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            gap: 12,
            background: 'rgba(255, 255, 255, 0.03)',
          }}
        >
          <Search size={18} color="var(--vision-text-secondary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search songs, artists, or type commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 500,
              outline: 'none',
            }}
          />
          {query && (
            <button
              className="vision-pill-btn"
              onClick={() => setQuery('')}
              style={{ width: 26, height: 26 }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Results / Commands Body */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '12px 14px' }}>
          {query.trim() ? (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', padding: '4px 8px 8px 8px', letterSpacing: 0.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={11} color="var(--vision-accent)" />
                <span>Translucent Search Results</span>
              </div>
              {isSearching ? (
                <div style={{ padding: '20px 8px', color: 'var(--vision-accent)', fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
                  Searching YouTube Music...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '20px 8px', color: 'var(--vision-text-secondary)', fontSize: 13, textAlign: 'center' }}>
                  No tracks found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {searchResults.map((track) => (
                    <div
                      key={track.id || track.provider_id}
                      onClick={() => handlePlaySong(track)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '8px 12px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid transparent',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          <ArtworkImage src={track.artwork} size={34} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {track.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--vision-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {track.artists.map((a) => a.name).join(', ')}
                          </div>
                        </div>
                      </div>

                      <button className="vision-pill-btn" style={{ width: 26, height: 26, flexShrink: 0 }} title="Play">
                        <Play size={10} fill="#ffffff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', padding: '4px 8px 8px 8px', letterSpacing: 0.6 }}>
                Quick Navigation &amp; Actions
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <CommandItem icon={<Home size={16} />} label="Go to Listen Now (Home)" onClick={() => handleNavigate('/')} />
                <CommandItem icon={<Compass size={16} />} label="Go to Browse / Explore" onClick={() => handleNavigate('/browse')} />
                <CommandItem icon={<Library size={16} />} label="Go to Your Library" onClick={() => handleNavigate('/library')} />
                <CommandItem
                  icon={<PlusCircle size={16} />}
                  label="Create New Playlist"
                  onClick={() => {
                    setCommandPaletteOpen(false);
                    setCreatePlaylistModalOpen(true);
                  }}
                />
                <CommandItem
                  icon={<Play size={16} />}
                  label={currentTrack ? 'Toggle Play / Pause' : 'Play Music'}
                  onClick={() => {
                    togglePlay();
                    setCommandPaletteOpen(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            padding: '10px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: 11,
            color: 'var(--vision-text-tertiary)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Use <b>↑</b> <b>↓</b> to navigate</span>
          <span><b>ESC</b> to dismiss</span>
        </div>
      </div>
    </div>
  );
};

const CommandItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '9px 12px',
      borderRadius: 14,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500,
      color: '#ffffff',
      background: 'rgba(255, 255, 255, 0.03)',
      transition: 'all 0.18s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
      e.currentTarget.style.transform = 'translateX(2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
  >
    <span style={{ color: 'var(--vision-text-secondary)', display: 'flex', alignItems: 'center' }}>{icon}</span>
    <span>{label}</span>
  </div>
);
