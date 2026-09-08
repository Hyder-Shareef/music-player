import { Track } from '../../types/music';
import { usePlayerStore } from '../../stores/playerStore';
import { useQueueStore } from '../../stores/queueStore';
import { musicApi } from '../../services/api';
import { audioAnalyzer } from '../visualizer/AudioAnalyzer';

class AudioEngine {
  private static instance: AudioEngine;
  private audio: HTMLAudioElement;
  private historyRecorded: boolean = false;
  private retryCount: number = 0;

  private constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';
    const initVol = usePlayerStore.getState().volume;
    this.audio.volume = typeof initVol === 'number' && initVol > 0 ? initVol : 0.85;
    (window as any).__chongAudioElement = this.audio;
    this.setupListeners();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private setupListeners() {
    this.audio.addEventListener('play', () => {
      usePlayerStore.getState().setIsPlaying(true);
      usePlayerStore.getState().setIsLoading(false);
      this.updateMediaSessionPlaybackState('playing');
    });

    this.audio.addEventListener('pause', () => {
      usePlayerStore.getState().setIsPlaying(false);
      this.updateMediaSessionPlaybackState('paused');
    });

    this.audio.addEventListener('waiting', () => {
      usePlayerStore.getState().setIsBuffering(true);
    });

    this.audio.addEventListener('canplay', () => {
      usePlayerStore.getState().setIsBuffering(false);
      usePlayerStore.getState().setIsLoading(false);
    });

    this.audio.addEventListener('playing', () => {
      usePlayerStore.getState().setIsBuffering(false);
      usePlayerStore.getState().setIsLoading(false);
    });

    this.audio.addEventListener('timeupdate', () => {
      const current = this.audio.currentTime;
      usePlayerStore.getState().setCurrentTime(current);

      // Record play history after 25s of listening
      const track = usePlayerStore.getState().currentTrack;
      if (track && current >= 25 && !this.historyRecorded) {
        this.historyRecorded = true;
        musicApi.recordHistory(track, Math.floor(current));
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      usePlayerStore.getState().setDuration(this.audio.duration || 0);
      usePlayerStore.getState().setIsLoading(false);
    });

    this.audio.addEventListener('ended', async () => {
      const { repeatMode } = usePlayerStore.getState();
      const track = usePlayerStore.getState().currentTrack;

      if (repeatMode === 'one' && track) {
        this.audio.currentTime = 0;
        this.audio.play().catch(console.error);
        return;
      }

      // Next track in queue
      const next = useQueueStore.getState().nextTrack();
      if (next) {
        this.playTrack(next);
        return;
      }

      if (repeatMode === 'all') {
        const queue = useQueueStore.getState().queue;
        if (queue.length > 0) {
          useQueueStore.getState().setQueue(queue, 0);
          this.playTrack(queue[0]);
          return;
        }
      }

      // Unlimited Continuous Autoplay: Fetch similar music so playback never stops
      if (track) {
        try {
          const trackId = track.id || track.provider_id;
          const radioStation = await musicApi.getRadioStation(trackId);
          if (radioStation && radioStation.tracks && radioStation.tracks.length > 0) {
            const newTracks = radioStation.tracks.filter(
              (t) => (t.id || t.provider_id) !== trackId
            );
            if (newTracks.length > 0) {
              const currentQ = useQueueStore.getState().queue;
              const updatedQ = [...currentQ, ...newTracks];
              useQueueStore.getState().setQueue(updatedQ, currentQ.length);
              this.playTrack(newTracks[0]);
              return;
            }
          }
        } catch (radioErr) {
          console.warn('Continuous autoplay discovery fallback:', radioErr);
        }
      }

      usePlayerStore.getState().setIsPlaying(false);
    });

    this.audio.addEventListener('error', async (e: Event) => {
      console.warn('Audio playback error encountered, attempting direct fallback...', e);
      usePlayerStore.getState().setIsLoading(false);
      usePlayerStore.getState().setIsBuffering(false);
      
      const track = usePlayerStore.getState().currentTrack;
      if (track && this.retryCount < 2) {
        this.retryCount++;
        try {
          // Attempt direct stream URL fallback
          const infoRes = await fetch(`/api/v1/playback/info/${track.id || track.provider_id}`);
          if (infoRes.ok) {
            const info = await infoRes.json();
            if (info.stream_url && info.stream_url !== this.audio.src) {
              this.audio.src = info.stream_url;
              await this.audio.play();
              return;
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback playback error:', fallbackErr);
        }
      }

      // If retry fails, automatically advance to next song so music never stalls
      const next = useQueueStore.getState().nextTrack();
      if (next) {
        this.playTrack(next);
      }
    });
  }

  private isFading: boolean = false;
  private currentVolume: number = 0.85;

  public isFadingVolume(): boolean {
    return this.isFading;
  }

  private async fadeVolume(to: number, durationMs: number): Promise<void> {
    const from = this.audio.volume;
    if (Math.abs(from - to) < 0.01 || durationMs <= 0) {
      this.audio.volume = Math.max(0, Math.min(1, to));
      return;
    }

    this.isFading = true;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Smooth sine/cosine easing curve for audio transition
        const eased = Math.sin((progress * Math.PI) / 2);
        const nextVal = from + (to - from) * eased;
        this.audio.volume = Math.max(0, Math.min(1, nextVal));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          this.audio.volume = Math.max(0, Math.min(1, to));
          this.isFading = false;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  public async playTrack(track: Track, withTransition: boolean = true) {
    const trackId = track.id || track.provider_id;
    this.historyRecorded = false;
    this.retryCount = 0;

    const userVol = usePlayerStore.getState().volume;
    this.currentVolume = typeof userVol === 'number' && userVol > 0 ? userVol : 0.85;

    // Spotify Premium Smooth Fade-out of current playing track
    if (withTransition && !this.audio.paused && this.audio.currentTime > 0) {
      await this.fadeVolume(0, 180);
    }

    usePlayerStore.getState().setCurrentTrack(track);
    usePlayerStore.getState().setIsLoading(true);
    usePlayerStore.getState().setCurrentTime(0);

    const streamUrl = musicApi.getStreamUrl(trackId);
    this.audio.src = streamUrl;
    this.audio.load();

    // Start incoming track at volume 0 if transitioning, then smoothly ramp up
    if (withTransition) {
      this.audio.volume = 0;
    } else {
      this.audio.volume = this.currentVolume;
    }

    try {
      audioAnalyzer.connect(this.audio);
      audioAnalyzer.resume();
      await this.audio.play();
      this.updateMediaSession(track);

      // Spotify Premium Smooth Fade-in
      if (withTransition) {
        await this.fadeVolume(this.currentVolume, 260);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Playback play() call resolution:', err);
      }
    }
  }

  public preloadRestoredTrack(track: Track, initialTime: number = 0) {
    if (!this.audio.src || this.audio.src === '' || this.audio.src === window.location.href) {
      const trackId = track.id || track.provider_id;
      this.audio.src = musicApi.getStreamUrl(trackId);
      this.audio.load();
      if (initialTime > 0) {
        this.audio.currentTime = initialTime;
      }
      this.updateMediaSession(track);
    }
  }

  public async pause() {
    if (!this.audio.paused) {
      await this.fadeVolume(0, 150);
      this.audio.pause();
      this.audio.volume = this.currentVolume;
    }
  }

  public async resume() {
    const currentTrack = usePlayerStore.getState().currentTrack;
    if ((!this.audio.src || this.audio.src === '' || this.audio.src === window.location.href) && currentTrack) {
      await this.playTrack(currentTrack, false);
      return;
    }
    audioAnalyzer.resume();
    this.audio.volume = 0;
    this.audio.play().catch(console.error);
    await this.fadeVolume(this.currentVolume, 200);
  }

  public toggle() {
    if (this.audio.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public seek(seconds: number) {
    if (isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || 0));
      usePlayerStore.getState().setCurrentTime(this.audio.currentTime);
    }
  }

  public setVolume(val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    this.audio.volume = clamped;
    usePlayerStore.getState().setVolume(clamped);
  }

  public setMuted(muted: boolean) {
    this.audio.muted = muted;
  }

  private updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      const artistNames = track.artists.map((a) => a.name).join(', ');
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: artistNames,
        album: track.album?.title || 'Chong Music',
        artwork: track.artwork
          ? [
              { src: track.artwork, sizes: '96x96', type: 'image/jpeg' },
              { src: track.artwork, sizes: '256x256', type: 'image/jpeg' },
              { src: track.artwork, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', () => this.resume());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const next = useQueueStore.getState().nextTrack();
        if (next) this.playTrack(next);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prev = useQueueStore.getState().previousTrack();
        if (prev) this.playTrack(prev);
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
    }
  }

  private updateMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none') {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
