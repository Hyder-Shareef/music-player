import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Command,
  User,
  PlusCircle,
  X,
} from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { toggleCommandPalette, setCreatePlaylistModalOpen } = useUIStore();
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <header className="topbar">
      {/* Left: History navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn-icon"
            onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.08)' }}
            title="Back"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="btn-icon"
            onClick={() => navigate(1)}
            style={{ width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.08)' }}
            title="Forward"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Global Instant Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: 380, maxWidth: '40vw' }}>
          <Search
            size={16}
            color="var(--text-secondary)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search songs, artists, albums, playlists..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-full)',
              padding: '9px 36px 9px 40px',
              fontSize: 13.5,
              fontWeight: 500,
              color: '#ffffff',
              outline: 'none',
              transition: 'all 0.25s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Right: Quick actions, Command Palette & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Command Palette Button */}
        <button
          onClick={toggleCommandPalette}
          className="btn-secondary"
          style={{ padding: '7px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 'var(--radius-full)' }}
          title="Command Palette (Cmd/Ctrl + K)"
        >
          <Command size={13} />
          <span>Quick Actions</span>
          <kbd style={{ fontSize: 10, background: 'rgba(255,255,255,0.12)', padding: '2px 5px', borderRadius: 4 }}>
            ⌘K
          </kbd>
        </button>

        {/* Create playlist quick button */}
        <button
          className="btn-icon"
          onClick={() => setCreatePlaylistModalOpen(true)}
          title="Create Playlist"
          style={{ width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <PlusCircle size={18} />
        </button>

        {/* User Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
          title="Chong Listener"
        >
          <User size={16} />
        </div>
      </div>
    </header>
  );
};
