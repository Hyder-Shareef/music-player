import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  RotateCcw,
  Activity,
  BarChart2,
  Disc,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import {
  audioAnalyzer,
  EQ_FREQUENCIES,
  EQ_PRESETS,
} from '../visualizer/AudioAnalyzer';
import { usePlayerStore } from '../../stores/playerStore';

export const EqualizerModal: React.FC = () => {
  const { isEqualizerOpen, setEqualizerOpen } = useUIStore();
  const { isPlaying, accentColor } = usePlayerStore();

  const [selectedPreset, setSelectedPreset] = useState<string>('Flat');
  const [bands, setBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [preamp, setPreamp] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [visMode, setVisMode] = useState<'bars' | 'oscilloscope' | 'circular'>('bars');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync initial state from AudioAnalyzer
  useEffect(() => {
    if (isEqualizerOpen) {
      setBands([...audioAnalyzer.currentEqGains]);
      setPreamp(audioAnalyzer.currentPreamp);
      setBalance(audioAnalyzer.currentPan);
    }
  }, [isEqualizerOpen]);

  // Handle Band Gain Change
  const handleBandChange = (index: number, val: number) => {
    const newBands = [...bands];
    newBands[index] = val;
    setBands(newBands);
    setSelectedPreset('Custom');
    audioAnalyzer.setEqualizerBand(index, val);
  };

  // Handle Preamp Change
  const handlePreampChange = (val: number) => {
    setPreamp(val);
    audioAnalyzer.setPreamp(val);
  };

  // Handle Balance Change
  const handleBalanceChange = (val: number) => {
    setBalance(val);
    audioAnalyzer.setStereoBalance(val);
  };

  // Handle Preset Select
  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const presetGains = EQ_PRESETS[presetName];
    if (presetGains) {
      setBands([...presetGains]);
      audioAnalyzer.setEqualizerPreset(presetName);
    }
  };

  // Reset EQ
  const handleReset = () => {
    handleSelectPreset('Flat');
    handlePreampChange(0);
    handleBalanceChange(0);
    handlePlaybackRate(1.0);
  };

  // Playback Rate
  const handlePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    const audioEl = (window as any).__chongAudioElement as HTMLAudioElement;
    if (audioEl) {
      audioEl.playbackRate = rate;
    }
  };

  // Peak fall-off caps state for spectrum visualizer
  const peakCapsRef = useRef<number[]>(new Array(32).fill(0));
  const peakDecayRef = useRef<number[]>(new Array(32).fill(0));

  // Live Canvas Visualizer Loop
  useEffect(() => {
    if (!isEqualizerOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const freqData = new Uint8Array(64);
    const timeData = new Uint8Array(256);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      audioAnalyzer.getByteFrequencyData(freqData);
      audioAnalyzer.getByteTimeDomainData(timeData);

      if (visMode === 'bars') {
        const numBars = 32;
        const barWidth = (width / numBars) - 2;
        const barGap = 2;

        for (let i = 0; i < numBars; i++) {
          const rawVal = freqData[Math.floor((i / numBars) * 32)] || 0;
          const barHeight = isPlaying ? Math.max(3, (rawVal / 255) * (height - 8)) : 3;

          // Peak fall-off logic
          if (barHeight >= peakCapsRef.current[i]) {
            peakCapsRef.current[i] = barHeight;
            peakDecayRef.current[i] = 0;
          } else {
            peakDecayRef.current[i] += 0.35;
            peakCapsRef.current[i] = Math.max(0, peakCapsRef.current[i] - peakDecayRef.current[i]);
          }

          const x = i * (barWidth + barGap) + 1;
          const y = height - barHeight;

          // Vibrant Glass gradient
          const grad = ctx.createLinearGradient(0, height, 0, 0);
          grad.addColorStop(0, accentColor || '#fa233b');
          grad.addColorStop(0.5, '#f59e0b');
          grad.addColorStop(1.0, '#38bdf8');

          ctx.fillStyle = grad;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          } else {
            ctx.rect(x, y, barWidth, barHeight);
          }
          ctx.fill();

          // Peak cap
          const capY = height - peakCapsRef.current[i] - 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, Math.max(0, capY), barWidth, 2);
        }
      } else if (visMode === 'oscilloscope') {
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = accentColor || '#fa233b';
        ctx.shadowColor = accentColor ? `${accentColor}aa` : 'rgba(250, 35, 59, 0.7)';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = isPlaying ? timeData[i] / 128.0 : 1.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visMode === 'circular') {
        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = 26;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const points = 48;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const val = isPlaying ? freqData[i % 24] / 255.0 : 0.05;
          const r = baseRadius + val * 22;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isEqualizerOpen, visMode, isPlaying, accentColor]);

  if (!isEqualizerOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={() => setEqualizerOpen(false)}
    >
      {/* VisionOS Translucent Glassmorphism Equalizer Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          background: 'rgba(18, 20, 28, 0.72)',
          backdropFilter: 'blur(50px) saturate(210%)',
          WebkitBackdropFilter: 'blur(50px) saturate(210%)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          borderRadius: 32,
          boxShadow: '0 30px 100px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.05)',
          padding: '26px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          color: '#ffffff',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'visionFadeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--vision-accent)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.4)',
              }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
                  10-Band Graphic Pro Equalizer
                </h2>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  3D DSP
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--vision-text-secondary)', margin: '2px 0 0 0' }}>
                Studio Sound DSP &amp; Stereo Acoustic Profiling
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleReset}
              className="vision-pill-btn"
              style={{ width: 34, height: 34 }}
              title="Reset EQ to Flat"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setEqualizerOpen(false)}
              className="vision-pill-btn"
              style={{ width: 34, height: 34 }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Real-time Translucent Glass Visualizer Strip */}
        <div
          style={{
            background: 'rgba(12, 14, 20, 0.65)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <canvas
              ref={canvasRef}
              width={360}
              height={72}
              style={{ width: '100%', height: 72, borderRadius: 10 }}
            />
          </div>

          {/* Visualizer Mode Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => setVisMode('bars')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 10,
                background: visMode === 'bars' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                border: visMode === 'bars' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                color: visMode === 'bars' ? '#ffffff' : 'var(--vision-text-tertiary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <BarChart2 size={12} />
              <span>Spectrum</span>
            </button>
            <button
              onClick={() => setVisMode('oscilloscope')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 10,
                background: visMode === 'oscilloscope' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                border: visMode === 'oscilloscope' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                color: visMode === 'oscilloscope' ? '#ffffff' : 'var(--vision-text-tertiary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Activity size={12} />
              <span>Waveform</span>
            </button>
            <button
              onClick={() => setVisMode('circular')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 10,
                background: visMode === 'circular' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                border: visMode === 'circular' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                color: visMode === 'circular' ? '#ffffff' : 'var(--vision-text-tertiary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Disc size={12} />
              <span>Concentric</span>
            </button>
          </div>
        </div>

        {/* Preset Selector Badges */}
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', letterSpacing: 0.6, display: 'block', marginBottom: 8 }}>
            Acoustic Presets ({selectedPreset})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.keys(EQ_PRESETS).map((p) => {
              const isActive = selectedPreset === p;
              return (
                <button
                  key={p}
                  onClick={() => handleSelectPreset(p)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    background: isActive ? 'var(--vision-accent)' : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 14px rgba(250, 35, 59, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* 10-Band Graphic Glass Slider Deck */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            padding: '18px 16px 12px 16px',
            background: 'rgba(12, 14, 20, 0.55)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRadius: 24,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Preamp Slider Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingRight: 12, borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--vision-accent)' }}>
              {preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)}
            </span>
            <input
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={preamp}
              onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
              style={{
                writingMode: 'bt-lr' as any,
                WebkitAppearance: 'slider-vertical',
                width: 8,
                height: 125,
                cursor: 'pointer',
                accentColor: 'var(--vision-accent)',
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--vision-accent)', textTransform: 'uppercase' }}>
              Preamp
            </span>
          </div>

          {/* 10 EQ Frequency Bands */}
          {EQ_FREQUENCIES.map((freq, idx) => {
            const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
            const gain = bands[idx] || 0;
            return (
              <div
                key={freq}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: gain !== 0 ? '#38bdf8' : 'var(--vision-text-tertiary)',
                  }}
                >
                  {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                </span>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={gain}
                  onChange={(e) => handleBandChange(idx, parseFloat(e.target.value))}
                  style={{
                    writingMode: 'bt-lr' as any,
                    WebkitAppearance: 'slider-vertical',
                    width: 6,
                    height: 125,
                    cursor: 'pointer',
                    accentColor: '#38bdf8',
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--vision-text-secondary)' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stereo Balance & Playback Rate Footer Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
          {/* Stereo Balance Pan */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', letterSpacing: 0.5 }}>
                Stereo Balance
              </span>
              <span style={{ fontSize: 11, color: '#ffffff', fontWeight: 600 }}>
                {balance === 0 ? 'Center' : balance < 0 ? `L ${(Math.abs(balance) * 100).toFixed(0)}%` : `R ${(balance * 100).toFixed(0)}%`}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={balance}
              onChange={(e) => handleBalanceChange(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#38bdf8',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--vision-text-tertiary)', marginTop: 2 }}>
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
          </div>

          {/* Playback Speed */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--vision-text-tertiary)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
              Playback Speed ({playbackRate}x)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRate(rate)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 10,
                    background: playbackRate === rate ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                    border: playbackRate === rate ? '1px solid var(--vision-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: playbackRate === rate ? '#ffffff' : 'var(--vision-text-secondary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
