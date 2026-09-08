import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Compass,
  Library,
  PlusCircle,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const VisionNavRail: React.FC = () => {
  const { setCreatePlaylistModalOpen } = useUIStore();

  return (
    <aside className="vision-nav-rail" aria-label="Spatial Navigation Rail">
      {/* Home / Listen Now */}
      <NavLink
        to="/"
        className={({ isActive }) => `vision-nav-item magnetic-button ${isActive ? 'active' : ''}`}
        title="Home / Listen Now"
        end
      >
        <Home size={20} />
      </NavLink>

      {/* Browse / Discover */}
      <NavLink
        to="/browse"
        className={({ isActive }) => `vision-nav-item magnetic-button ${isActive ? 'active' : ''}`}
        title="Browse & Charts"
      >
        <Compass size={20} />
      </NavLink>

      {/* Library */}
      <NavLink
        to="/library"
        className={({ isActive }) => `vision-nav-item magnetic-button ${isActive ? 'active' : ''}`}
        title="Your Music Library"
      >
        <Library size={20} />
      </NavLink>

      {/* Create Playlist */}
      <button
        className="vision-nav-item magnetic-button"
        onClick={() => setCreatePlaylistModalOpen(true)}
        title="Create New Playlist"
      >
        <PlusCircle size={20} />
      </button>
    </aside>
  );
};
