import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioAnalyzer } from './AudioAnalyzer';
import { usePlayerStore } from '../../stores/playerStore';

interface WaveSphereVisualizerProps {
  opacity?: number;
  interactive?: boolean;
  accentColor?: string;
  className?: string;
}

export const WaveSphereVisualizer: React.FC<WaveSphereVisualizerProps> = ({
  opacity = 0.85,
  interactive = true,
  accentColor = '#fa233b',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPlaying } = usePlayerStore();
  const accentColorRef = useRef(accentColor);

  useEffect(() => {
    accentColorRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 75;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Primary Wave Sphere Geometry
    const particleCount = 4500;
    const sphereRadius = 24;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    let currentBaseColor = new THREE.Color(accentColorRef.current);
    const highlightColor = new THREE.Color('#ffffff');

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
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

      const pColor = currentBaseColor.clone().lerp(highlightColor, Math.random() * 0.3);
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle sprite texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.3, 'rgba(255,255,255,0.7)');
      gradient.addColorStop(0.8, 'rgba(255,255,255,0.15)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.4,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const spherePoints = new THREE.Points(geometry, material);
    scene.add(spherePoints);

    // 3. Subtle Ambient Orbital Dust Rings
    const dustCount = 600;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const dist = 32 + Math.random() * 24;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 16;
      dustPositions[i * 3] = Math.cos(angle) * dist;
      dustPositions[i * 3 + 1] = y;
      dustPositions[i * 3 + 2] = Math.sin(angle) * dist;

      dustColors[i * 3] = 1;
      dustColors[i * 3 + 1] = 1;
      dustColors[i * 3 + 2] = 1;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.9,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: opacity * 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // 4. Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) * 0.015;
      mouseY = -(e.clientY - windowHalfY) * 0.015;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 5. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 6. 60 FPS Audio-Reactive Animation Loop
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Fetch smoothed audio reactivity from AudioAnalyzer
      audioAnalyzer.update(isPlaying);
      const bass = audioAnalyzer.bass;
      const mid = audioAnalyzer.mid;
      const treble = audioAnalyzer.treble;
      const energy = audioAnalyzer.energy;

      time += prefersReducedMotion ? 0.004 : (0.01 + energy * 0.03);

      // Smooth color transition to match track banner
      const targetColor = new THREE.Color(accentColorRef.current);
      if (!currentBaseColor.equals(targetColor)) {
        currentBaseColor.lerp(targetColor, 0.06);
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

      // Smooth camera interpolation
      targetCameraX += (mouseX - targetCameraX) * 0.05;
      targetCameraY += (mouseY - targetCameraY) * 0.05;
      camera.position.x = targetCameraX;
      camera.position.y = targetCameraY;
      camera.lookAt(scene.position);

      // Sphere rotation
      spherePoints.rotation.y = time * 0.35;
      spherePoints.rotation.x = Math.sin(time * 0.25) * 0.2;
      dustPoints.rotation.y = -time * 0.15;

      // Displace vertices based on live audio frequencies
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      const bassDisplacement = bass * 8.5;
      const midWave = (0.5 + mid * 2.4);
      const trebleShimmer = treble * 1.6;

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        // Organic procedural 3D noise deformation
        const noiseFactor = Math.sin(ox * 0.15 + time * 2) *
                            Math.cos(oy * 0.18 + time * 1.5) *
                            Math.sin(oz * 0.15 + time);

        const currentScale = 1 + (bassDisplacement * 0.04) + (noiseFactor * 0.16 * midWave) + (Math.sin(time * 3 + i) * 0.035 * trebleShimmer);

        posArray[i * 3] = ox * currentScale;
        posArray[i * 3 + 1] = oy * currentScale;
        posArray[i * 3 + 2] = oz * currentScale;
      }
      posAttr.needsUpdate = true;

      // Breathing particle scale
      material.size = 1.3 + bass * 1.4;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [opacity, interactive]);

  return (
    <div
      ref={containerRef}
      className={`wave-sphere-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    />
  );
};
