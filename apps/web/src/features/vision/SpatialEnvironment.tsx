import React, { useEffect, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { extractArtworkPalette, ArtworkPalette } from '../../utils/colorExtractor';

export type EnvironmentMode = 'living-space' | 'celestial-nebula' | 'spatial-dark';

interface SpatialEnvironmentProps {
  mode: EnvironmentMode;
}

export const SpatialEnvironment: React.FC<SpatialEnvironmentProps> = ({
  mode,
}) => {
  const { currentTrack, isPlaying, accentColor } = usePlayerStore();
  const [palette, setPalette] = useState<ArtworkPalette | null>(null);

  useEffect(() => {
    if (currentTrack?.artwork) {
      extractArtworkPalette(currentTrack.artwork).then(setPalette);
    } else {
      setPalette(null);
    }
  }, [currentTrack?.artwork]);

  const pColor = palette?.primary || accentColor || '#fa233b';
  const sColor = palette?.secondary || '#ff758c';
  const tColor = palette?.tertiary || '#10121a';

  return (
    <div
      className="spatial-environment-wrapper"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* 1. Living Space (VisionOS Interior Loft) */}
      {mode === 'living-space' && !currentTrack?.artwork && (
        <div
          className="environment-backdrop living-space"
          style={{
            position: 'absolute',
            inset: '-20px',
            backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2560&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            filter: 'brightness(0.72) saturate(1.1) blur(2px)',
            transform: 'scale(1.03)',
            transition: 'filter 0.8s ease, transform 0.8s ease',
          }}
        />
      )}

      {/* 2. Celestial Nebula */}
      {mode === 'celestial-nebula' && !currentTrack?.artwork && (
        <div
          className="environment-backdrop celestial"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 30%, #1e1b4b 0%, #09090b 65%, #000000 100%)',
          }}
        />
      )}

      {/* 3. Spatial Dark Studio */}
      {mode === 'spatial-dark' && !currentTrack?.artwork && (
        <div
          className="environment-backdrop spatial-dark"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 40%, #18181b 0%, #09090b 70%, #000000 100%)',
          }}
        />
      )}

      {/* =========================================================================
          DYNAMIC TRACK ARTWORK & ACCENT WALLPAPER (Across entire app & Home screen)
          ========================================================================= */}
      {currentTrack?.artwork && (
        <div
          style={{
            position: 'absolute',
            inset: '-40px',
            transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: 1,
          }}
        >
          {/* Blurred Artwork Layer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url('${currentTrack.artwork}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
              filter: 'blur(70px) brightness(0.48) saturate(1.85)',
              transform: isPlaying ? 'scale(1.15)' : 'scale(1.08)',
              transition: 'transform 8s ease-out, filter 1.2s ease',
            }}
          />

          {/* Dynamic Fluid Multi-Color Mesh Accents */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(circle at 20% 30%, ${pColor}55 0%, transparent 60%),
                radial-gradient(circle at 80% 70%, ${sColor}44 0%, transparent 55%),
                radial-gradient(circle at 50% 85%, ${tColor}99 0%, transparent 70%)
              `,
              mixBlendMode: 'screen',
              transition: 'all 1.4s ease',
            }}
          />
        </div>
      )}

      {/* Depth Contrast Scrim to maintain pristine readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: currentTrack?.artwork
            ? 'linear-gradient(180deg, rgba(8, 10, 16, 0.45) 0%, rgba(8, 10, 16, 0.7) 60%, rgba(6, 7, 12, 0.88) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 85%)',
          zIndex: 2,
          transition: 'background 1s ease',
        }}
      />
    </div>
  );
};

