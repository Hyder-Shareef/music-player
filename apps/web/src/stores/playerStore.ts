import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '../types/music';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  
  // UI Panels
  isFullPlayerOpen: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;

  // Audio Quality & Spatial Concert Mode
  isSpatialAudio: boolean;
  accentColor: string;

  // Actions
  toggleSpatialAudio: () => void;
  setAccentColor: (color: string) => void;
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  toggleShuffle: () => void;
  
  setFullPlayerOpen: (open: boolean) => void;
  toggleFullPlayer: () => void;
  setLyricsOpen: (open: boolean) => void;
  toggleLyrics: () => void;
  setQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      isBuffering: false,
      currentTime: 0,
      duration: 0,
      volume: 0.85,
      isMuted: false,
      repeatMode: 'off',
      isShuffled: false,
      
      isFullPlayerOpen: false,
      isLyricsOpen: false,
      isQueueOpen: false,

      isSpatialAudio: true, // Default ON for 3D spatial experience
      accentColor: '#fa233b',

      toggleSpatialAudio: () => {
        const next = !get().isSpatialAudio;
        set({ isSpatialAudio: next });
      },
      setAccentColor: (color) => set({ accentColor: color }),

      setCurrentTrack: (track) => set({ currentTrack: track, currentTime: 0, duration: 0 }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsBuffering: (buffering) => set({ isBuffering: buffering }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => {
        set({ volume, isMuted: volume === 0 });
      },
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setRepeatMode: (mode) => {
        set({ repeatMode: mode });
      },
      cycleRepeatMode: () => {
        const modes: RepeatMode[] = ['off', 'all', 'one'];
        const current = get().repeatMode;
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        set({ repeatMode: next });
      },
      toggleShuffle: () => {
        const next = !get().isShuffled;
        set({ isShuffled: next });
      },

      setFullPlayerOpen: (open) => set({ isFullPlayerOpen: open }),
      toggleFullPlayer: () => set((state) => ({ isFullPlayerOpen: !state.isFullPlayerOpen })),
      setLyricsOpen: (open) => set({ isLyricsOpen: open }),
      toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen })),
      setQueueOpen: (open) => set({ isQueueOpen: open }),
      toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
    }),
    {
      name: 'chong_player_state',
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        currentTime: state.currentTime,
        duration: state.duration,
        volume: state.volume,
        repeatMode: state.repeatMode,
        isShuffled: state.isShuffled,
        isSpatialAudio: state.isSpatialAudio,
        accentColor: state.accentColor,
      }),
    }
  )
);
