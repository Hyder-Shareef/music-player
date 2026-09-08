import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../services/api';
import { TrackRow } from '../components/common/TrackRow';
import { MediaCard } from '../components/common/MediaCard';
import { Skeleton } from '../components/common/Skeleton';
import { ArtworkImage } from '../components/common/ArtworkImage';
import { useAudioEngine } from '../features/player/useAudioEngine';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [filter, setFilter] = useState<string>('all');

  const { play } = useAudioEngine();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['search', query, filter],
    queryFn: () => (query.trim() ? musicApi.search(query.trim(), filter === 'all' ? undefined : filter) : null),
    enabled: !!query.trim(),
  });

  const topResult = data?.top_result;
  const songs = data?.songs || [];
  const artists = data?.artists || [];
  const albums = data?.albums || [];
  const playlists = data?.playlists || [];

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Category Filter Pills Header */}
      <div style={{ padding: '16px 20px 12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {query && (
          <div style={{ fontSize: 13, color: 'var(--vision-text-tertiary)', marginBottom: 12, fontWeight: 500 }}>
            Results for <span style={{ color: '#ffffff', fontWeight: 600 }}>&ldquo;{query}&rdquo;</span>
          </div>
        )}

        {/* Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {['all', 'songs', 'artists', 'albums', 'playlists'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                backgroundColor: filter === f ? 'rgba(255, 255, 255, 0.95)' : 'var(--vision-glass-control)',
                color: filter === f ? '#000000' : 'var(--vision-text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content Results */}
      {!query.trim() ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-tertiary)' }}>
          <Search size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Find Your Favorite Music</h3>
          <p style={{ fontSize: 14, maxWidth: 400, margin: '8px auto 0 auto' }}>
            Search millions of songs, albums, and artists on YouTube Music.
          </p>
        </div>
      ) : isLoading ? (
        <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Skeleton width={240} height={32} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} width="100%" height={160} borderRadius={10} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Top Result & Top Songs Grid */}
          {filter === 'all' && (
            <section className="section-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {/* Apple Music Top Result Card */}
              {topResult && (
                <div>
                  <h2 className="section-title" style={{ marginBottom: 16 }}>Top Result</h2>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 20,
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                    }}
                    onClick={() => {
                      if (topResult.type === 'song') play(topResult.item);
                      else if (topResult.type === 'artist') navigate(`/artist/${topResult.item.id}`);
                      else if (topResult.type === 'album') navigate(`/album/${topResult.item.id}`);
                      else if (topResult.type === 'playlist') navigate(`/playlist/${topResult.item.id}`);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <ArtworkImage
                      src={topResult.item.artwork}
                      alt={topResult.item.title || topResult.item.name}
                      size={96}
                      style={{ borderRadius: topResult.type === 'artist' ? '50%' : 'var(--radius-md)' }}
                    />
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: 0.5 }}>
                        {topResult.type}
                      </span>
                      <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                        {topResult.item.title || topResult.item.name}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {topResult.item.artists?.map((a: any) => a.name).join(', ') || topResult.item.description || ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Songs Section */}
              {songs.length > 0 && (
                <div style={{ flex: 1 }}>
                  <h2 className="section-title" style={{ marginBottom: 16 }}>Songs</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {songs.slice(0, 5).map((track, idx) => (
                      <TrackRow key={`${track.id || track.provider_id}_${idx}`} track={track} index={idx} contextTracks={songs} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Dedicated Songs view */}
          {(filter === 'songs' || (filter === 'all' && songs.length > 5)) && (
            <section className="section-container">
              {filter !== 'all' && <h2 className="section-title" style={{ marginBottom: 16 }}>All Songs</h2>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(filter === 'songs' ? songs : songs.slice(5)).map((track, idx) => (
                  <TrackRow key={`${track.id || track.provider_id}_${idx}`} track={track} index={idx} contextTracks={songs} />
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {artists.length > 0 && (filter === 'all' || filter === 'artists') && (
            <section className="section-container">
              <h2 className="section-title" style={{ marginBottom: 16 }}>Artists</h2>
              <div className="cards-grid">
                {artists.map((artist) => (
                  <MediaCard key={artist.id} id={artist.id} title={artist.name} subtitle="Artist" artwork={artist.artwork} type="artist" isCircle />
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {albums.length > 0 && (filter === 'all' || filter === 'albums') && (
            <section className="section-container">
              <h2 className="section-title" style={{ marginBottom: 16 }}>Albums</h2>
              <div className="cards-grid">
                {albums.map((album) => (
                  <MediaCard
                    key={album.id}
                    id={album.id}
                    title={album.title}
                    subtitle={album.artists.map((a) => a.name).join(', ') || album.year || 'Album'}
                    artwork={album.artwork}
                    type="album"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {playlists.length > 0 && (filter === 'all' || filter === 'playlists') && (
            <section className="section-container">
              <h2 className="section-title" style={{ marginBottom: 16 }}>Playlists</h2>
              <div className="cards-grid">
                {playlists.map((pl) => (
                  <MediaCard key={pl.id} id={pl.id} title={pl.title} subtitle={pl.author || 'Playlist'} artwork={pl.artwork} type="playlist" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
