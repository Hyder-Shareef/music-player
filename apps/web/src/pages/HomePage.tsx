import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { musicApi } from '../services/api';
import { Skeleton } from '../components/common/Skeleton';
import { ArtworkImage } from '../components/common/ArtworkImage';
import { useAudioEngine } from '../features/player/useAudioEngine';
import {
  RotateCcw,
  RotateCw,
  Headphones,
  Play,
  Heart,
} from 'lucide-react';
import { Track } from '../types/music';

// Curated default spatial artists matching Reference Image 1
const DEFAULT_FOLLOWING_ARTISTS = [
  {
    id: 'UCbGXBFWlbl2la_Ldhg2snsQ', // Travis Scott
    name: 'Travis Scott',
    songs: '241 songs',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'UC0WP5P-ufpRfjbNrmOWwLBQ', // The Weeknd
    name: 'The Weeknd',
    songs: '185 songs',
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'UChfqye5m6n_fR2yRkXwZ0-w', // Linkin Park
    name: 'Linkin Park',
    songs: '147 songs',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'UCByOQJnPmaRxAl7QWYuc4aQ', // Metro Boomin
    name: 'Metro Boomin',
    songs: '94 songs',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'UCmeJbcFYFwviA_bK0EgW5sw', // Daft Punk
    name: 'Daft Punk',
    songs: '112 songs',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'UGtN6oP41L9_q7W1_91pEyw', // Drake
    name: 'Drake',
    songs: '320 songs',
    artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=300&auto=format&fit=crop',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { play } = useAudioEngine();

  // 1. Fetch live YTMusic Home Feed
  const { data: shelves = [], isLoading } = useQuery({
    queryKey: ['home-feed'],
    queryFn: musicApi.getHome,
    staleTime: 1000 * 60 * 15,
  });

  // 2. Fetch Liked Songs for the heart state
  const { data: likedSongs = [] } = useQuery({
    queryKey: ['liked-songs'],
    queryFn: musicApi.getLikes,
  });

  // 3. Fetch Play History for "Continue Playing"
  const { data: playHistory = [] } = useQuery({
    queryKey: ['play-history'],
    queryFn: musicApi.getHistory,
  });

  const isTrackLiked = (trackId: string) => {
    return likedSongs.some((t) => (t.id || t.provider_id) === trackId);
  };

  // Like Mutation
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

  // Flatten top recommendations from shelves or fallback
  const firstShelf = shelves[0];
  const recommendationItems = firstShelf?.contents.slice(0, 6) || [];

  // Continue playing tracks (from history or first shelf)
  const continuePlayingTracks: Track[] = playHistory.length > 0
    ? playHistory.slice(0, 2)
    : (recommendationItems
        .filter((item) => item.type === 'track')
        .slice(0, 2)
        .map((item) => item.data as Track) as Track[]);

  // Fallback track if empty
  const defaultContinueTracks: Track[] = continuePlayingTracks.length > 0
    ? continuePlayingTracks
    : [
        {
          id: 'she-will-be-loved',
          provider_id: 'she-will-be-loved',
          title: 'She Will Be Loved',
          artists: [{ id: 'maroon-5', name: 'Maroon 5' }],
          artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop',
          duration: 257,
        } as unknown as Track,
      ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={240} height={32} borderRadius={8} />
          <Skeleton width={70} height={28} borderRadius={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton width="100%" height={170} borderRadius={18} />
              <Skeleton width="80%" height={16} borderRadius={4} />
              <Skeleton width="50%" height={12} borderRadius={4} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingBottom: 60 }}>
      {/* =========================================================================
          SECTION 1: TOP RECOMMENDATION (Reference Image 1)
          ========================================================================= */}
      <section>
        {/* Section Header with VisionOS Undo/Redo Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.4px',
              color: '#ffffff',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Top Recommendation
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="vision-pill-btn"
              onClick={() => navigate(-1)}
              title="Previous"
              style={{ width: 28, height: 28 }}
            >
              <RotateCcw size={12} />
            </button>
            <button
              className="vision-pill-btn"
              onClick={() => navigate(1)}
              title="Next"
              style={{ width: 28, height: 28 }}
            >
              <RotateCw size={12} />
            </button>
          </div>
        </div>

        {/* Top Recommendation Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: 20,
          }}
        >
          {recommendationItems.length > 0
            ? recommendationItems.map((item, idx) => {
                const data = item.data;
                const title = data.title || data.name;
                const rawArtists = data.artists?.map((a: any) => (typeof a === 'string' ? a : a.name)).filter((n: string) => n && n !== 'Unknown Artist') || [];
                const subtitle = rawArtists.length > 0
                  ? rawArtists.join(', ')
                  : data.author || data.artist || (item.type === 'album' ? 'Album' : item.type === 'artist' ? 'Artist' : item.type === 'playlist' ? 'Playlist' : 'Single');
                const artwork = data.artwork;

                return (
                  <div
                    key={idx}
                    className="vision-card"
                    onClick={() => {
                      if (item.type === 'track') {
                        play(
                          data,
                          recommendationItems.filter((c) => c.type === 'track').map((c) => c.data)
                        );
                      } else if (item.type === 'album') {
                        navigate(`/album/${data.id}`);
                      } else if (item.type === 'artist') {
                        navigate(`/artist/${data.id}`);
                      } else if (item.type === 'playlist') {
                        navigate(`/playlist/${data.id}`);
                      }
                    }}
                    style={{
                      borderRadius: 22,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: 16,
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                      }}
                    >
                      <ArtworkImage src={artwork} alt={title} className="w-full h-full object-cover" />
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
                        {title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--vision-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 3,
                        }}
                      >
                        {subtitle}
                      </div>
                    </div>
                  </div>
                );
              })
            : /* Fallback Curated Recommendations */
              [
                { title: 'Take Care of You', artist: 'Adina Thembi', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop' },
                { title: 'Risk It All', artist: 'Alex Brown', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop' },
                { title: 'The Weekend', artist: 'Starboy', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop' },
                { title: 'Girl Band', artist: 'Bonum Vol', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop' },
                { title: 'The Ophelia', artist: 'Composed Excels', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&auto=format&fit=crop' },
                { title: 'Jontha Ben', artist: 'Volume Down', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop' },
              ].map((c, i) => (
                <div
                  key={i}
                  className="vision-card"
                  style={{
                    borderRadius: 22,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(c.title)}`)}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: 16,
                      overflow: 'hidden',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                    }}
                  >
                    <ArtworkImage src={c.img} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--vision-text-secondary)', marginTop: 3 }}>{c.artist}</div>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: FOLLOWING ARTISTS & CONTINUE PLAYING (Reference Image 1)
          ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.1fr)',
          gap: 36,
        }}
      >
        {/* Left Column: Following Artists */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
              Following Artists
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 20,
              overflowX: 'auto',
              paddingBottom: 8,
            }}
          >
            {DEFAULT_FOLLOWING_ARTISTS.map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  minWidth: 88,
                  textAlign: 'center',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/* Circular Avatar */}
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '1.5px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    marginBottom: 10,
                  }}
                >
                  <ArtworkImage src={artist.artwork} alt={artist.name} size={76} />
                </div>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 90,
                  }}
                >
                  {artist.name}
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--vision-text-tertiary)',
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  <Headphones size={11} />
                  <span>{artist.songs}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Continue Playing */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
              Continue Playing
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {defaultContinueTracks.map((track, idx) => {
              const trackId = track.id || track.provider_id || `track-${idx}`;
              const isLiked = isTrackLiked(trackId);

              return (
                <div
                  key={trackId}
                  className="vision-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 18,
                  }}
                >
                  {/* Left: Thumbnail and Track Info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      overflow: 'hidden',
                      flex: 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => play(track, defaultContinueTracks)}
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
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {track.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--vision-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 2,
                        }}
                      >
                        {track.artists?.map((a) => a.name).join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Right: Play Pill Badge & Heart Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Play Badge Pill (▶ 120k) */}
                    <button
                      onClick={() => play(track, defaultContinueTracks)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.18)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '9999px',
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Play size={10} fill="#ffffff" />
                      <span>120k</span>
                    </button>

                    {/* Heart Button */}
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
                        transition: 'transform 0.2s ease',
                      }}
                      title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={15} fill={isLiked ? 'var(--vision-accent)' : 'none'} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* =========================================================================
          SECTION 3: REMAINING CURATED SHELVES (Trending, Quick Picks, etc.)
          ========================================================================= */}
      {shelves.slice(1).map((shelf, sIdx) => {
        if (!shelf.contents || shelf.contents.length === 0) return null;

        return (
          <section key={sIdx}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                {shelf.title}
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: 20,
              }}
            >
              {shelf.contents.slice(0, 6).map((item, idx) => {
                const data = item.data;
                const title = data.title || data.name;
                const subtitle = data.artists?.map((a: any) => a.name).join(', ') || data.author || '';

                return (
                  <div
                    key={idx}
                    className="vision-card"
                    onClick={() => {
                      if (item.type === 'track') {
                        play(data, shelf.contents.filter((c) => c.type === 'track').map((c) => c.data));
                      } else if (item.type === 'album') {
                        navigate(`/album/${data.id}`);
                      } else if (item.type === 'artist') {
                        navigate(`/artist/${data.id}`);
                      } else if (item.type === 'playlist') {
                        navigate(`/playlist/${data.id}`);
                      }
                    }}
                    style={{
                      borderRadius: 22,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                      }}
                    >
                      <ArtworkImage src={data.artwork} alt={title} className="w-full h-full object-cover" />
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
                        {title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--vision-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 3,
                        }}
                      >
                        {subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
