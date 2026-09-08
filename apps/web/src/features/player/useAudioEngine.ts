import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useQueueStore } from '../../stores/queueStore';
import { useUIStore } from '../../stores/uiStore';
import { audioEngine } from './AudioEngine';
import { audioAnalyzer } from '../visualizer/AudioAnalyzer';
import { extractDominantColor } from '../../utils/colorExtractor';
import { Track } from '../../types/music';

export function useAudioEngine() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isFullPlayerOpen,
    isLyricsOpen,
    isQueueOpen,
    isSpatialAudio,
    accentColor,
    cycleRepeatMode,
    toggleShuffle,
    toggleSpatialAudio,
    setAccentColor,
    setFullPlayerOpen,
    toggleFullPlayer,
    toggleLyrics,
    toggleQueue
  } = usePlayerStore();

  const { queue, currentIndex, playTrack: setQueueTrack, nextTrack, previousTrack, shuffleQueue } = useQueueStore();

  // Play a specific track and set queue context
  const play = useCallback((track: Track, contextTracks?: Track[]) => {
    setQueueTrack(track, contextTracks);
    audioEngine.playTrack(track);
  }, [setQueueTrack]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!currentTrack) {
      if (queue.length > 0) {
        play(queue[0]);
      }
      return;
    }
    audioEngine.toggle();
  }, [currentTrack, queue, play]);

  // Next Track
  const handleNext = useCallback(() => {
    const next = nextTrack();
    if (next) {
      audioEngine.playTrack(next);
    }
  }, [nextTrack]);

  // Previous Track
  const handlePrevious = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }
    const prev = previousTrack();
    if (prev) {
      audioEngine.playTrack(prev);
    } else {
      audioEngine.seek(0);
    }
  }, [currentTime, previousTrack]);

  // Seek
  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
  }, []);

  // Volume
  const changeVolume = useCallback((val: number) => {
    audioEngine.setVolume(val);
  }, []);

  // Restore persisted track and check authentication session on mount
  useEffect(() => {
    const savedTrack = usePlayerStore.getState().currentTrack;
    const savedTime = usePlayerStore.getState().currentTime;
    if (savedTrack) {
      audioEngine.preloadRestoredTrack(savedTrack, savedTime);
    }
  }, []);

  // Sync Spatial Audio Concert DSP
  useEffect(() => {
    audioAnalyzer.setSpatialAudio(isSpatialAudio);
  }, [isSpatialAudio]);

  // Extract vibrant dominant color from current track artwork
  useEffect(() => {
    if (currentTrack?.artwork) {
      extractDominantColor(currentTrack.artwork).then((color) => {
        setAccentColor(color);
        document.documentElement.style.setProperty('--vision-accent', color);
      });
    } else {
      setAccentColor('#fa233b');
      document.documentElement.style.setProperty('--vision-accent', '#fa233b');
    }
  }, [currentTrack?.artwork, setAccentColor]);

  // Sync mute
  useEffect(() => {
    audioEngine.setMuted(isMuted);
  }, [isMuted]);

  // Sync shuffle
  const handleToggleShuffle = useCallback(() => {
    toggleShuffle();
    shuffleQueue(!isShuffled);
  }, [toggleShuffle, shuffleQueue, isShuffled]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.05));
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          handleNext();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          handlePrevious();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          usePlayerStore.getState().toggleMute();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          toggleLyrics();
          break;
        case 'q':
        case 'Q':
          e.preventDefault();
          toggleQueue();
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          useUIStore.getState().toggleEqualizer();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullPlayer();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFullPlayerOpen) setFullPlayerOpen(false);
          if (useUIStore.getState().isEqualizerOpen) useUIStore.getState().setEqualizerOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    seek,
    currentTime,
    volume,
    changeVolume,
    handleNext,
    handlePrevious,
    toggleFullPlayer,
    toggleLyrics,
    toggleQueue,
    isFullPlayerOpen,
    setFullPlayerOpen
  ]);

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    queue,
    currentIndex,
    isFullPlayerOpen,
    isLyricsOpen,
    isQueueOpen,
    play,
    togglePlay,
    handleNext,
    handlePrevious,
    seek,
    changeVolume,
    isSpatialAudio,
    accentColor,
    toggleSpatialAudio,
    cycleRepeatMode,
    handleToggleShuffle,
    toggleFullPlayer,
    toggleLyrics,
    toggleQueue
  };
}
