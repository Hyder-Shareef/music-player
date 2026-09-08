import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioAnalyzer } from './AudioAnalyzer';
import { usePlayerStore } from '../../stores/playerStore';
import { useUIStore } from '../../stores/uiStore';
import {
  Headphones,
  Sliders,
  Maximize2,
  Sparkles,
  X,
} from 'lucide-react';

export const CornerOrbWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPlaying, currentTrack, isSpatialAudio, toggleSpatialAudio, accentColor, setFullPlayerOpen } = usePlayerStore();
  const { toggleEqualizer } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const accentColorRef = useRef(accentColor);
  useEffect(() => {
    accentColorRef.current = accentColor || '#fa233b';
  }, [accentColor]);

  // Three.js Interactive 3D Mini Orb Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let material: THREE.PointsMaterial | null = null;
    let texture: THREE.CanvasTexture | null = null;
    let animationFrameId: number = 0;
    let handleMouseMove: ((e: MouseEvent) => void) | null = null;

    try {
      const width = 56;
      const height = 56;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      camera.position.z = 48;

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

    // Particle Sphere Geometry
    const particleCount = 1200;
    const sphereRadius = 16;
    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    let currentBaseColor = new THREE.Color(accentColorRef.current);
    const highlightColor = new THREE.Color('#ffffff');

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      const pColor = currentBaseColor.clone().lerp(highlightColor, Math.random() * 0.4);
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    texture = new THREE.CanvasTexture(canvas);

    material = new THREE.PointsMaterial({
      size: 1.6,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const spherePoints = new THREE.Points(geometry, material);
    scene.add(spherePoints);

    // Mouse parallax for the orb
    let mouseX = 0;
    let mouseY = 0;
    handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      if (Math.abs(x) < 120 && Math.abs(y) < 120) {
        mouseX = x * 0.08;
        mouseY = -y * 0.08;
      } else {
        mouseX = 0;
        mouseY = 0;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!geometry) return;

      audioAnalyzer.update(isPlaying);
      const bass = audioAnalyzer.bass;
      const energy = audioAnalyzer.energy;

      time += 0.015 + (isPlaying ? energy * 0.03 : 0.005);

      // Color transition
      const targetColor = new THREE.Color(accentColorRef.current);
      if (!currentBaseColor.equals(targetColor)) {
        currentBaseColor.lerp(targetColor, 0.08);
        const colAttr = geometry.attributes.color as THREE.BufferAttribute;
        const colArray = colAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const ratio = (positions[i * 3 + 1] + sphereRadius) / (sphereRadius * 2);
          const pColor = currentBaseColor.clone().lerp(highlightColor, ratio * 0.35);
          colArray[i * 3] = pColor.r;
          colArray[i * 3 + 1] = pColor.g;
          colArray[i * 3 + 2] = pColor.b;
        }
        colAttr.needsUpdate = true;
      }

      spherePoints.rotation.y = time * 0.45;
      spherePoints.rotation.x = Math.sin(time * 0.3) * 0.25;

      camera.position.x += (mouseX - camera.position.x) * 0.1;
      camera.position.y += (mouseY - camera.position.y) * 0.1;
      camera.lookAt(scene.position);

      // Audio vertex displacement
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const scaleBase = 1 + (isPlaying ? bass * 0.22 : 0);

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        const wave = Math.sin(ox * 0.2 + time * 3) * Math.cos(oy * 0.2 + time * 2);
        const s = scaleBase + (isPlaying ? wave * 0.12 : wave * 0.04);

        posArray[i * 3] = ox * s;
        posArray[i * 3 + 1] = oy * s;
        posArray[i * 3 + 2] = oz * s;
      }
      posAttr.needsUpdate = true;

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();
    } catch (err) {
      console.warn('WebGL 3D Orb visualizer initialization warning:', err);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove);
      try {
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        if (geometry) geometry.dispose();
        if (material) material.dispose();
        if (texture) texture.dispose();
        if (renderer) renderer.dispose();
      } catch {}
    };
  }, [isPlaying]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 24,
        zIndex: 85,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* Expanded Quick Spatial Glass Popover */}
      {isExpanded && (
        <div
          style={{
            marginBottom: 12,
            width: 260,
            background: 'rgba(18, 20, 28, 0.75)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 24,
            padding: '16px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: 'visionFadeSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="var(--vision-accent)" />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.2px' }}>
                3D Spatial Concert Orb
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--vision-text-tertiary)',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--vision-text-secondary)', lineHeight: 1.4 }}>
            {currentTrack
              ? `Interactive acoustic orb reacting live to "${currentTrack.title}"`
              : 'Interactive acoustic orb vibrating to live stereo frequencies.'}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Spatial Audio Toggle */}
            <button
              onClick={toggleSpatialAudio}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 12,
                background: isSpatialAudio ? 'rgba(250, 35, 59, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: isSpatialAudio ? '1px solid var(--vision-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Headphones size={14} color={isSpatialAudio ? 'var(--vision-accent)' : 'inherit'} />
                <span>3D Spatial Hall</span>
              </div>
              <span style={{ fontSize: 10, color: isSpatialAudio ? 'var(--vision-accent)' : 'var(--vision-text-tertiary)' }}>
                {isSpatialAudio ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Open Equalizer */}
            <button
              onClick={() => {
                setIsExpanded(false);
                toggleEqualizer();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sliders size={14} />
              <span>Pro Equalizer &amp; DSP</span>
            </button>

            {/* Visualizer Fullscreen */}
            <button
              onClick={() => {
                setIsExpanded(false);
                setFullPlayerOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Maximize2 size={14} />
              <span>Fullscreen Visualizer</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating 3D Orb Icon Trigger Button */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'rgba(16, 18, 26, 0.65)',
          backdropFilter: 'blur(25px) saturate(200%)',
          WebkitBackdropFilter: 'blur(25px) saturate(200%)',
          border: '1.5px solid rgba(255, 255, 255, 0.28)',
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 0 16px ${accentColor || '#fa233b'}66`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
          transform: isHovered ? 'scale(1.12)' : 'scale(1)',
        }}
        title="3D Spatial Audio Orb (Interactive)"
      >
        {/* Real-time 3D Three.js canvas container */}
        <div
          ref={containerRef}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient Pulsing Aura */}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: `1px solid ${accentColor || '#fa233b'}88`,
              animation: 'spin 12s linear infinite',
              pointerEvents: 'none',
              opacity: 0.6,
            }}
          />
        )}
      </div>
    </div>
  );
};
