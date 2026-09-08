import React from 'react';
import { useAudioEngine } from '../features/player/useAudioEngine';
import { useQueueStore } from '../stores/queueStore';
import { useUIStore } from '../stores/uiStore';
import { musicApi } from '../services/api';
import { Heart, Play, Flame, Waves, Coffee, Moon, Zap } from 'lucide-react';

export const RadioPage: React.FC = () => {
  const { play } = useAudioEngine();
  const { setQueue } = useQueueStore();
  const { addToast } = useUIStore();

  const curatedStations = [
    {
      title: 'Today’s Hits Radio',
      subtitle: 'Non-stop top trending tracks and worldwide smash hits',
      seed: 'J7p4bzqLvCw', // Blinding Lights
      gradient: 'linear-gradient(135deg, #fa233b 0%, #a81c2d 100%)',
      icon: <Flame size={28} color="#ffffff" />,
    },
    {
      title: 'Deep Chill & Ambient',
      subtitle: 'Mellow rhythms, lo-fi beats, and relaxing soundscapes',
      seed: '5qap5aO4i9A', // Lofi hip hop
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
      icon: <Waves size={28} color="#ffffff" />,
    },
    {
      title: 'Night Shift Synthwave',
      subtitle: 'Retro neon synths, dark electro and midnight drive vibes',
      seed: '4xDzrJKXOOY', // Synthwave
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)',
      icon: <Moon size={28} color="#ffffff" />,
    },
    {
      title: 'Morning Acoustic & Coffee',
      subtitle: 'Warm acoustics, indie folk, and gentle vocals to start the day',
      seed: '0yW7w8F2TVA', // Acoustic
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      icon: <Coffee size={28} color="#ffffff" />,
    },
    {
      title: 'High Voltage Workout',
      subtitle: 'High-energy electronic, rap anthems, and adrenaline beats',
      seed: 'hT_nvWreIhg', // Counting Stars / Upbeat
      gradient: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
      icon: <Zap size={28} color="#ffffff" />,
    },
    {
      title: 'R&B / Soul Session',
      subtitle: 'Smooth vocal harmonies, neo-soul rhythms, and emotional ballads',
      seed: '3JZ_D3ELwOQ', // R&B
      gradient: 'linear-gradient(135deg, #ec4899 0%, #9d174d 100%)',
      icon: <Heart size={28} color="#ffffff" />,
    },
  ];

  const handleStartStation = async (station: typeof curatedStations[0]) => {
    addToast(`Tuning into ${station.title}...`, 'info');
    try {
      const res = await musicApi.getRadioStation(station.seed);
      if (res.tracks && res.tracks.length > 0) {
        setQueue(res.tracks, 0);
        play(res.tracks[0]);
        addToast(`Now playing ${station.title}`, 'success');
      } else {
        addToast('Station currently unavailable', 'error');
      }
    } catch {
      addToast('Error tuning into station', 'error');
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div style={{ padding: '24px 32px 8px 32px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px' }}>Chong Radio</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Continuous music stations personalized to your vibe. Pick a station to start endless streaming.
        </p>
      </div>

      {/* Featured Stations Grid */}
      <section className="section-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {curatedStations.map((station, idx) => (
            <div
              key={idx}
              onClick={() => handleStartStation(station)}
              style={{
                borderRadius: 'var(--radius-lg)',
                background: station.gradient,
                padding: '24px',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              {/* Header icon and badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {station.icon}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
                </div>
              </div>

              {/* Station Info */}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                  {station.title}
                </h3>
                <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.4 }}>
                  {station.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
