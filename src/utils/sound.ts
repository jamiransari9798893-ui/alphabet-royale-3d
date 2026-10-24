// Realistic Web Audio API Synthesizer for Alphabet Royale 3D
// Zero external audio links — 100% reliable procedural synthesis with instant first-tap unlock

class RoyalSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public muted: boolean = false;
  private backgroundMuted: boolean =
    typeof document !== 'undefined' ? Boolean(document.hidden) : false;
  private unlocked: boolean = false;
  private pendingTimeouts: Set<number> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlockAudio();
      };
      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('touchstart', unlockHandler, { passive: true });
      window.addEventListener('click', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
      }
      window.addEventListener('pagehide', () => this.setBackgroundHidden(true));
      window.addEventListener('pageshow', () => {
        this.setBackgroundHidden(typeof document !== 'undefined' ? Boolean(document.hidden) : false);
      });
    }
  }

  private clearPendingTimeouts(): void {
    this.pendingTimeouts.forEach((id) => {
      clearTimeout(id);
    });
    this.pendingTimeouts.clear();
  }

  private scheduleTimeout(fn: () => void, delayMs: number): void {
    if (typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      this.pendingTimeouts.delete(id);
      if (!this.isAudioSuppressed()) {
        fn();
      }
    }, delayMs);
    this.pendingTimeouts.add(id);
  }

  public isAudioSuppressed(): boolean {
    const isDocHidden = typeof document !== 'undefined' && Boolean(document.hidden);
    return this.muted || this.backgroundMuted || isDocHidden;
  }

  public handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return;
    this.setBackgroundHidden(Boolean(document.hidden));
  };

  public syncVisibilityState(): void {
    if (typeof document === 'undefined') return;
    this.setBackgroundHidden(Boolean(document.hidden));
  }

  private setBackgroundHidden(hidden: boolean): void {
    this.backgroundMuted = hidden;

    if (hidden) {
      // Immediately cancel any scheduled multi-part sound effects (shuffles, fanfares)
      this.clearPendingTimeouts();

      // Silence master gain node and suspend Web Audio context
      if (this.ctx && this.masterGain) {
        try {
          this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
          this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch {
          // Ignore context timing errors
        }
      }
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }

      // Pause and mute any HTML5 <audio> or <video> elements if present
      if (typeof document !== 'undefined') {
        document.querySelectorAll('audio, video').forEach((el) => {
          const media = el as HTMLMediaElement;
          if (!media.paused) {
            media.dataset.pausedByVisibility = 'true';
            media.pause();
          }
          media.muted = true;
        });
      }
    } else {
      // App returned to foreground: only unmute/resume if user hasn't manually muted
      if (!this.muted) {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.ctx && this.masterGain) {
          try {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
          } catch {
            // Ignore context timing errors
          }
        }
        if (typeof document !== 'undefined') {
          document.querySelectorAll('audio, video').forEach((el) => {
            const media = el as HTMLMediaElement;
            media.muted = false;
            if (media.dataset.pausedByVisibility === 'true') {
              delete media.dataset.pausedByVisibility;
              media.play().catch(() => {});
            }
          });
        }
      }
    }
  }

  public unlockAudio(): void {
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = this.isAudioSuppressed() ? 0 : 1;
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended' && !this.isAudioSuppressed()) {
        this.ctx.resume().catch(() => {});
      }
      if (this.ctx && !this.unlocked && !this.isAudioSuppressed()) {
        // Play a silent 1-sample buffer to unlock iOS/Android mobile Web Audio
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.getDestination(this.ctx));
        source.start(0);
        this.unlocked = true;
      }
    } catch {
      // Ignore audio unlock errors on restricted contexts
    }
  }

  private getDestination(ctx: AudioContext): AudioNode {
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.isAudioSuppressed() ? 0 : 1;
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  private getContext(): AudioContext | null {
    if (this.isAudioSuppressed() || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        this.unlockAudio();
      }
      if (!this.ctx || this.isAudioSuppressed()) {
        return null;
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Crisp metallic gold button click */
  public playClick(pitchShift = 1.0): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1020 * pitchShift, now);
    osc.frequency.exponentialRampToValueAtTime(310 * pitchShift, now + 0.05);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  /** Crisp paper "whoosh" for card slide / swap / deal */
  public playCardSlide(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.095);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.085);
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.092);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(now);
  }

  /**
   * Realistic Card Throw:
   * 1) Crisp paper "whoosh" through the air
   * 2) Heavy tabletop "slap/thud" + sharp card snap when landing in the center pile
   */
  public playCardSlap(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const now = ctx.currentTime;

    // 1. Crisp paper whoosh
    this.playCardSlide();

    // 2. Heavy tabletop thud at +55ms
    const slapTime = now + 0.055;
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(220, slapTime);
    thudOsc.frequency.exponentialRampToValueAtTime(46, slapTime + 0.11);

    thudGain.gain.setValueAtTime(0.65, slapTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, slapTime + 0.115);

    thudOsc.connect(thudGain);
    thudGain.connect(dest);
    thudOsc.start(slapTime);
    thudOsc.stop(slapTime + 0.12);

    // 3. Sharp card-on-card / felt slap transient
    const bufferSize = Math.floor(ctx.sampleRate * 0.045);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const slapNoise = ctx.createBufferSource();
    slapNoise.buffer = buffer;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(800, slapTime);

    const slapGain = ctx.createGain();
    slapGain.gain.setValueAtTime(0.55, slapTime);
    slapGain.gain.exponentialRampToValueAtTime(0.001, slapTime + 0.045);

    slapNoise.connect(hpFilter);
    hpFilter.connect(slapGain);
    slapGain.connect(dest);
    slapNoise.start(slapTime);
  }

  /** Rapid Casino Riffle Shuffle sequence (crisp multi-card cascade + bridge snap) */
  public playShuffle(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    for (let i = 0; i < 16; i++) {
      this.scheduleTimeout(() => {
        this.playCardSlide();
      }, i * 32);
    }
    this.scheduleTimeout(() => {
      this.playCardSlap();
    }, 520);
  }

  /** Crisp royal chime for live in-game chat message bubbles */
  public playChatPing(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const now = ctx.currentTime;

    const notes = [880, 1318.5]; // A5 -> E6
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(start);
      osc.stop(start + 0.17);
    });
  }

  /** Golden Fortune Wheel peg tick */
  public playWheelTick(pitchMultiplier = 1.0): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1550 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.032);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.034);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.036);
  }

  /** Loud Metallic Gold Coin Shower */
  public playCoinChime(count = 6): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const notes = [1567.98, 1975.53, 2349.32, 2637.02, 3135.96, 3520.0]; // G6..A7
    for (let i = 0; i < count; i++) {
      const startOffset = i * 0.06;
      const now = ctx.currentTime + startOffset;
      const freq = notes[i % notes.length];

      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(freq * 1.5, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      harmonic.connect(gain);
      gain.connect(dest);

      osc.start(now);
      harmonic.start(now);
      osc.stop(now + 0.4);
      harmonic.stop(now + 0.4);
    }
  }

  /** Grand Royal Trumpet Fanfare + Loud Metallic Coin Shower */
  public playWinFanfare(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    // Royal Trumpet Brass Fanfare notes (C5, E5, G5, C6, G5, C6)
    const fanfare = [
      { freq: 523.25, delay: 0.0, dur: 0.14 },
      { freq: 659.25, delay: 0.12, dur: 0.14 },
      { freq: 783.99, delay: 0.24, dur: 0.14 },
      { freq: 1046.5, delay: 0.36, dur: 0.28 },
      { freq: 783.99, delay: 0.62, dur: 0.14 },
      { freq: 1046.5, delay: 0.76, dur: 0.55 },
    ];

    fanfare.forEach(({ freq, delay, dur }) => {
      const start = ctx.currentTime + delay;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, start);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 0.5, start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, start);

      gain.gain.setValueAtTime(0.34, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + dur + 0.02);
      osc2.stop(start + dur + 0.02);
    });

    this.scheduleTimeout(() => this.playCoinChime(10), 250);
  }

  /** Subtle defeat chord */
  public playLoseSting(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const notes = [392.0, 349.23, 311.13, 261.63];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.36);
    });
  }
}

export const sound = new RoyalSoundEngine();

