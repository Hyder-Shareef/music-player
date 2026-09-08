import React from 'react';
import { NavLink } from 'react-router-dom';
import { PlaySquare, Compass, Library, Search } from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) => `btn-icon ${isActive ? 'active' : ''}`}
        style={{ flexDirection: 'column', height: '100%', gap: 2 }}
        end
      >
        <PlaySquare size={20} />
        <span style={{ fontSize: 10 }}>Listen</span>
      </NavLink>

      <NavLink
        to="/browse"
        className={({ isActive }) => `btn-icon ${isActive ? 'active' : ''}`}
        style={{ flexDirection: 'column', height: '100%', gap: 2 }}
      >
        <Compass size={20} />
        <span style={{ fontSize: 10 }}>Browse</span>
      </NavLink>

      <NavLink
        to="/search"
        className={({ isActive }) => `btn-icon ${isActive ? 'active' : ''}`}
        style={{ flexDirection: 'column', height: '100%', gap: 2 }}
      >
        <Search size={20} />
        <span style={{ fontSize: 10 }}>Search</span>
      </NavLink>

      <NavLink
        to="/library"
        className={({ isActive }) => `btn-icon ${isActive ? 'active' : ''}`}
        style={{ flexDirection: 'column', height: '100%', gap: 2 }}
      >
        <Library size={20} />
        <span style={{ fontSize: 10 }}>Library</span>
      </NavLink>
    </nav>
  );
};
