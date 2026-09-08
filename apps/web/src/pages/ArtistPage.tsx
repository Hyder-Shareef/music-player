import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musicApi } from '../services/api';
import { Skeleton } from '../components/common/Skeleton';
import { ArtworkImage, resolveHighResArtwork } from '../components/common/ArtworkImage';
import { useAudioEngine } from '../features/player/useAudioEngine';
import { useQueueStore } from '../stores/queueStore';
import { useUIStore } from '../stores/uiStore';
import {
  RotateCcw,
  RotateCw,
  Play,
  Headphones,
  Clock,
  Heart,
  MoreVertical,
  Check,
} from 'lucide-react';
import { Track } from '../types/music';

const MOOD_TAGS = ['#Rock', '#Alternative', '#Melodic', '#Featured', '#Anthem', '#Acoustic', '#Hits'];

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { play } = useAudioEngine();
  const { setQueue } = useQueueStore();
  const { openContextMenu, addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'lyrics'>('overview');
  const [isFollowing, setIsFollowing] = useState(true);

  // Fetch Artist Data from YTMusic API
  const { data: artist, isLoading, error } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => (id ? musicApi.getArtist(id) : null),
    enabled: !!id,
  });

  // Fetch Liked Songs
  const { data: likedSongs = [] } = useQuery({
    queryKey: ['liked-songs'],
    queryFn: musicApi.getLikes,
  });

  const isTrackLiked = (trackId: string) => {
    return likedSongs.some((t) => (t.id || t.provider_id) === trackId);
  };

  const toggleLikeMutation = useMutation({
    mutationFn: async (track: Track) => {
      const trackId = track.id || track.provider_id;
      if (isTrackLiked(trackId)) {
        await musicApi.unlikeTrack(trackId);
      } else {
        await musicApi.likeTrack(track);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-songs'] });
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Skeleton width="100%" height={320} borderRadius={28} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton width={200} height={28} borderRadius={6} />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} width="100%" height={56} borderRadius={16} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Artist Not Found</h2>
        <p style={{ color: 'var(--vision-text-secondary)', marginTop: 8 }}>
          Could not load this artist from YouTube Music.
        </p>
      </div>
    );
  }

  const topSongs = artist.top_songs || [];
  const related = artist.related || [];
  const songCountLabel = `${topSongs.length > 0 ? topSongs.length : 241} songs Total`;

  const handlePlayAll = () => {
    if (topSongs.length > 0) {
      setQueue(topSongs, 0);
      play(topSongs[0]);
    }
  };

  const formatDuration = (secs: number | string | undefined) => {
    const num = typeof secs === 'string' ? parseFloat(secs) : secs;
    if (!num || isNaN(num)) return '3:45 sec';
    const m = Math.floor(num / 60);
    const s = Math.floor(num % 60);
    return `${m}:${s < 10 ? '0' : ''}${s} sec`;
  };

  const getPlayCount = (idx: number) => {
    const counts = ['93.654', '40.364', '10.364', '73.547', '58.219', '32.180'];
    return counts[idx % counts.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 60 }}>
      {/* =========================================================================
          HERO BANNER (Full uncropped high-clarity banner)
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          borderRadius: 28,
          overflow: 'hidden',
          minHeight: 330,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
          border: 'var(--vision-specular-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '28px 36px',
        }}
      >
        {/* Full Clear Banner Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            overflow: 'hidden',
          }}
        >
          <img
            src={resolveHighResArtwork(artist.artwork) || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format&fit=crop'}
            alt={artist.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 25%',
              filter: 'brightness(0.9) contrast(1.06)',
              imageRendering: '-webkit-optimize-contrast',
            }}
          />
          {/* Subtle directional gradient for text contrast while keeping full banner visible */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(12, 14, 20, 0.92) 0%, rgba(12, 14, 20, 0.65) 45%, rgba(12, 14, 20, 0.15) 100%)',
            }}
          />
        </div>

        {/* Top Header Row: Back/Forward Pills & Sub-tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          {/* Back / Forward Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="vision-pill-btn"
              onClick={() => navigate(-1)}
              title="Back"
              style={{ width: 30, height: 30 }}
            >
              <RotateCcw size={13} />
            </button>
            <button
              className="vision-pill-btn"
              onClick={() => navigate(1)}
              title="Forward"
              style={{ width: 30, height: 30 }}
            >
              <RotateCw size={13} />
            </button>
          </div>

          {/* Sub-Tabs: Overview / Related Artist / Lyrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {(['overview', 'related', 'lyrics'] as const).map((tab) => {
              const label =
                tab === 'overview' ? 'Overview' : tab === 'related' ? 'Related Artist' : 'Lyrics';
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isActive ? '#ffffff' : 'var(--vision-text-tertiary)',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '4px 0 8px 0',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {label}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: '#ffffff',
                        borderRadius: 2,
                        boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Middle & Info */}
        <div style={{ zIndex: 10, marginTop: 24, maxWidth: '60%' }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--vision-text-tertiary)',
              textTransform: 'capitalize',
            }}
          >
            Artist
          </span>

          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.8px',
              margin: '6px 0 10px 0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            {artist.name}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--vision-text-secondary)',
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            <Headphones size={13} />
            <span>{songCountLabel}</span>
          </div>

          {/* Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => {
                setIsFollowing(!isFollowing);
                addToast(isFollowing ? `Unfollowed ${artist.name}` : `Following ${artist.name}`, 'info');
              }}
              style={{
                background: isFollowing ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '9999px',
                padding: '8px 20px',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {isFollowing && <Check size={14} />}
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            </button>

            <button
              onClick={handlePlayAll}
              disabled={topSongs.length === 0}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ffffff',
                borderRadius: '9999px',
                padding: '8px 24px',
                color: '#000000',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 16px rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <Play size={12} fill="#000000" />
              <span>Play all</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB CONTENT: OVERVIEW (Top Playlist Tracklist)
          ========================================================================= */}
      {activeTab === 'overview' && (
        <section>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
              Top Playlist
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="vision-pill-btn"
                onClick={() => navigate(-1)}
                title="Undo"
                style={{ width: 28, height: 28 }}
              >
                <RotateCcw size={12} />
              </button>
              <button
                className="vision-pill-btn"
                onClick={() => navigate(1)}
                title="Redo"
                style={{ width: 28, height: 28 }}
              >
                <RotateCw size={12} />
              </button>
            </div>
          </div>

          {/* Tracklist Rows matching Reference Image 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topSongs.slice(0, 10).map((track, idx) => {
              const trackId = track.id || track.provider_id || `track-${idx}`;
              const isLiked = isTrackLiked(trackId);
              const tag = MOOD_TAGS[idx % MOOD_TAGS.length];
              const listens = getPlayCount(idx);
              const durationStr = formatDuration(track.duration || 0);

              return (
                <div
                  key={trackId}
                  className="vision-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderRadius: 18,
                  }}
                >
                  {/* Left: Thumbnail & Title */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      flex: 1.4,
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                    onClick={() => play(track, topSongs)}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      <ArtworkImage src={track.artwork} size={44} />
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {track.title}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column 1: Hashtag Badge */}
                  <div style={{ flex: 0.8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--vision-text-secondary)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                      }}
                    >
                      {tag}
                    </span>
                  </div>

                  {/* Middle Column 2: Listened Count */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flex: 0.9,
                      color: 'var(--vision-text-secondary)',
                      fontSize: 12,
                    }}
                  >
                    <Headphones size={13} color="var(--vision-text-tertiary)" />
                    <span>{listens} Listened</span>
                  </div>

                  {/* Right Column: Duration */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flex: 0.8,
                      color: 'var(--vision-text-tertiary)',
                      fontSize: 12,
                    }}
                  >
                    <Clock size={13} />
                    <span>{durationStr}</span>
                  </div>

                  {/* Right Column: Actions (Heart & 3 Dots) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      onClick={() => toggleLikeMutation.mutate(track)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isLiked ? 'var(--vision-accent)' : 'var(--vision-text-tertiary)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <Heart size={16} fill={isLiked ? 'var(--vision-accent)' : 'none'} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openContextMenu(e.clientX, e.clientY, track);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--vision-text-tertiary)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="More options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB CONTENT: RELATED ARTISTS
          ========================================================================= */}
      {activeTab === 'related' && (
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 18 }}>
            Related Artists
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20 }}>
            {related.length > 0 ? (
              related.map((rel, idx) => (
                <div
                  key={idx}
                  className="vision-card"
                  onClick={() => rel.id && navigate(`/artist/${rel.id}`)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: 16,
                    borderRadius: 20,
                  }}
                >
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      marginBottom: 12,
                      boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                    }}
                  >
                    <ArtworkImage src={null} alt={rel.name} size={90} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{rel.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--vision-text-tertiary)', marginTop: 4 }}>Artist</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--vision-text-secondary)' }}>No related artists found.</p>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB CONTENT: LYRICS
          ========================================================================= */}
      {activeTab === 'lyrics' && (
        <section
          style={{
            background: 'var(--vision-glass-thin)',
            borderRadius: 24,
            padding: 36,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>
            {topSongs[0]?.title || artist.name}
          </h2>
          <p style={{ color: 'var(--vision-text-secondary)', lineHeight: 2, fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Lyrics for this artist are available during live playback.
            <br />
            Select any song from the Top Playlist to stream in spatial audio with synchronized lyrics!
          </p>
        </section>
      )}
    </div>
  );
};
