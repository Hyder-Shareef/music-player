import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  PlaySquare,
  Compass,
  Library,
  Heart,
  Clock,
  Plus,
  ListMusic,
  Disc,
} from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../services/api';

export const Sidebar: React.FC = () => {
  const { setCreatePlaylistModalOpen } = useUIStore();

  const { data: playlists = [] } = useQuery({
    queryKey: ['library-playlists'],
    queryFn: musicApi.getLibraryPlaylists,
  });

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <NavLink to="/" className="sidebar-logo">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(250, 35, 59, 0.4)',
          }}
        >
          <Disc size={18} color="#ffffff" />
        </div>
        <span>CHONG</span>
      </NavLink>

      {/* Main Navigation */}
      <div className="nav-group">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <PlaySquare size={18} />
          <span>Listen Now</span>
        </NavLink>

        <NavLink to="/browse" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Compass size={18} />
          <span>Browse</span>
        </NavLink>
      </div>

      {/* Library Section */}
      <div className="nav-group">
        <div className="nav-header">LIBRARY</div>

        <NavLink to="/library" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <Library size={18} />
          <span>Your Library</span>
        </NavLink>

        <NavLink to="/library/liked" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Heart size={18} />
          <span>Favorites</span>
        </NavLink>

        <NavLink to="/library/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Clock size={18} />
          <span>Recently Played</span>
        </NavLink>
      </div>

      {/* Playlists Section */}
      <div className="nav-group" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }}>
          <div className="nav-header" style={{ paddingRight: 0 }}>PLAYLISTS</div>
          <button
            className="btn-icon"
            onClick={() => setCreatePlaylistModalOpen(true)}
            title="Create Playlist"
            style={{ width: 22, height: 22 }}
          >
            <Plus size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginTop: 4 }}>
          {playlists.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-tertiary)' }}>
              No playlists yet
            </div>
          ) : (
            playlists.map((pl) => (
              <NavLink
                key={pl.id}
                to={`/playlist/${pl.id}`}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                <ListMusic size={15} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pl.title}
                </span>
              </NavLink>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
