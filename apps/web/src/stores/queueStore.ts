import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '../types/music';

interface QueueState {
  queue: Track[];
  originalQueue: Track[];
  history: Track[];
  currentIndex: number;

  // Actions
  setQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track, contextTracks?: Track[]) => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  nextTrack: () => Track | null;
  previousTrack: () => Track | null;
  shuffleQueue: (enable: boolean) => void;
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      originalQueue: [],
      history: [],
      currentIndex: -1,

      setQueue: (tracks, startIndex = 0) => {
        set({
          queue: tracks,
          originalQueue: tracks,
          currentIndex: startIndex,
        });
      },

      playTrack: (track, contextTracks) => {
        const list = contextTracks && contextTracks.length > 0 ? contextTracks : [track];
        const index = list.findIndex((t) => (t.id || t.provider_id) === (track.id || track.provider_id));
        set({
          queue: list,
          originalQueue: list,
          currentIndex: index >= 0 ? index : 0,
        });
      },

      playNext: (track) => {
        const { queue, currentIndex } = get();
        const newQueue = [...queue];
        newQueue.splice(currentIndex + 1, 0, track);
        set({ queue: newQueue });
      },

      addToQueue: (track) => {
        const { queue } = get();
        set({ queue: [...queue, track] });
      },

      removeFromQueue: (index) => {
        const { queue, currentIndex } = get();
        const newQueue = queue.filter((_, idx) => idx !== index);
        let newIndex = currentIndex;
        if (index < currentIndex) {
          newIndex = Math.max(0, currentIndex - 1);
        } else if (index === currentIndex && newIndex >= newQueue.length) {
          newIndex = newQueue.length - 1;
        }
        set({ queue: newQueue, currentIndex: newIndex });
      },

      clearQueue: () => {
        const { queue, currentIndex } = get();
        const current = queue[currentIndex];
        set({
          queue: current ? [current] : [],
          originalQueue: current ? [current] : [],
          currentIndex: current ? 0 : -1,
        });
      },

      reorderQueue: (startIndex, endIndex) => {
        const { queue, currentIndex } = get();
        const newQueue = [...queue];
        const [removed] = newQueue.splice(startIndex, 1);
        newQueue.splice(endIndex, 0, removed);

        let newCurrent = currentIndex;
        if (currentIndex === startIndex) {
          newCurrent = endIndex;
        } else if (startIndex < currentIndex && endIndex >= currentIndex) {
          newCurrent = currentIndex - 1;
        } else if (startIndex > currentIndex && endIndex <= currentIndex) {
          newCurrent = currentIndex + 1;
        }

        set({ queue: newQueue, currentIndex: newCurrent });
      },

      nextTrack: () => {
        const { queue, currentIndex, history } = get();
        if (queue.length === 0) return null;
        
        if (currentIndex >= 0 && queue[currentIndex]) {
          set({ history: [queue[currentIndex], ...history].slice(0, 50) });
        }

        if (currentIndex + 1 < queue.length) {
          const nextIndex = currentIndex + 1;
          set({ currentIndex: nextIndex });
          return queue[nextIndex];
        }
        return null;
      },

      previousTrack: () => {
        const { queue, currentIndex } = get();
        if (currentIndex > 0 && queue.length > 0) {
          const prevIndex = currentIndex - 1;
          set({ currentIndex: prevIndex });
          return queue[prevIndex];
        }
        return null;
      },

      shuffleQueue: (enable) => {
        const { queue, originalQueue, currentIndex } = get();
        if (!enable) {
          const current = queue[currentIndex];
          const origIndex = current
            ? originalQueue.findIndex((t) => (t.id || t.provider_id) === (current.id || current.provider_id))
            : 0;
          set({ queue: originalQueue, currentIndex: Math.max(0, origIndex) });
        } else {
          if (queue.length <= 1) return;
          const current = queue[currentIndex];
          const remaining = queue.filter((_, idx) => idx !== currentIndex);
          
          // Fisher-Yates shuffle
          for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
          }

          set({
            queue: current ? [current, ...remaining] : remaining,
            currentIndex: 0,
          });
        }
      },
    }),
    {
      name: 'chong_queue_state',
    }
  )
);
