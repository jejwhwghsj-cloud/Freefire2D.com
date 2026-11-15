/**
 * Synthesized Web Audio Engine for Free Fire 2D
 * Features:
 * - DynamicsCompressorNode anti-clipping master bus
 * - Stereo spatial panning & distance attenuation for distant bots & explosions
 * - Multi-layered punchy weapon transients, kill chimes, hurt thuds, footsteps & airdrop sonar
 * - Optional procedural tactical background music (Lobby & Combat modes)
 * - Persistent volume, SFX mute, and Music mute settings in localStorage
 */

export interface SpatialAudioOptions {
  volume?: number;
  pan?: number; // -1 (left) to +1 (right)
}

const STORAGE_SFX_KEY = 'freefire_audio_enabled';
const STORAGE_MUSIC_KEY = 'freefire_music_enabled';
const STORAGE_VOLUME_KEY = 'freefire_audio_volume';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private _enabled: boolean = true;
  private _musicEnabled: boolean = true;
  private _volume: number = 0.75;

  private musicTimer: number | null = null;
  private musicMode: 'lobby' | 'combat' | null = null;
  private musicStep: number = 0;
  private listenersBound: boolean = false;

  constructor() {
    this.loadSettings();
    this.bindUnlockListeners();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const sfxSaved = localStorage.getItem(STORAGE_SFX_KEY);
      if (sfxSaved !== null) this._enabled = sfxSaved === 'true';

      const musicSaved = localStorage.getItem(STORAGE_MUSIC_KEY);
      if (musicSaved !== null) this._musicEnabled = musicSaved === 'true';

      const volSaved = localStorage.getItem(STORAGE_VOLUME_KEY);
      if (volSaved !== null) {
        const parsed = parseFloat(volSaved);
        if (!Number.isNaN(parsed)) {
          this._volume = Math.max(0, Math.min(1, parsed));
        }
      }
    } catch {
      // Ignore storage failures
    }
  }

  private bindUnlockListeners() {
    if (typeof window === 'undefined' || this.listenersBound) return;
    this.listenersBound = true;

    const unlock = () => {
      this.initCtx();
      if (this.musicMode && this._enabled && this._musicEnabled && this.musicTimer === null) {
        this.startMusic(this.musicMode);
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(val: boolean) {
    this.setEnabled(val);
  }

  public get musicEnabled(): boolean {
    return this._musicEnabled;
  }

  public set musicEnabled(val: boolean) {
    this.setMusicEnabled(val);
  }

  public get volume(): number {
    return this._volume;
  }

  public setEnabled(val: boolean) {
    this._enabled = val;
    try {
      localStorage.setItem(STORAGE_SFX_KEY, String(val));
    } catch {
      // Ignore
    }

    if (val) {
      this.initCtx();
    }

    if (this.masterGain && this.ctx) {
      const target = val ? this._volume : 0;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    }

    if (!val) {
      this.clearMusicScheduler();
    } else if (this.musicMode && this._musicEnabled) {
      this.startMusic(this.musicMode);
    }
  }

  public setMusicEnabled(val: boolean) {
    this._musicEnabled = val;
    try {
      localStorage.setItem(STORAGE_MUSIC_KEY, String(val));
    } catch {
      // Ignore
    }

    if (val) {
      this.initCtx();
    }

    if (this.musicGain && this.ctx) {
      const targetGain = this.musicMode === 'combat' ? 0.16 : 0.2;
      this.musicGain.gain.setTargetAtTime(val ? targetGain : 0, this.ctx.currentTime, 0.04);
    }

    if (!val) {
      this.clearMusicScheduler();
    } else if (this.musicMode && this._enabled) {
      this.startMusic(this.musicMode);
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this._volume = clamped;
    try {
      localStorage.setItem(STORAGE_VOLUME_KEY, String(clamped));
    } catch {
      // Ignore
    }

    if (this.masterGain && this.ctx && this._enabled) {
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
    }
  }

  private initCtx() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtxClass) return;

        this.ctx = new AudioCtxClass();

        // Anti-clipping master compressor for hectic firefights
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(18, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
          this._enabled ? this._volume : 0,
          this.ctx.currentTime
        );

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(
          this._musicEnabled ? 0.18 : 0,
          this.ctx.currentTime
        );

        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        this.createNoiseBuffer();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore Web Audio autoplay restrictions
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Builds a per-sound spatial route (distance volume + stereo panning) into sfxGain.
   */
  private createSpatialRoute(options?: SpatialAudioOptions): AudioNode | null {
    if (!this.ctx || !this.sfxGain) return null;
    const vol = Math.max(0.01, Math.min(1.2, options?.volume ?? 1));
    const panVal = Math.max(-0.95, Math.min(0.95, options?.pan ?? 0));

    const routeGain = this.ctx.createGain();
    routeGain.gain.setValueAtTime(vol, this.ctx.currentTime);

    if (typeof this.ctx.createStereoPanner === 'function' && Math.abs(panVal) > 0.01) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(panVal, this.ctx.currentTime);
      routeGain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      routeGain.connect(this.sfxGain);
    }

    return routeGain;
  }

  public playClick() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Safe fallback
    }
  }

  public playGunshot(
    type: 'pistol' | 'smg' | 'rifle' | 'shotgun' | 'sniper' | 'heavy' | 'melee',
    options?: SpatialAudioOptions
  ) {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
      const dest = this.createSpatialRoute(options);
      if (!dest) return;

      const now = this.ctx.currentTime;

      if (type === 'melee') {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.14);
        filter.Q.setValueAtTime(2.5, now);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.28, now);
        nGain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

        const osc = this.ctx.createOscillator();
        const oGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(85, now + 0.13);
        oGain.gain.setValueAtTime(0.22, now);
        oGain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(dest);
        osc.connect(oGain);
        oGain.connect(dest);

        noise.start(now);
        noise.stop(now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        return;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      const noiseGain = this.ctx.createGain();

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      let duration = 0.22;

      switch (type) {
        case 'pistol':
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(1750, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(520, now + 0.13);
          noiseFilter.Q.setValueAtTime(1.6, now);
          noiseGain.gain.setValueAtTime(0.45, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.13);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(48, now + 0.1);
          oscGain.gain.setValueAtTime(0.42, now);
          oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.11);
          duration = 0.15;
          break;

        case 'smg':
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(2100, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(700, now + 0.08);
          noiseFilter.Q.setValueAtTime(1.2, now);
          noiseGain.gain.setValueAtTime(0.36, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.085);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(62, now + 0.065);
          oscGain.gain.setValueAtTime(0.28, now);
          oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.075);
          duration = 0.1;
          break;

        case 'rifle':
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(3200, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(420, now + 0.19);
          noiseGain.gain.setValueAtTime(0.55, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.19);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(210, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
          oscGain.gain.setValueAtTime(0.45, now);
          oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
          duration = 0.21;
          break;

        case 'shotgun':
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(1900, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.36);
          noiseGain.gain.setValueAtTime(0.78, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.36);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(135, now);
          osc.frequency.exponentialRampToValueAtTime(28, now + 0.24);
          oscGain.gain.setValueAtTime(0.7, now);
          oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
          duration = 0.38;
          break;

        case 'sniper':
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(3800, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(320, now + 0.48);
          noiseFilter.Q.setValueAtTime(2.2, now);
          noiseGain.gain.setValueAtTime(0.82, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.48);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(170, now);
          osc.frequency.exponentialRampToValueAtTime(24, now + 0.36);
          oscGain.gain.setValueAtTime(0.72, now);
          oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.36);
          duration = 0.52;
          break;

        case 'heavy':
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(2200, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(450, now + 0.11);
          noiseGain.gain.setValueAtTime(0.48, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.11);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(175, now);
          osc.frequency.exponentialRampToValueAtTime(38, now + 0.085);
          oscGain.gain.setValueAtTime(0.38, now);
          oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);
          duration = 0.12;
          break;
      }

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);

      osc.connect(oscGain);
      oscGain.connect(dest);

      noise.start(now);
      noise.stop(now + duration);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore Web Audio edge failures
    }
  }

  public playHit(
    type: 'body' | 'armor' | 'wall' | 'headshot',
    options?: SpatialAudioOptions
  ) {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const dest = this.createSpatialRoute(options);
      if (!dest) return;

      const now = this.ctx.currentTime;

      if (type === 'headshot') {
        // Crisp two-harmonic helmet crunch + high ding
        [1850, 2750].forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = i === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.28, now + 0.08);
          gain.gain.setValueAtTime(i === 0 ? 0.36 : 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.23);
        });
      } else if (type === 'armor') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1350, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'wall') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(860, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.07);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.075);
      } else {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(62, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.095);
      }
    } catch {
      // Safe fallback
    }
  }

  public playPlayerHurt() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;

      // Visceral low thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.17);

      // Brief armor/fabric impact grit
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.2, now);
      nGain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.1);
    } catch {
      // Safe fallback
    }
  }

  public playKill() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      // Crisp ascending elimination confirm chime + sub accent
      const freqs = [660, 987.77, 1318.51];
      freqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.055;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.24);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch {
      // Safe fallback
    }
  }

  public playFootstep() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320 + Math.random() * 140, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.004, now + 0.065);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.07);
    } catch {
      // Safe fallback
    }
  }

  public playAirdrop() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      // Tactical sonar beacon + jet pass rumble
      [0, 0.22].forEach((offset, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 880 : 1174.66, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.005, now + offset + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.32);
      });
    } catch {
      // Safe fallback
    }
  }

  public playExplosion(options?: SpatialAudioOptions) {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
      const dest = this.createSpatialRoute(options);
      if (!dest) return;

      const now = this.ctx.currentTime;

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1100, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(65, now + 0.95);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.95);

      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(98, now);
      subOsc.frequency.exponentialRampToValueAtTime(22, now + 0.65);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.85, now);
      subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.65);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);

      subOsc.connect(subGain);
      subGain.connect(dest);

      noise.start(now);
      noise.stop(now + 0.96);
      subOsc.start(now);
      subOsc.stop(now + 0.66);
    } catch {
      // Safe fallback
    }
  }

  public playReload() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      [0, 0.2].forEach((offset, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 850 : 1120, now + offset);
        osc.frequency.exponentialRampToValueAtTime(380, now + offset + 0.055);
        gain.gain.setValueAtTime(0.22, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.005, now + offset + 0.06);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.065);
      });
    } catch {
      // Safe fallback
    }
  }

  public playPickup() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.085);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.125);
    } catch {
      // Safe fallback
    }
  }

  public playHeal() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      [0, 0.09, 0.18].forEach((offset, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        const freq = 440 * Math.pow(1.25, idx);
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.005, now + offset + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.17);
      });
    } catch {
      // Safe fallback
    }
  }

  public playStormAlarm() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(310, now);
      osc.frequency.linearRampToValueAtTime(560, now + 0.35);
      osc.frequency.linearRampToValueAtTime(310, now + 0.7);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.68);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.92);
    } catch {
      // Safe fallback
    }
  }

  public playVictory() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.13;
        const dur = idx === notes.length - 1 ? 1.2 : 0.22;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + dur);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      });

      // Harmonic brass pad under finale note
      [261.63, 329.63, 392.0].forEach((freq) => {
        const pad = this.ctx!.createOscillator();
        const pGain = this.ctx!.createGain();
        pad.type = 'sawtooth';
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, now + 0.39);
        pad.frequency.setValueAtTime(freq, now + 0.39);
        pGain.gain.setValueAtTime(0.08, now + 0.39);
        pGain.gain.exponentialRampToValueAtTime(0.004, now + 1.6);
        pad.connect(filter);
        filter.connect(pGain);
        pGain.connect(this.sfxGain!);
        pad.start(now + 0.39);
        pad.stop(now + 1.65);
      });
    } catch {
      // Safe fallback
    }
  }

  public playDefeat() {
    if (!this._enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.85);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.85);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.88);
    } catch {
      // Safe fallback
    }
  }

  private clearMusicScheduler() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public startMusic(mode: 'lobby' | 'combat') {
    this.musicMode = mode;
    if (typeof window === 'undefined') return;
    if (!this._enabled || !this._musicEnabled) {
      this.clearMusicScheduler();
      return;
    }

    this.initCtx();
    if (!this.ctx || !this.musicGain) return;
    if (this.ctx.state === 'suspended') {
      return; // Will auto-start on first user interaction via unlock listener
    }

    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(
        mode === 'combat' ? 0.16 : 0.2,
        this.ctx.currentTime,
        0.05
      );
    }

    this.clearMusicScheduler();
    this.musicStep = 0;

    // 16th-note step duration: 96 BPM lobby (~156ms) or 124 BPM combat (~120ms)
    const stepMs = mode === 'combat' ? 120 : 155;

    const tick = () => {
      if (!this.ctx || !this.musicGain || !this._enabled || !this._musicEnabled) {
        this.clearMusicScheduler();
        return;
      }
      if (this.ctx.state !== 'running') return;

      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;

      if (this.musicMode === 'lobby') {
        // Dark atmospheric D-minor tactical lobby motif
        const bassPattern = [73.42, 0, 73.42, 0, 87.31, 0, 65.41, 0, 73.42, 0, 73.42, 0, 98.0, 0, 82.41, 0];
        const arpPattern = [293.66, 349.23, 440.0, 349.23, 293.66, 440.0, 523.25, 440.0];

        const bassFreq = bassPattern[step];
        if (bassFreq > 0) {
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(bassFreq, now);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(280, now);
          gain.gain.setValueAtTime(0.32, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 0.26);
        }

        if (step % 2 === 0) {
          const arpFreq = arpPattern[(step / 2) % arpPattern.length];
          const arp = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          arp.type = 'triangle';
          arp.frequency.setValueAtTime(arpFreq, now);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.008, now + 0.2);
          arp.connect(gain);
          gain.connect(this.musicGain);
          arp.start(now);
          arp.stop(now + 0.22);
        }
      } else {
        // High-focus tactical combat groove (tight kick + dark E-minor pulse)
        if (step % 4 === 0) {
          const kick = this.ctx.createOscillator();
          const kGain = this.ctx.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(115, now);
          kick.frequency.exponentialRampToValueAtTime(38, now + 0.11);
          kGain.gain.setValueAtTime(0.38, now);
          kGain.gain.exponentialRampToValueAtTime(0.008, now + 0.13);
          kick.connect(kGain);
          kGain.connect(this.musicGain);
          kick.start(now);
          kick.stop(now + 0.14);
        }

        const combatBass = [82.41, 82.41, 0, 82.41, 98.0, 0, 87.31, 0, 82.41, 82.41, 0, 110.0, 98.0, 0, 73.42, 0];
        const bFreq = combatBass[step];
        if (bFreq > 0) {
          const bass = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const bGain = this.ctx.createGain();
          bass.type = 'sawtooth';
          bass.frequency.setValueAtTime(bFreq, now);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(340, now);
          bGain.gain.setValueAtTime(0.24, now);
          bGain.gain.exponentialRampToValueAtTime(0.008, now + 0.1);
          bass.connect(filter);
          filter.connect(bGain);
          bGain.connect(this.musicGain);
          bass.start(now);
          bass.stop(now + 0.11);
        }

        // Crisp off-beat tick
        if (step % 2 === 1 && this.noiseBuffer) {
          const hat = this.ctx.createBufferSource();
          hat.buffer = this.noiseBuffer;
          const hFilter = this.ctx.createBiquadFilter();
          hFilter.type = 'highpass';
          hFilter.frequency.setValueAtTime(6500, now);
          const hGain = this.ctx.createGain();
          hGain.gain.setValueAtTime(0.07, now);
          hGain.gain.exponentialRampToValueAtTime(0.004, now + 0.035);
          hat.connect(hFilter);
          hFilter.connect(hGain);
          hGain.connect(this.musicGain);
          hat.start(now);
          hat.stop(now + 0.04);
        }
      }

      this.musicStep++;
    };

    tick();
    this.musicTimer = window.setInterval(tick, stepMs);
  }

  public stopMusic() {
    this.musicMode = null;
    this.clearMusicScheduler();
  }
}

export const sounds = new SoundEngine();
