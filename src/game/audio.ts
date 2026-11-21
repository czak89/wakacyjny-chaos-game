import { loadMuted, saveMuted } from './storage';

class BalticAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = loadMuted();
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private bgmPlaying = false;
  private userUnlocked = false;

  public unlock(): void {
    this.userUnlocked = true;
    this.ensureContext();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(next: boolean): void {
    this.muted = next;
    saveMuted(next);
    if (next) {
      this.stopMusic();
    }
  }

  public toggleMute(): boolean {
    this.userUnlocked = true;
    const next = !this.muted;
    this.setMuted(next);
    return next;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || !this.userUnlocked) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      this.ctx = new AudioCtor();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq?: number,
    delay = 0,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private jitter(base: number): number {
    return base * (0.93 + Math.random() * 0.14);
  }

  public playDash(): void {
    this.playTone(this.jitter(290), 0.13, 'triangle', 0.14, 620);
    this.playTone(this.jitter(180), 0.09, 'square', 0.06, 110, 0.02);
  }

  public playCatchInflatable(combo: number): void {
    const pitchBoost = 1 + Math.min(combo, 8) * 0.06;
    this.playTone(this.jitter(440 * pitchBoost), 0.09, 'square', 0.1, 660 * pitchBoost);
    this.playTone(this.jitter(660 * pitchBoost), 0.12, 'triangle', 0.11, 880 * pitchBoost, 0.06);
  }

  public playWaffle(isGolden: boolean): void {
    if (isGolden) {
      this.playTone(587.3, 0.1, 'square', 0.11);
      this.playTone(783.9, 0.1, 'square', 0.11, undefined, 0.07);
      this.playTone(1046.5, 0.18, 'triangle', 0.14, 1174.6, 0.14);
    } else {
      this.playTone(this.jitter(523.25), 0.08, 'triangle', 0.11, 698.46);
      this.playTone(this.jitter(698.46), 0.1, 'square', 0.07, 880, 0.05);
    }
  }

  public playKidFound(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.11, 'square', 0.09, undefined, idx * 0.065);
    });
  }

  public playSeagullTelegraph(): void {
    this.playTone(this.jitter(720), 0.16, 'sawtooth', 0.07, 1180);
    this.playTone(this.jitter(960), 0.14, 'sawtooth', 0.06, 680, 0.12);
  }

  public playHit(): void {
    this.playTone(190, 0.22, 'sawtooth', 0.16, 68);
    this.playTone(130, 0.18, 'square', 0.13, 55, 0.03);
  }

  public playSplashEscape(): void {
    this.playTone(320, 0.16, 'triangle', 0.08, 130);
  }

  public playChaosEvent(): void {
    const fanfare = [392, 493.88, 587.33, 783.99];
    fanfare.forEach((n, i) => {
      this.playTone(n, 0.13, 'square', 0.085, undefined, i * 0.08);
    });
  }

  public playThunder(): void {
    // Sharp electric crack followed by low rolling Baltic thunder
    this.playTone(this.jitter(620), 0.09, 'sawtooth', 0.11, 140);
    this.playTone(this.jitter(115), 0.42, 'sawtooth', 0.13, 46, 0.04);
    this.playTone(this.jitter(78), 0.55, 'triangle', 0.14, 42, 0.12);
  }

  public playWindGust(): void {
    // Sweeping airy whistle for strong Baltic wind
    this.playTone(this.jitter(240), 0.35, 'triangle', 0.08, 490);
    this.playTone(this.jitter(460), 0.42, 'sine', 0.06, 210, 0.18);
  }

  public playAchievement(): void {
    const chime = [523.25, 659.25, 783.99, 987.77, 1046.5];
    chime.forEach((n, i) => {
      this.playTone(n, i === chime.length - 1 ? 0.24 : 0.1, 'triangle', 0.12, undefined, i * 0.06);
      this.playTone(n * 0.5, 0.09, 'square', 0.045, undefined, i * 0.06);
    });
  }

  public playGameOver(): void {
    const notes = [440, 392, 349.23, 261.63];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'sawtooth', 0.09, n * 0.92, idx * 0.16);
    });
  }

  public startMusic(): void {
    if (this.muted || this.bgmPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Cheerful sunny 8-bit Baltic seaside melody loop (C major / G mixolydian bounce)
    const melody = [
      523.25, 0, 659.25, 587.33, 659.25, 783.99, 659.25, 0,
      587.33, 0, 698.46, 659.25, 587.33, 493.88, 392.0, 0,
      523.25, 659.25, 783.99, 0, 880.0, 783.99, 659.25, 523.25,
      587.33, 659.25, 587.33, 493.88, 523.25, 0, 392.0, 0,
    ];
    const bass = [
      130.81, 0, 196.0, 0, 130.81, 0, 196.0, 0,
      146.83, 0, 196.0, 0, 146.83, 0, 196.0, 0,
      164.81, 0, 196.0, 0, 174.61, 0, 196.0, 0,
      146.83, 0, 196.0, 0, 130.81, 0, 196.0, 0,
    ];

    this.bgmTimer = window.setInterval(() => {
      if (this.muted || !this.bgmPlaying) return;
      const idx = this.bgmStep % melody.length;
      const lead = melody[idx];
      const low = bass[idx];
      if (lead > 0) {
        this.playTone(lead, 0.12, 'square', 0.032);
      }
      if (low > 0) {
        this.playTone(low, 0.15, 'triangle', 0.045);
      }
      this.bgmStep += 1;
    }, 185);
  }

  public stopMusic(): void {
    this.bgmPlaying = false;
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audio = new BalticAudioEngine();
