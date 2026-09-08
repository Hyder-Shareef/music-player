import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';

export interface GenreItem {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  artwork: string;
  searchQuery: string;
}

interface VinylGenreCardProps {
  genre: GenreItem;
  onPlay?: (query: string) => void;
}

export const VinylGenreCard: React.FC<VinylGenreCardProps> = ({ genre }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate(`/search?q=${encodeURIComponent(genre.searchQuery)}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        padding: '12px 14px',
        borderRadius: 24,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isHovered
          ? `0 20px 40px rgba(0, 0, 0, 0.5), 0 0 24px ${genre.color}44`
          : '0 8px 24px rgba(0, 0, 0, 0.3)',
        transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'none',
        overflow: 'visible',
      }}
    >
      {/* Vinyl Assembly Container (Sleeve + Sliding LP Disc) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Realistic Vinyl LP Disc */}
        <div
          style={{
            position: 'absolute',
            width: '88%',
            height: '88%',
            borderRadius: '50%',
            background: `radial-gradient(circle at 50% 50%, 
              #050505 0%, 
              #0d0d11 25%, 
              #17171d 26%, 
              #0a0a0e 30%, 
              #1a1a22 38%, 
              #08080a 45%, 
              #1c1c24 55%, 
              #0d0d10 65%, 
              #1a1a20 75%, 
              #050507 100%)`,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85), inset 0 0 4px rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isHovered
              ? 'translateX(28%) rotate(72deg)'
              : 'translateX(10%) rotate(0deg)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          {/* Subtle Grooved Ring Texture */}
          <div
            style={{
              position: 'absolute',
              inset: 4,
              borderRadius: '50%',
              background: `repeating-radial-gradient(
                circle at 50% 50%,
                transparent 0,
                transparent 2px,
                rgba(255, 255, 255, 0.04) 3px,
                rgba(0, 0, 0, 0.5) 4px
              )`,
              opacity: 0.8,
            }}
          />

          {/* Vinyl Specular Gloss Sheen Cones */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `conic-gradient(
                from 45deg,
                transparent 0deg,
                rgba(255, 255, 255, 0.15) 35deg,
                transparent 70deg,
                transparent 180deg,
                rgba(255, 255, 255, 0.15) 215deg,
                transparent 250deg
              )`,
              mixBlendMode: 'screen',
            }}
          />

          {/* Center Record Label with Genre Artwork */}
          <div
            style={{
              width: '38%',
              height: '38%',
              borderRadius: '50%',
              background: genre.color,
              border: '2px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Center Spindle Hole */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#090a0f',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.9), 0 0 1px rgba(255, 255, 255, 0.4)',
                zIndex: 2,
              }}
            />
            {/* Genre Letter badge in label */}
            <span
              style={{
                position: 'absolute',
                fontSize: 8,
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                top: 5,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              LP 33⅓
            </span>
          </div>
        </div>

        {/* Outer Album Jacket Sleeve */}
        <div
          style={{
            position: 'relative',
            width: '88%',
            height: '88%',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 14px 36px rgba(0, 0, 0, 0.65), 0 2px 8px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            zIndex: 2,
            background: '#15171f',
            marginRight: 'auto',
          }}
        >
          {/* Cover Art Image */}
          <img
            src={genre.artwork}
            alt={genre.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: 'brightness(0.92) contrast(1.08)',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />

          {/* Sleeve Gradient Shade Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85) 100%)`,
            }}
          />

          {/* Spine Highlight on Left Edge */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 3,
              background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
            }}
          />

          {/* Vinyl Tag Badge */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: '9999px',
              background: 'rgba(10, 12, 18, 0.65)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: '#ffffff',
            }}
          >
            <Sparkles size={9} color={genre.color} />
            <span>Vinyl</span>
          </div>

          {/* Play Icon Trigger on Hover */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#ffffff',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'scale(1)' : 'scale(0.7)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <Play size={14} fill="#000000" style={{ marginLeft: 2 }} />
          </div>
        </div>
      </div>

      {/* Metadata / Title Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 4px' }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {genre.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--vision-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {genre.subtitle}
        </div>
      </div>
    </div>
  );
};
