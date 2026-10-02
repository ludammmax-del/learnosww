/**
 * Procedural 5-Track Lo-Fi Music & Ambient Sound Engine for Learning OS
 * 100% Web Audio API procedural synthesis — zero external mp3 files, zero latency, runs offline.
 * Automatically cycles sequentially through 5 distinct Lo-Fi study tracks.
 */

export interface LoFiTrack {
  id: string;
  number: number;
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  keySignature: string;
  color: string;
  synthType: 'rhodes' | 'piano_rain' | 'analog_synth' | 'guitar_pluck' | 'ambient_space';
  durationSeconds: number;
  chords: Array<{
    name: string;
    root: string;
    bass: number;
    notes: number[];
  }>;
}

export const LOFI_PLAYLIST: LoFiTrack[] = [
  {
    id: 'track-1-midnight-coffee',
    number: 1,
    title: 'Midnight Coffee',
    genre: 'Neo-Soul Rhodes · Lo-Fi',
    mood: 'Ночная концентрация и винил',
    bpm: 72,
    keySignature: 'F minor',
    color: '#10B981', // emerald
    synthType: 'rhodes',
    durationSeconds: 42,
    chords: [
      { name: 'Fm9', root: 'F', bass: 87.31, notes: [174.61, 207.65, 261.63, 311.13, 349.23] },
      { name: 'Bb13', root: 'Bb', bass: 116.54, notes: [174.61, 233.08, 293.66, 349.23, 415.30] },
      { name: 'Ebmaj9', root: 'Eb', bass: 77.78, notes: [155.56, 196.00, 233.08, 293.66, 349.23] },
      { name: 'Abmaj7', root: 'Ab', bass: 103.83, notes: [207.65, 261.63, 311.13, 392.00] },
      { name: 'Dbmaj9', root: 'Db', bass: 69.30, notes: [138.59, 174.61, 207.65, 261.63, 311.13] },
      { name: 'Gm7b5', root: 'G', bass: 98.00, notes: [196.00, 233.08, 277.18, 349.23] },
      { name: 'C7alt', root: 'C', bass: 65.41, notes: [130.81, 164.81, 233.08, 261.63, 329.63] },
    ],
  },
  {
    id: 'track-2-rainy-library',
    number: 2,
    title: 'Rainy Library',
    genre: 'Chillhop Piano & Rain',
    mood: 'Шум дождя и теплый рояль',
    bpm: 64,
    keySignature: 'C major',
    color: '#06B6D4', // cyan
    synthType: 'piano_rain',
    durationSeconds: 45,
    chords: [
      { name: 'Cmaj9', root: 'C', bass: 65.41, notes: [130.81, 196.00, 246.94, 293.66, 329.63] },
      { name: 'Am9', root: 'A', bass: 55.00, notes: [164.81, 220.00, 261.63, 293.66, 329.63] },
      { name: 'Dm9', root: 'D', bass: 73.42, notes: [146.83, 220.00, 261.63, 329.63, 349.23] },
      { name: 'G13sus', root: 'G', bass: 98.00, notes: [174.61, 246.94, 293.66, 329.63, 392.00] },
      { name: 'Em7', root: 'E', bass: 82.41, notes: [164.81, 196.00, 246.94, 293.66] },
      { name: 'A7b9', root: 'A', bass: 55.00, notes: [146.83, 174.61, 220.00, 277.18, 311.13] },
      { name: 'Dm11', root: 'D', bass: 73.42, notes: [174.61, 220.00, 261.63, 293.66, 349.23] },
      { name: 'G7b13', root: 'G', bass: 98.00, notes: [155.56, 196.00, 246.94, 311.13, 392.00] },
    ],
  },
  {
    id: 'track-3-tokyo-drift',
    number: 3,
    title: 'Tokyo Neon Drift',
    genre: 'Cyber Lo-Fi & Warm Synth',
    mood: 'Вечерний Токио и аналоговые пэды',
    bpm: 78,
    keySignature: 'D# minor',
    color: '#8B5CF6', // purple
    synthType: 'analog_synth',
    durationSeconds: 38,
    chords: [
      { name: 'D#m9', root: 'D#', bass: 77.78, notes: [155.56, 185.00, 233.08, 277.18, 311.13] },
      { name: 'Bmaj7', root: 'B', bass: 61.74, notes: [123.47, 185.00, 233.08, 277.18, 369.99] },
      { name: 'G#m11', root: 'G#', bass: 103.83, notes: [164.81, 207.65, 246.94, 311.13, 369.99] },
      { name: 'A#7sus', root: 'A#', bass: 116.54, notes: [174.61, 233.08, 277.18, 349.23, 466.16] },
      { name: 'C#maj9', root: 'C#', bass: 69.30, notes: [138.59, 207.65, 261.63, 311.13, 392.00] },
      { name: 'F#maj7', root: 'F#', bass: 92.50, notes: [185.00, 233.08, 277.18, 349.23, 440.00] },
    ],
  },
  {
    id: 'track-4-sunset-study',
    number: 4,
    title: 'Sunset Study Session',
    genre: 'Bossa Nova Lo-Fi Breeze',
    mood: 'Закатный бриз и мягкие струны',
    bpm: 74,
    keySignature: 'G major',
    color: '#F59E0B', // amber
    synthType: 'guitar_pluck',
    durationSeconds: 40,
    chords: [
      { name: 'Gmaj9', root: 'G', bass: 98.00, notes: [146.83, 196.00, 246.94, 293.66, 369.99] },
      { name: 'E7#9', root: 'E', bass: 82.41, notes: [164.81, 207.65, 246.94, 311.13, 392.00] },
      { name: 'Am9', root: 'A', bass: 55.00, notes: [138.59, 174.61, 220.00, 261.63, 329.63] },
      { name: 'D9', root: 'D', bass: 73.42, notes: [146.83, 220.00, 246.94, 293.66, 369.99] },
      { name: 'Bm7', root: 'B', bass: 61.74, notes: [123.47, 185.00, 220.00, 246.94, 293.66] },
      { name: 'E7b9', root: 'E', bass: 82.41, notes: [164.81, 196.00, 246.94, 311.13] },
      { name: 'Am7', root: 'A', bass: 55.00, notes: [130.81, 164.81, 220.00, 261.63] },
      { name: 'D13', root: 'D', bass: 73.42, notes: [146.83, 220.00, 246.94, 329.63, 369.99] },
    ],
  },
  {
    id: 'track-5-deep-focus-cosmos',
    number: 5,
    title: 'Deep Focus Cosmos',
    genre: 'Dreamy Space Ambient Lo-Fi',
    mood: 'Глубокое погружение в поток',
    bpm: 58,
    keySignature: 'A major',
    color: '#3B82F6', // blue
    synthType: 'ambient_space',
    durationSeconds: 48,
    chords: [
      { name: 'Amaj9', root: 'A', bass: 55.00, notes: [110.00, 164.81, 220.00, 277.18, 329.63, 415.30] },
      { name: 'F#m11', root: 'F#', bass: 46.25, notes: [92.50, 146.83, 185.00, 220.00, 293.66, 369.99] },
      { name: 'Dmaj9', root: 'D', bass: 73.42, notes: [146.83, 185.00, 220.00, 277.18, 369.99] },
      { name: 'C#m7', root: 'C#', bass: 69.30, notes: [138.59, 164.81, 207.65, 246.94, 329.63] },
      { name: 'Bm9', root: 'B', bass: 61.74, notes: [123.47, 146.83, 185.00, 220.00, 293.66] },
      { name: 'E7sus', root: 'E', bass: 41.20, notes: [82.41, 164.81, 220.00, 293.66, 329.63] },
      { name: 'Amaj7#11', root: 'A', bass: 55.00, notes: [110.00, 164.81, 220.00, 277.18, 370.00, 415.30] },
    ],
  },
];

export interface LoFiEngineState {
  isPlaying: boolean;
  volume: number;
  currentTrackIndex: number;
  currentTrack: LoFiTrack;
  totalTracks: number;
  currentChordName: string;
  trackElapsedSeconds: number;
  trackProgressPercent: number;
}

class LoFiMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentVolume: number = 0.35;
  private chordIntervalId: any = null;
  private rhythmIntervalId: any = null;
  private progressTimerId: any = null;
  private backgroundNoiseNode: AudioNode | null = null;
  private listeners: Set<(state: LoFiEngineState) => void> = new Set();
  
  private currentTrackIndex: number = 0;
  private currentChordIndex: number = 0;
  private currentChordName: string = 'Fm9';
  private trackElapsedSeconds: number = 0;

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
    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  // Synth Mode 1: Soft Vintage Rhodes Electric Piano
  private playRhodesNote(freq: number, duration: number, velocity: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.002, this.ctx.currentTime); // gentle warm chorus

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + duration);

    const now = this.ctx.currentTime;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.12, now + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.06, now + 0.5);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
  }

  // Synth Mode 2: Felt Acoustic Piano with Harmonic Warmth
  private playAcousticPianoNote(freq: number, duration: number, velocity: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const oscFundamental = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    oscFundamental.type = 'triangle';
    oscFundamental.frequency.setValueAtTime(freq, this.ctx.currentTime);

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2, this.ctx.currentTime); // octave shimmer

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + duration * 0.8);

    const now = this.ctx.currentTime;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.14, now + 0.02); // quick hammer attack
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.05, now + 0.4);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscFundamental.connect(filter);
    oscHarmonic.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    oscFundamental.start(now);
    oscHarmonic.start(now);
    oscFundamental.stop(now + duration + 0.1);
    oscHarmonic.stop(now + duration + 0.1);
  }

  // Synth Mode 3: Analog Warm Synth Pads
  private playAnalogSynthNote(freq: number, duration: number, velocity: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.004, this.ctx.currentTime); // detune +

    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq * 0.996, this.ctx.currentTime); // detune -

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + duration);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.08, now + 0.25); // slow silky swell
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.05, now + duration * 0.6);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
    osc3.stop(now + duration + 0.1);
  }

  // Synth Mode 4: Warm Plucked Nylon Guitar Note
  private playGuitarPluckNote(freq: number, duration: number, velocity: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(freq * 0.5, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.15, now + 0.015); // fast pluck
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.03, now + 0.2);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    osc.connect(filter);
    oscSub.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    oscSub.start(now);
    osc.stop(now + duration + 0.1);
    oscSub.stop(now + duration + 0.1);
  }

  // Synth Mode 5: Dreamy Ethereal Space Shimmer
  private playAmbientSpaceNote(freq: number, duration: number, velocity: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.001, this.ctx.currentTime); // celestial 2nd harmonic

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + duration);

    const now = this.ctx.currentTime;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.09, now + 0.5); // long ethereal swell
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.06, now + duration * 0.7);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
  }

  // Warm Sub Bass
  private playSubBass(freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.08, now + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  // Soft Lo-Fi Kick Drum
  private playKick() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Soft Snare brush / rimshot
  private playSnare() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
  }

  // Ambient Noise: Vinyl Crackle or Gentle Rain
  private startBackgroundAtmosphere(track: LoFiTrack) {
    if (!this.ctx || !this.masterGain) return;
    if (this.backgroundNoiseNode) {
      try {
        (this.backgroundNoiseNode as any).stop?.();
        this.backgroundNoiseNode.disconnect();
      } catch {}
      this.backgroundNoiseNode = null;
    }

    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    const isRain = track.synthType === 'piano_rain';
    for (let i = 0; i < bufferSize; i++) {
      if (isRain) {
        // Continuous soft pink rain noise
        data[i] = (Math.random() * 2 - 1) * 0.02;
      } else {
        // Classic vinyl pop and dust
        const isPop = Math.random() < 0.0012;
        const popVal = isPop ? (Math.random() * 2 - 1) * 0.22 : 0;
        data[i] = (Math.random() * 2 - 1) * 0.012 + popVal;
      }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isRain ? 2200 : 3200, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isRain ? 0.05 : 0.035, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    source.start();
    this.backgroundNoiseNode = source;
  }

  // Play a single chord in the current track according to its synth style
  private tickChord() {
    const track = LOFI_PLAYLIST[this.currentTrackIndex];
    const chord = track.chords[this.currentChordIndex];
    this.currentChordName = chord.name;
    this.notifyState();

    // Play bass note
    this.playSubBass(chord.bass, 3.4);

    // Play harmony notes according to track synth style
    chord.notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.isPlaying) return;
        switch (track.synthType) {
          case 'rhodes':
            this.playRhodesNote(freq, 3.0, 0.45 + (idx % 2) * 0.15);
            break;
          case 'piano_rain':
            this.playAcousticPianoNote(freq, 2.8, 0.5 + (idx % 2) * 0.12);
            break;
          case 'analog_synth':
            this.playAnalogSynthNote(freq, 3.2, 0.4 + (idx % 2) * 0.1);
            break;
          case 'guitar_pluck':
            this.playGuitarPluckNote(freq, 2.4, 0.45 + (idx % 2) * 0.15);
            break;
          case 'ambient_space':
            this.playAmbientSpaceNote(freq, 3.6, 0.38 + (idx % 2) * 0.1);
            break;
        }
      }, idx * 55);
    });

    this.currentChordIndex = (this.currentChordIndex + 1) % track.chords.length;
  }

  // Setup loop for current track
  private startTrackLoop() {
    if (this.chordIntervalId) clearInterval(this.chordIntervalId);
    if (this.rhythmIntervalId) clearInterval(this.rhythmIntervalId);

    const track = LOFI_PLAYLIST[this.currentTrackIndex];
    this.currentChordIndex = 0;
    this.startBackgroundAtmosphere(track);

    // Bar timing based on BPM: 1 bar = 4 beats = (60000 / BPM) * 4 ms
    const beatMs = Math.round(60000 / track.bpm);
    const barMs = beatMs * 4;

    this.tickChord();
    this.chordIntervalId = setInterval(() => {
      this.tickChord();
    }, barMs);

    // Soft rhythm pattern
    let beat = 0;
    this.rhythmIntervalId = setInterval(() => {
      if (!this.isPlaying) return;
      if (beat === 0) {
        this.playKick();
      } else if (beat === 1) {
        this.playSnare();
      } else if (beat === 2) {
        this.playKick();
      } else if (beat === 3) {
        this.playSnare();
      }
      beat = (beat + 1) % 4;
    }, beatMs);
  }

  public play() {
    if (this.isPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.startTrackLoop();

    // Progress counter (every 1s) to auto-advance to the next track sequentially!
    if (this.progressTimerId) clearInterval(this.progressTimerId);
    this.progressTimerId = setInterval(() => {
      if (!this.isPlaying) return;
      this.trackElapsedSeconds += 1;
      const currentTrack = LOFI_PLAYLIST[this.currentTrackIndex];

      // Automatically advance to next track when duration is reached!
      if (this.trackElapsedSeconds >= currentTrack.durationSeconds) {
        this.nextTrack(true);
        return;
      }
      this.notifyState();
    }, 1000);

    this.notifyState();
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.chordIntervalId) {
      clearInterval(this.chordIntervalId);
      this.chordIntervalId = null;
    }
    if (this.rhythmIntervalId) {
      clearInterval(this.rhythmIntervalId);
      this.rhythmIntervalId = null;
    }
    if (this.progressTimerId) {
      clearInterval(this.progressTimerId);
      this.progressTimerId = null;
    }
    if (this.backgroundNoiseNode) {
      try {
        (this.backgroundNoiseNode as any).stop?.();
        this.backgroundNoiseNode.disconnect();
      } catch {}
      this.backgroundNoiseNode = null;
    }

    this.notifyState();
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  // Switch to next track sequentially (1 -> 2 -> 3 -> 4 -> 5 -> 1...)
  public nextTrack(auto = false) {
    this.trackElapsedSeconds = 0;
    this.currentTrackIndex = (this.currentTrackIndex + 1) % LOFI_PLAYLIST.length;
    if (this.isPlaying) {
      this.startTrackLoop();
    }
    this.notifyState();
  }

  // Switch to previous track
  public prevTrack() {
    this.trackElapsedSeconds = 0;
    this.currentTrackIndex = (this.currentTrackIndex - 1 + LOFI_PLAYLIST.length) % LOFI_PLAYLIST.length;
    if (this.isPlaying) {
      this.startTrackLoop();
    }
    this.notifyState();
  }

  // Select a specific track by index (0..4)
  public selectTrack(index: number) {
    if (index >= 0 && index < LOFI_PLAYLIST.length) {
      this.trackElapsedSeconds = 0;
      this.currentTrackIndex = index;
      if (this.isPlaying) {
        this.startTrackLoop();
      }
      this.notifyState();
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
    this.notifyState();
  }

  public getStatus(): LoFiEngineState {
    const currentTrack = LOFI_PLAYLIST[this.currentTrackIndex] || LOFI_PLAYLIST[0];
    const duration = currentTrack.durationSeconds || 40;
    const percent = Math.min(100, Math.round((this.trackElapsedSeconds / duration) * 100));

    return {
      isPlaying: this.isPlaying,
      volume: this.currentVolume,
      currentTrackIndex: this.currentTrackIndex,
      currentTrack,
      totalTracks: LOFI_PLAYLIST.length,
      currentChordName: this.currentChordName,
      trackElapsedSeconds: this.trackElapsedSeconds,
      trackProgressPercent: percent,
    };
  }

  public subscribe(listener: (state: LoFiEngineState) => void) {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyState() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch {}
    });
  }
}

export const lofiAudio = new LoFiMusicEngine();
