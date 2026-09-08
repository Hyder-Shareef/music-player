import React, { useState, useEffect } from 'react';
import { Disc } from 'lucide-react';

export interface ArtworkImageProps {
  src?: string | null | any;
  alt?: string;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

/**
 * Extracts a reliable video ID from YouTube/YTMusic URLs
 */
function extractVideoId(url: string): string | null {
  const m = url.match(/(?:vi\/|v=|youtu\.be\/|watch\?v=|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * Resolves any thumbnail into a crisp high-definition URL (544px - 1000px)
 */
export function resolveHighResArtwork(rawSrc: any): string | null {
  if (!rawSrc) return null;

  let urlStr = '';
  if (typeof rawSrc === 'string') {
    urlStr = rawSrc.trim();
  } else if (Array.isArray(rawSrc) && rawSrc.length > 0) {
    const sorted = [...rawSrc].sort((a, b) => (b.width || 0) - (a.width || 0));
    urlStr = sorted[0]?.url || sorted[0]?.src || '';
  } else if (typeof rawSrc === 'object' && rawSrc !== null) {
    urlStr = rawSrc.url || rawSrc.src || '';
  }

  if (!urlStr) return null;

  // 1. YouTube Music / Google User Content
  if (urlStr.includes('googleusercontent.com') || urlStr.includes('ggpht.com')) {
    if (/=w\d+-h\d+/.test(urlStr)) {
      urlStr = urlStr.replace(/=w\d+-h\d+[^"]*/, '=w600-h600-l90-rj');
    } else if (/=s\d+/.test(urlStr)) {
      urlStr = urlStr.replace(/=s\d+[^"]*/, '=s600-l90-rj');
    }
  }

  // 2. YouTube standard thumbnail: Use hqdefault which is universally guaranteed to exist for all videos
  if (urlStr.includes('i.ytimg.com/vi/') || urlStr.includes('img.youtube.com/vi/')) {
    const vId = extractVideoId(urlStr);
    if (vId) {
      urlStr = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
    }
  }

  // 3. Apple Music / iTunes Artwork
  if (urlStr.includes('mzstatic.com')) {
    urlStr = urlStr.replace(/\/\d+x\d+bb\./, '/600x600bb.');
  }

  // 4. Deezer Artwork
  if (urlStr.includes('deezer.com/images/')) {
    urlStr = urlStr.replace(/\/\d+x\d+-\d+\./, '/600x600-000000-80-0-0.');
  }

  // 5. Unsplash image parameter upgrade
  if (urlStr.includes('images.unsplash.com')) {
    urlStr = urlStr.replace(/w=\d+/, 'w=600').replace(/q=\d+/, 'q=85');
  }

  return urlStr;
}

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  src,
  alt = 'Album Artwork',
  className = '',
  size,
  style = {},
}) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  // Generate fallback URL candidates
  const candidates = React.useMemo(() => {
    const list: string[] = [];
    if (!src) return list;

    let raw = '';
    if (typeof src === 'string') raw = src;
    else if (Array.isArray(src) && src.length > 0) raw = src[0]?.url || '';
    else if (typeof src === 'object' && src !== null) raw = src.url || '';

    if (!raw) return list;

    // Candidate 1: High-res resolved URL
    const highRes = resolveHighResArtwork(raw);
    if (highRes) list.push(highRes);

    // Candidate 2: Original raw URL if different
    if (raw && !list.includes(raw)) list.push(raw);

    // Candidate 3: If YouTube URL, fallback directly to hqdefault or mqdefault
    const vId = extractVideoId(raw);
    if (vId) {
      const hq = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
      const mq = `https://i.ytimg.com/vi/${vId}/mqdefault.jpg`;
      if (!list.includes(hq)) list.push(hq);
      if (!list.includes(mq)) list.push(mq);
    }

    return list;
  }, [src]);

  useEffect(() => {
    setCurrentSrcIndex(0);
  }, [src]);

  const activeSrc = candidates[currentSrcIndex];

  const handleImageError = () => {
    if (currentSrcIndex < candidates.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
    } else {
      setCurrentSrcIndex(candidates.length); // All candidates failed, render fallback placeholder
    }
  };

  const baseStyle: React.CSSProperties = {
    width: size ?? '100%',
    height: size ?? '100%',
    minWidth: size,
    objectFit: 'cover',
    display: 'block',
    imageRendering: '-webkit-optimize-contrast',
    transform: 'translateZ(0)',
    ...style,
  };

  if (!activeSrc || currentSrcIndex >= candidates.length) {
    return (
      <div
        className={`artwork-placeholder ${className}`}
        style={{
          ...baseStyle,
          background: 'radial-gradient(circle at 45% 45%, #2a2d3d 0%, #12141c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: style.borderRadius || 'inherit',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Disc size={typeof size === 'number' && size < 40 ? 16 : 24} color="rgba(255, 255, 255, 0.45)" />
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      loading="lazy"
      onError={handleImageError}
      className={className}
      style={baseStyle}
    />
  );
};

