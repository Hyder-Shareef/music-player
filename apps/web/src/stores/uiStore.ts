import { create } from 'zustand';
import { Track } from '../types/music';

export interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
}

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  track: Track | null;
}

interface UIState {
  isCommandPaletteOpen: boolean;
  isCreatePlaylistModalOpen: boolean;
  isAddToPlaylistModalOpen: boolean;
  isEqualizerOpen: boolean;
  selectedTrackForPlaylist: Track | null;
  toasts: Toast[];
  contextMenu: ContextMenuState;

  // Actions
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCreatePlaylistModalOpen: (open: boolean) => void;
  setEqualizerOpen: (open: boolean) => void;
  toggleEqualizer: () => void;
  openAddToPlaylistModal: (track: Track) => void;
  closeAddToPlaylistModal: () => void;
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  removeToast: (id: string) => void;
  openContextMenu: (x: number, y: number, track: Track) => void;
  closeContextMenu: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCommandPaletteOpen: false,
  isCreatePlaylistModalOpen: false,
  isAddToPlaylistModalOpen: false,
  isEqualizerOpen: false,
  selectedTrackForPlaylist: null,
  toasts: [],
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    track: null,
  },

  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCreatePlaylistModalOpen: (open) => set({ isCreatePlaylistModalOpen: open }),
  setEqualizerOpen: (open) => set({ isEqualizerOpen: open }),
  toggleEqualizer: () => set((state) => ({ isEqualizerOpen: !state.isEqualizerOpen })),
  
  openAddToPlaylistModal: (track) => set({
    isAddToPlaylistModalOpen: true,
    selectedTrackForPlaylist: track,
  }),
  closeAddToPlaylistModal: () => set({
    isAddToPlaylistModalOpen: false,
    selectedTrackForPlaylist: null,
  }),

  addToast: (message, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: Toast = { id, message, type };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  openContextMenu: (x, y, track) => {
    set({
      contextMenu: {
        isOpen: true,
        x: Math.min(x, window.innerWidth - 220),
        y: Math.min(y, window.innerHeight - 260),
        track,
      },
    });
  },

  closeContextMenu: () => {
    set((state) => ({
      contextMenu: { ...state.contextMenu, isOpen: false, track: null },
    }));
  },
}));
