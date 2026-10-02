// Clean Web Audio chime generator for OS notifications & Pomodoro without external assets
export function playChime(type: 'success' | 'alert' | 'pomodoro' | 'click' | 'ring' = 'success') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      return;
    }

    if (type === 'ring') {
      // Incoming call ring sequence
      [600, 750, 600, 750].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.1);
      });
      return;
    }

    if (type === 'pomodoro') {
      // 3 pleasant bell chords
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.8);
      });
      return;
    }

    if (type === 'alert') {
      [300, 260].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.3);
      });
      return;
    }

    if (type === 'success') {
      // Harmonic uplift
      [440, 554.37, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.6);
      });
    }
  } catch {
    // AudioContext blocked by browser policy until gesture
  }
}

// Ambient Focus Sound Generator (Rain, Brown Noise, Binaural Drone)
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private oscNodes: OscillatorNode[] = [];
  private isRunning: boolean = false;
  private currentMode: 'rain' | 'brown' | 'binaural' | 'space' = 'brown';
  private currentVolume: number = 0.3;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(mode: 'rain' | 'brown' | 'binaural' | 'space', volume: number = 0.3) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentMode = mode;
    this.currentVolume = volume;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume * 0.4, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (mode === 'binaural') {
      // 220Hz left, 228Hz right -> 8Hz Alpha / 40Hz Gamma focus
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const merger = this.ctx.createChannelMerger(2);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(216, this.ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(224, this.ctx.currentTime);

      osc1.connect(merger, 0, 0);
      osc2.connect(merger, 0, 1);
      merger.connect(this.gainNode);

      osc1.start();
      osc2.start();
      this.oscNodes = [osc1, osc2];
    } else if (mode === 'space') {
      // Deep resonant drone
      [110, 164.81, 220, 329.63].forEach((freq) => {
        if (!this.ctx || !this.gainNode) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        oscGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(this.gainNode);
        osc.start();
        this.oscNodes.push(osc);
      });
    } else {
      // Noise buffer (Rain or Brown Noise)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (mode === 'brown') {
          // Brown noise integration
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else {
          // Rain emulation (low-pass filtered white with soft drops)
          output[i] = (lastOut + 0.08 * white) / 1.08;
          lastOut = output[i];
          output[i] *= 2.0;
        }
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Lowpass filter for smooth organic warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(mode === 'brown' ? 380 : 1200, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.gainNode);
      whiteNoise.start();
      this.noiseNode = whiteNoise;
    }

    this.isRunning = true;
  }

  public setVolume(volume: number) {
    this.currentVolume = volume;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(volume * 0.4, this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    this.oscNodes.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.oscNodes = [];

    if (this.noiseNode) {
      try {
        (this.noiseNode as any).stop?.();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.isRunning = false;
  }

  public getStatus() {
    return {
      isPlaying: this.isRunning,
      mode: this.currentMode,
      volume: this.currentVolume,
    };
  }
}

export const ambientSound = new AmbientSoundEngine();

