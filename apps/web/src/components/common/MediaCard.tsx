import React from 'react';
import { ArtworkImage } from './ArtworkImage';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TiltCard } from './TiltCard';

interface MediaCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  artwork?: string | null;
  type?: 'album' | 'artist' | 'playlist' | 'track';
  isCircle?: boolean;
  onPlay?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  subtitle,
  artwork,
  type = 'album',
  isCircle = false,
  onPlay,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (!id) return;
    if (type === 'album') navigate(`/album/${id}`);
    else if (type === 'artist') navigate(`/artist/${id}`);
    else if (type === 'playlist') navigate(`/playlist/${id}`);
  };

  const isArtist = type === 'artist' || isCircle;

  return (
    <TiltCard
      maxTilt={isArtist ? 4 : 8}
      scale={1.03}
      onClick={handleClick}
      className="media-card-tilt"
      style={{
        textAlign: isArtist ? 'center' : 'left',
        padding: 8,
        borderRadius: 20,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div
        className="media-card-art-container"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1/1',
          borderRadius: isArtist ? '50%' : 16,
          overflow: 'hidden',
          marginBottom: 10,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <ArtworkImage
          src={artwork}
          alt={title}
          className="media-card-art"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: isArtist ? '50%' : 'inherit',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {onPlay && (
          <button
            className="play-overlay-btn magnetic-button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(e);
            }}
            title="Play"
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'var(--accent, #fa233b)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(250, 35, 59, 0.55), 0 2px 6px rgba(0, 0, 0, 0.4)',
              cursor: 'pointer',
              zIndex: 6,
            }}
          >
            <Play size={18} fill="#ffffff" style={{ marginLeft: 2 }} />
          </button>
        )}
      </div>

      <div
        className="media-card-title"
        title={title}
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#ffffff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '0 4px',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          className="media-card-subtitle"
          title={subtitle}
          style={{
            fontSize: 12,
            color: 'var(--vision-text-secondary, rgba(245, 245, 247, 0.65))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 2,
            padding: '0 4px',
          }}
        >
          {subtitle}
        </div>
      )}
    </TiltCard>
  );
};
