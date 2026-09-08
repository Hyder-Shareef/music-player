// AudioAnalyzer & 3D Spatial Concert & Winamp 10-Band Graphic Equalizer Engine
// High-fidelity Web Audio API DSP pipeline

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6.0, 5.0, 3.8, 2.0, 0.5, 0, 0, 0.5, 1.2, 1.8],
  'Rock': [4.5, 3.0, -1.0, -2.0, -0.5, 1.5, 3.0, 4.0, 4.5, 5.0],
  'Pop': [-1.0, 1.5, 3.0, 3.5, 2.0, -1.0, -1.5, 0.5, 2.5, 3.5],
  'Classical': [4.0, 3.0, 2.5, 2.0, -1.5, -1.5, 0, 2.0, 3.0, 3.5],
  'Electronic': [4.5, 4.0, 1.5, 0, -1.5, 2.0, 1.0, 1.5, 4.0, 4.5],
  'Hip Hop': [5.5, 4.8, 2.5, 1.0, -0.5, -0.5, 1.0, -0.5, 2.2, 3.2],
  'Vocal Booster': [-2.0, -2.5, 0, 2.5, 4.5, 4.0, 3.0, 1.5, 0, -1.0],
  'Acoustic': [3.0, 2.5, 1.5, 0.5, 1.0, 1.5, 2.5, 3.0, 3.5, 2.5],
  'Jazz': [3.5, 2.5, 1.0, 1.5, -1.5, -1.5, 0, 1.5, 3.0, 3.5],
};

class AudioAnalyzer {
  private static instance: AudioAnalyzer;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isConnected: boolean = false;

  // 10-Band Graphic Equalizer Nodes
  private eqFilters: BiquadFilterNode[] = [];
  private preampGain: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;

  // DSP Nodes for Maximized Audio Quality & 3D Spatial Concert
  private compressor: DynamicsCompressorNode | null = null;
  private wetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private spatialDelayL: DelayNode | null = null;
  private spatialDelayR: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private reverbFilter: BiquadFilterNode | null = null;

  // Smoothed frequency bands for 3D Wave Visualizer
  public bass: number = 0;
  public mid: number = 0;
  public treble: number = 0;
  public volume: number = 0;
  public energy: number = 0;

  private isSpatialAudioEnabled: boolean = true;
  public currentEqGains: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  public currentPreamp: number = 0;
  public currentPan: number = 0;

  private constructor() {}

  public static getInstance(): AudioAnalyzer {
    if (!AudioAnalyzer.instance) {
      AudioAnalyzer.instance = new AudioAnalyzer();
    }
    return AudioAnalyzer.instance;
  }

  public connect(audioElement: HTMLAudioElement) {
    if (this.isConnected) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();

      // 1. Frequency & Waveform Analyser
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.82;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // 2. Preamp Gain Node
      this.preampGain = this.audioCtx.createGain();
      this.preampGain.gain.value = Math.pow(10, this.currentPreamp / 20);

      // 3. 10-Band Graphic Equalizer Filters (Peaking / Shelf)
      this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = this.currentEqGains[idx] || 0;
        return filter;
      });

      // 4. Stereo Balance Panner
      if (this.audioCtx.createStereoPanner) {
        this.pannerNode = this.audioCtx.createStereoPanner();
        this.pannerNode.pan.value = this.currentPan;
      }

      // 5. Studio Mastering Dynamic Compressor
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = -10;
      this.compressor.knee.value = 8;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.22;

      // 6. 3D Spatial Concert Hall Acoustic Simulation
      this.dryGain = this.audioCtx.createGain();
      this.dryGain.gain.value = 1.0;

      this.wetGain = this.audioCtx.createGain();
      this.wetGain.gain.value = this.isSpatialAudioEnabled ? 0.35 : 0.0;

      this.spatialDelayL = this.audioCtx.createDelay(0.1);
      this.spatialDelayL.delayTime.value = 0.026;

      this.spatialDelayR = this.audioCtx.createDelay(0.1);
      this.spatialDelayR.delayTime.value = 0.038;

      this.feedbackGain = this.audioCtx.createGain();
      this.feedbackGain.gain.value = 0.25;

      this.reverbFilter = this.audioCtx.createBiquadFilter();
      this.reverbFilter.type = 'lowpass';
      this.reverbFilter.frequency.value = 3400;

      // Wire media element source
      this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);

      // Connect Chain: Source -> Preamp -> EQ Filter Chain
      let lastNode: AudioNode = this.sourceNode;
      lastNode.connect(this.preampGain);
      lastNode = this.preampGain;

      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      // EQ chain -> Analyser
      lastNode.connect(this.analyser);
      lastNode = this.analyser;

      // Analyser -> Balance Panner (if supported)
      if (this.pannerNode) {
        lastNode.connect(this.pannerNode);
        lastNode = this.pannerNode;
      }

      // Dry path -> DryGain -> Compressor
      lastNode.connect(this.dryGain);
      this.dryGain.connect(this.compressor);

      // Spatial path -> Delays -> Reverb -> WetGain -> Compressor
      lastNode.connect(this.spatialDelayL);
      lastNode.connect(this.spatialDelayR);

      this.spatialDelayL.connect(this.reverbFilter);
      this.spatialDelayR.connect(this.reverbFilter);

      this.reverbFilter.connect(this.feedbackGain);
      this.feedbackGain.connect(this.spatialDelayL);

      this.reverbFilter.connect(this.wetGain);
      this.wetGain.connect(this.compressor);

      // Compressor -> Destination
      this.compressor.connect(this.audioCtx.destination);

      this.isConnected = true;
    } catch (e) {
      console.warn('AudioAnalyzer Web Audio connection info:', e);
    }
  }

  public setEqualizerBand(index: number, gainDb: number) {
    this.currentEqGains[index] = gainDb;
    if (this.eqFilters[index] && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.eqFilters[index].gain.cancelScheduledValues(now);
      this.eqFilters[index].gain.linearRampToValueAtTime(gainDb, now + 0.05);
    }
  }

  public setEqualizerPreset(presetName: string) {
    const preset = EQ_PRESETS[presetName];
    if (preset) {
      this.setEqualizerBands([...preset]);
    }
  }

  public setEqualizerBands(gainsDb: number[]) {
    this.currentEqGains = [...gainsDb];
    gainsDb.forEach((gain, idx) => {
      this.setEqualizerBand(idx, gain);
    });
  }

  public setPreamp(gainDb: number) {
    this.currentPreamp = gainDb;
    if (this.preampGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      const linearGain = Math.pow(10, gainDb / 20);
      this.preampGain.gain.cancelScheduledValues(now);
      this.preampGain.gain.linearRampToValueAtTime(linearGain, now + 0.05);
    }
  }

  public setStereoBalance(pan: number) {
    this.currentPan = Math.max(-1, Math.min(1, pan));
    if (this.pannerNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.pannerNode.pan.cancelScheduledValues(now);
      this.pannerNode.pan.linearRampToValueAtTime(this.currentPan, now + 0.05);
    }
  }

  public setSpatialAudio(enabled: boolean) {
    this.isSpatialAudioEnabled = enabled;
    if (this.wetGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.wetGain.gain.cancelScheduledValues(now);
      this.wetGain.gain.linearRampToValueAtTime(enabled ? 0.38 : 0.0, now + 0.3);
    }
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public getByteFrequencyData(outArray: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(outArray as any);
    }
  }

  public getByteTimeDomainData(outArray: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(outArray as any);
    }
  }

  public update(isPlaying: boolean = false) {
    if (!isPlaying) {
      this.bass *= 0.92;
      this.mid *= 0.92;
      this.treble *= 0.92;
      this.volume *= 0.92;
      this.energy *= 0.92;
      return;
    }

    if (!this.analyser || !this.dataArray) {
      const t = performance.now() * 0.003;
      this.bass = 0.4 + Math.sin(t * 1.5) * 0.25;
      this.mid = 0.3 + Math.sin(t * 2.2) * 0.2;
      this.treble = 0.25 + Math.cos(t * 3.1) * 0.15;
      this.volume = (this.bass + this.mid + this.treble) / 3;
      this.energy = this.bass * 0.6 + this.mid * 0.3 + this.treble * 0.1;
      return;
    }

    this.analyser.getByteFrequencyData(this.dataArray as any);

    const binCount = this.dataArray.length;
    const bassBins = Math.floor(binCount * 0.15);
    const midBins = Math.floor(binCount * 0.5);

    let bassSum = 0;
    for (let i = 0; i < bassBins; i++) {
      bassSum += this.dataArray[i];
    }
    const rawBass = bassSum / (bassBins * 255);

    let midSum = 0;
    for (let i = bassBins; i < midBins; i++) {
      midSum += this.dataArray[i];
    }
    const rawMid = midSum / ((midBins - bassBins) * 255);

    let trebleSum = 0;
    for (let i = midBins; i < binCount; i++) {
      trebleSum += this.dataArray[i];
    }
    const rawTreble = trebleSum / ((binCount - midBins) * 255);

    const smoothFactor = 0.2;
    this.bass += (rawBass - this.bass) * smoothFactor;
    this.mid += (rawMid - this.mid) * smoothFactor;
    this.treble += (rawTreble - this.treble) * smoothFactor;
    this.volume = (this.bass * 0.5 + this.mid * 0.3 + this.treble * 0.2);
    this.energy = this.bass * 0.65 + this.mid * 0.25 + this.treble * 0.1;
  }
}

export const audioAnalyzer = AudioAnalyzer.getInstance();
