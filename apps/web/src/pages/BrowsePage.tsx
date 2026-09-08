import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../services/api';
import { TrackRow } from '../components/common/TrackRow';
import { MediaCard } from '../components/common/MediaCard';
import { Skeleton } from '../components/common/Skeleton';
import { VinylGenreCard, GenreItem } from '../components/common/VinylGenreCard';
import { Trophy, Globe2, Disc3 } from 'lucide-react';

const CURATED_GENRES: GenreItem[] = [
  {
    id: 'hip-hop-rb',
    title: 'Hip-Hop & R&B',
    subtitle: 'Trap, Soul, Urban Grooves',
    color: '#f59e0b',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    searchQuery: 'Hip Hop and R&B Hits',
  },
  {
    id: 'pop-hits',
    title: 'Pop Hits',
    subtitle: 'Top 40 & Chart Toppers',
    color: '#ec4899',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    searchQuery: 'Global Pop Hits',
  },
  {
    id: 'chill-lofi',
    title: 'Chill & Lofi',
    subtitle: 'Mellow Beats & Study Session',
    color: '#38bdf8',
    artwork: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop',
    searchQuery: 'Lofi Chill Beats',
  },
  {
    id: 'electronic-dance',
    title: 'Electronic / Dance',
    subtitle: 'House, Techno, EDM, Synth',
    color: '#a855f7',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
    searchQuery: 'Electronic Dance EDM',
  },
  {
    id: 'rock-alternative',
    title: 'Rock & Alternative',
    subtitle: 'Modern & Classic Guitar Anthems',
    color: '#ef4444',
    artwork: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop',
    searchQuery: 'Rock and Alternative Classics',
  },
  {
    id: 'focus-ambient',
    title: 'Focus & Ambient',
    subtitle: 'Deep Concentration Soundscapes',
    color: '#10b981',
    artwork: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
    searchQuery: 'Ambient Focus Deep Work',
  },
  {
    id: 'workout-fitness',
    title: 'Workout & Fitness',
    subtitle: 'High Energy Motivation Beats',
    color: '#f97316',
    artwork: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
    searchQuery: 'Workout Gym High Energy',
  },
  {
    id: 'indie-folk',
    title: 'Indie & Acoustic',
    subtitle: 'Warm Coffeehouse & Folk Vibe',
    color: '#14b8a6',
    artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=600&auto=format&fit=crop',
    searchQuery: 'Indie Folk Acoustic',
  },
];

export const BrowsePage: React.FC = () => {
  const [country, setCountry] = useState('US');

  const { data: charts, isLoading: isChartsLoading } = useQuery({
    queryKey: ['charts', country],
    queryFn: () => musicApi.getCharts(country),
  });

  const songs = charts?.songs || [];
  const artists = charts?.artists || [];

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Hero Header */}
      <div style={{ padding: '24px 32px 12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px', color: '#ffffff' }}>Browse &amp; Charts</h1>
          <p style={{ color: 'var(--vision-text-secondary)', fontSize: 14, marginTop: 4 }}>
            Explore global music charts, top artists, and curated physical vinyl genres.
          </p>
        </div>

        {/* Country Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)' }}>
          <Globe2 size={16} color="var(--vision-accent)" />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="US" style={{ background: '#1c1c1e' }}>United States</option>
            <option value="GB" style={{ background: '#1c1c1e' }}>United Kingdom</option>
            <option value="CA" style={{ background: '#1c1c1e' }}>Canada</option>
            <option value="AU" style={{ background: '#1c1c1e' }}>Australia</option>
            <option value="JP" style={{ background: '#1c1c1e' }}>Japan</option>
            <option value="KR" style={{ background: '#1c1c1e' }}>South Korea</option>
            <option value="IN" style={{ background: '#1c1c1e' }}>India</option>
            <option value="DE" style={{ background: '#1c1c1e' }}>Germany</option>
            <option value="FR" style={{ background: '#1c1c1e' }}>France</option>
            <option value="BR" style={{ background: '#1c1c1e' }}>Brazil</option>
          </select>
        </div>
      </div>

      {/* Moods & Genres — Realistic Vinyl Records */}
      <section className="section-container" style={{ marginTop: 12 }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Disc3 size={22} color="var(--vision-accent)" />
          <h2 className="section-title" style={{ margin: 0 }}>Moods &amp; Genres Vinyl Collection</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 24,
          }}
        >
          {CURATED_GENRES.map((genre) => (
            <VinylGenreCard key={genre.id} genre={genre} />
          ))}
        </div>
      </section>

      {/* Top 10 Chart Tracks */}
      <section className="section-container" style={{ marginTop: 32 }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Trophy size={20} color="var(--vision-accent)" />
          <h2 className="section-title" style={{ margin: 0 }}>Top Charting Songs</h2>
        </div>

        {isChartsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} width="100%" height={56} borderRadius={14} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {songs.slice(0, 10).map((track: any, idx: number) => (
              <TrackRow
                key={`${track.id || track.provider_id}_${idx}`}
                track={track}
                index={idx}
                contextTracks={songs}
              />
            ))}
          </div>
        )}
      </section>

      {/* Top Trending Artists */}
      {artists.length > 0 && (
        <section className="section-container" style={{ marginTop: 32 }}>
          <div className="section-header" style={{ marginBottom: 18 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Trending Artists</h2>
          </div>
          <div className="cards-grid">
            {artists.slice(0, 6).map((artist: any, idx: number) => (
              <MediaCard
                key={idx}
                id={artist.id}
                title={artist.name}
                subtitle="Artist"
                artwork={artist.artwork}
                type="artist"
                isCircle
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
