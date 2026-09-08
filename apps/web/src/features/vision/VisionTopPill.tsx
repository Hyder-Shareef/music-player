import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../../services/api';
import { useAudioEngine } from '../player/useAudioEngine';
import { ArtworkImage } from '../../components/common/ArtworkImage';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  Play,
  X,
  Sparkles,
  User as UserIcon,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { Track } from '../../types/music';
import { useAuthStore } from '../../stores/authStore';

interface VisionTopPillProps {
  environmentMode?: string;
  onCycleEnvironment?: () => void;
  showVisualizer?: boolean;
  onToggleVisualizer?: () => void;
}

export const VisionTopPill: React.FC<VisionTopPillProps> = () => {
  const { user, isAuthenticated, openLoginModal, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { play } = useAudioEngine();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const omnibarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with URL query when navigating to search
  useEffect(() => {
    if (location.pathname === '/search') {
      const q = searchParams.get('q') || '';
      setSearchInput(q);
    }
  }, [location.pathname, searchParams]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setSelectedIndex(-1);
    }, 180);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch search suggestions
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['quick-search', debouncedQuery],
    queryFn: () => (debouncedQuery ? musicApi.search(debouncedQuery) : null),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  // Handle click outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (omnibarRef.current && !omnibarRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickSongs = searchResults?.songs?.slice(0, 6) || [];
  const quickArtists = searchResults?.artists?.slice(0, 4) || [];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < quickSongs.length) {
      handleSelectTrack(quickSongs[selectedIndex], quickSongs);
      return;
    }
    if (searchInput.trim()) {
      setIsDropdownOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || quickSongs.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < quickSongs.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : quickSongs.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectTrack = (track: Track, allTracks: Track[]) => {
    setIsDropdownOpen(false);
    play(track, allTracks);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="vision-top-pill" role="toolbar" aria-label="Window Navigation Controls" style={{ position: 'relative' }}>
      {/* Back / Forward Pills */}
      <button
        className="vision-pill-btn"
        onClick={() => navigate(-1)}
        title="Go Back"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        className="vision-pill-btn"
        onClick={() => navigate(1)}
        title="Go Forward"
      >
        <ChevronRight size={16} />
      </button>

      {/* VisionOS Wide Omnibar & Translucent Glass Autocomplete */}
      <div ref={omnibarRef} style={{ position: 'relative' }}>
        <form onSubmit={handleSearchSubmit} className="vision-omnibar">
          <Search size={15} color="var(--vision-text-secondary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search songs, artists, albums, or lyrics..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchInput.trim().length >= 2) setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />

          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setIsDropdownOpen(false);
                inputRef.current?.focus();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: 'var(--vision-text-secondary)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd
              style={{
                fontSize: 10,
                color: 'var(--vision-text-tertiary)',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 5px',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                userSelect: 'none',
              }}
            >
              ⌘K
            </kbd>
          )}
        </form>

        {/* Floating Translucent Glass Dropdown Suggestions */}
        {isDropdownOpen && debouncedQuery.length >= 2 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 440,
              maxWidth: '92vw',
              background: 'rgba(16, 18, 26, 0.68)',
              backdropFilter: 'blur(45px) saturate(210%)',
              WebkitBackdropFilter: 'blur(45px) saturate(210%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 24,
              boxShadow: '0 30px 90px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.45)',
              padding: '12px 14px',
              zIndex: 120,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 460,
              overflowY: 'auto',
              animation: 'visionFadeSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px 6px 8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} color="var(--vision-accent)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', letterSpacing: 0.8 }}>
                  Live Suggestions
                </span>
              </div>
              {isSearchLoading ? (
                <span style={{ fontSize: 11, color: 'var(--vision-accent)', fontWeight: 600 }}>Searching...</span>
              ) : (
                <span style={{ fontSize: 10, color: 'var(--vision-text-tertiary)' }}>Press Enter to search all</span>
              )}
            </div>

            {/* Song Suggestions */}
            {quickSongs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', padding: '2px 8px', letterSpacing: 0.5 }}>
                  Tracks
                </span>
                {quickSongs.map((track, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={track.id || track.provider_id || idx}
                      onClick={() => handleSelectTrack(track, quickSongs)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            overflow: 'hidden',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <ArtworkImage src={track.artwork} size={36} />
                        </div>
                        <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#ffffff',
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
                              marginTop: 1,
                            }}
                          >
                            {track.artists?.map((a) => a.name).join(', ')}
                          </div>
                        </div>
                      </div>

                      <button
                        className="vision-pill-btn"
                        style={{ width: 28, height: 28, flexShrink: 0, marginLeft: 8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTrack(track, quickSongs);
                        }}
                        title="Play Track"
                      >
                        <Play size={11} fill="#ffffff" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Artist Suggestions */}
            {quickArtists.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', padding: '0 8px 6px 8px', display: 'block', letterSpacing: 0.5 }}>
                  Artists
                </span>
                <div style={{ display: 'flex', gap: 8, padding: '2px 6px', flexWrap: 'wrap' }}>
                  {quickArtists.map((artist, idx) => (
                    <div
                      key={artist.id || idx}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate(`/artist/${artist.id}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '9999px',
                        padding: '4px 12px 4px 6px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden' }}>
                        <ArtworkImage src={artist.artwork} size={22} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{artist.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Full Search Results Footer */}
            <div
              onClick={() => {
                setIsDropdownOpen(false);
                navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                marginTop: 2,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
            >
              <Search size={13} />
              <span>Explore all results for &quot;{searchInput}&quot;</span>
            </div>
          </div>
        )}
      </div>

      {/* Reload / Refresh */}
      <button className="vision-pill-btn" onClick={handleRefresh} title="Reload Window">
        <RotateCw size={14} />
      </button>

      {/* Google / Gmail Account Session Pill */}
      <div ref={userMenuRef} style={{ position: 'relative' }}>
        {isAuthenticated && user ? (
          <button
            className="vision-pill-btn"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            style={{
              padding: '4px 10px',
              width: 'auto',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: isUserMenuOpen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            }}
            title={user.email}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fa233b, #ff7b00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#ffffff',
                maxWidth: 100,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name}
            </span>
          </button>
        ) : (
          <button
            onClick={openLoginModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #fa233b 0%, #d81b31 100%)',
              border: 'none',
              borderRadius: '9999px',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(250, 35, 59, 0.35)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Sign in with Gmail to save your music collection"
          >
            <UserIcon size={13} />
            <span>Sign In</span>
          </button>
        )}

        {/* User Dropdown Menu */}
        {isUserMenuOpen && isAuthenticated && user && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              width: 260,
              background: 'rgba(20, 22, 30, 0.88)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 18,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              padding: 14,
              zIndex: 150,
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: 'visionFadeSlideIn 0.2s ease',
            }}
          >
            {/* User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fa233b, #ff7b00)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>

            {/* Sync Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 10,
                color: '#10b981',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={13} />
              <span>Session & Library Synced</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                logout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                color: '#ff6b6b',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 107, 107, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
