import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SpatialEnvironment, EnvironmentMode } from '../features/vision/SpatialEnvironment';
import { VisionNavRail } from '../features/vision/VisionNavRail';
import { VisionTopPill } from '../features/vision/VisionTopPill';
import { VisionPlayerPill } from '../features/vision/VisionPlayerPill';
import { CornerOrbWidget } from '../features/visualizer/CornerOrbWidget';
import { FullPlayer } from '../features/player/FullPlayer';
import { QueueDrawer } from '../features/player/QueueDrawer';
import { LyricsPanel } from '../features/player/LyricsPanel';
import { EqualizerModal } from '../features/player/EqualizerModal';
import { CreatePlaylistModal } from '../components/common/CreatePlaylistModal';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { LoginModal } from '../components/auth/LoginModal';
import { ContextMenu } from '../components/common/ContextMenu';
import { ToastContainer } from '../components/common/ToastContainer';
import { useAudioEngine } from '../features/player/useAudioEngine';

export const AppShell: React.FC = () => {
  // Initialize and mount AudioEngine event listeners & shortcuts
  useAudioEngine();

  // Spatial Environment Mode
  const [environmentMode] = useState<EnvironmentMode>('living-space');

  return (
    <div className="vision-root" style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 1. Spatial Environment */}
      <SpatialEnvironment mode={environmentMode} />

      {/* 2. Floating Left Navigation Rail */}
      <VisionNavRail />

      {/* 3. Floating Top Omnibar Control Pill */}
      <VisionTopPill />

      {/* 4. Center Translucent Floating Glass Window */}
      <main className="vision-canvas-container" role="main">
        <div className="vision-window">
          <div className="vision-window-content">
            <Outlet />
          </div>
        </div>
      </main>

      {/* 5. Floating Bottom Spatial Player Pill */}
      <VisionPlayerPill />

      {/* 6. Interactive 3D Corner Orb Widget */}
      <CornerOrbWidget />

      {/* 7. Overlays & Modals */}
      <FullPlayer />
      <QueueDrawer />
      <LyricsPanel />
      <EqualizerModal />
      <CreatePlaylistModal />
      <AddToPlaylistModal />
      <LoginModal />
      <ContextMenu />
      <ToastContainer />
    </div>
  );
};
