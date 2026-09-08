import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../services/api';
import { TrackRow } from '../components/common/TrackRow';
import { Skeleton } from '../components/common/Skeleton';
import { ArtworkImage, resolveHighResArtwork } from '../components/common/ArtworkImage';
import { useAudioEngine } from '../features/player/useAudioEngine';
import { useQueueStore } from '../stores/queueStore';
import { useUIStore } from '../stores/uiStore';
import { Play, Shuffle, Disc, Sparkles, CheckCircle2 } from 'lucide-react';

export const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { play } = useAudioEngine();
  const { setQueue } = useQueueStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const [autoplayAlbum, setAutoplayAlbum] = useState(true);

  const { data: album, isLoading, error } = useQuery({
    queryKey: ['album', id],
    queryFn: () => (id ? musicApi.getAlbum(id) : null),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="section-container" style={{ display: 'flex', gap: 32, padding: '40px 32px' }}>
        <Skeleton width={220} height={220} borderRadius={16} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton width={120} height={16} />
          <Skeleton width={320} height={36} />
          <Skeleton width={180} height={20} />
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <Skeleton width={100} height={40} borderRadius={20} />
            <Skeleton width={100} height={40} borderRadius={20} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="section-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Disc size={48} color="var(--accent)" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Album Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          The requested album could not be loaded.
        </p>
      </div>
    );
  }

  const rawTracks = album.tracks || [];
  // Ensure every track in album inherits high-res album artwork if missing
  const tracks = rawTracks.map((t) => ({
    ...t,
    artwork: resolveHighResArtwork(t.artwork || album.artwork),
  }));

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setQueue(tracks, 0);
      play(tracks[0], tracks);
      addToast(`Autoplaying album: "${album.title}"`, 'info');
    }
  };

  const handleShuffleAll = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      setQueue(shuffled, 0);
      play(shuffled[0], shuffled);
      addToast(`Shuffling album: "${album.title}"`, 'info');
    }
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Album Hero Panoramic Banner */}
      <div
        style={{
          position: 'relative',
          borderRadius: 28,
          overflow: 'hidden',
          minHeight: 280,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: 'var(--vision-specular-border)',
          display: 'flex',
          gap: 32,
          alignItems: 'center',
          padding: '36px 36px',
        }}
      >
        {/* Immersive Blurred Backdrop Artwork */}
        {album.artwork && (
          <div
            style={{
              position: 'absolute',
              inset: '-20px',
              backgroundImage: `url('${album.artwork}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
              filter: 'blur(45px) brightness(0.42) saturate(1.7)',
              zIndex: 1,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(12, 14, 20, 0.88) 0%, rgba(12, 14, 20, 0.65) 60%, rgba(12, 14, 20, 0.45) 100%)',
            zIndex: 2,
          }}
        />

        {/* Crisp High-Res Cover Art Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 5,
            width: 200,
            height: 200,
            borderRadius: 20,
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <ArtworkImage src={album.artwork} alt={album.title} size={200} />
        </div>

        <div style={{ flex: 1, position: 'relative', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', letterSpacing: 1 }}>
              {album.type || 'ALBUM'}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={10} />
              Spatial Audio Mastered
            </span>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.8px', margin: '4px 0 8px 0', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {album.title}
          </h1>

          {/* Artist Links */}
          <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 8 }}>
            {album.artists.map((artist, idx) => (
              <span
                key={idx}
                style={{ cursor: artist.id ? 'pointer' : 'default', color: 'var(--vision-accent)' }}
                onClick={() => artist.id && navigate(`/artist/${artist.id}`)}
              >
                {artist.name}
                {idx < album.artists.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>

          {/* Metadata: Year, Track count, Duration */}
          <div style={{ fontSize: 13, color: 'var(--vision-text-secondary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {album.year && <span>{album.year}</span>}
            {album.track_count && <span>• {album.track_count} songs</span>}
            {album.duration && <span>• {album.duration}</span>}
          </div>

          {/* Play / Shuffle Buttons & Autoplay status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="vision-glass-btn primary" onClick={handlePlayAll} disabled={tracks.length === 0}>
              <Play size={16} fill="#000000" />
              <span>Play Album</span>
            </button>

            <button className="vision-glass-btn" onClick={handleShuffleAll} disabled={tracks.length === 0}>
              <Shuffle size={16} />
              <span>Shuffle</span>
            </button>

            <button
              onClick={() => {
                const next = !autoplayAlbum;
                setAutoplayAlbum(next);
                addToast(next ? 'Album Autoplay: ON' : 'Album Autoplay: OFF', 'info');
              }}
              style={{
                background: autoplayAlbum ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '9999px',
                padding: '8px 14px',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(20px)',
              }}
              title="Seamlessly autoplay next song when finished"
            >
              <CheckCircle2 size={14} color={autoplayAlbum ? '#38bdf8' : 'var(--vision-text-tertiary)'} />
              <span>Autoplay Album</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <section className="section-container" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tracks.map((track, idx) => (
            <TrackRow
              key={`${track.id || track.provider_id}_${idx}`}
              track={track}
              index={idx}
              contextTracks={tracks}
              showArtwork={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
