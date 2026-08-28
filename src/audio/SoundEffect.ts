export enum SoundEffect {
  RACE_START = "RACE_START",
  FANFARE = "FANFARE",
  FANFARE_LOSE = "FANFARE_LOSE",
  COUNTDOWN_TICK = "COUNTDOWN_TICK",
  COUNTDOWN_GO = "COUNTDOWN_GO",
  PHOTO_FINISH = "PHOTO_FINISH",
  HOOF = "HOOF",
}

export interface SoundEffectPlayer {
  play(effect: SoundEffect): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  dispose(): void;
}

const MUTE_KEY = "hevonen_muted";

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
}

class WebAudioPlayer implements SoundEffectPlayer {
  private ctx: AudioContext | null = null;
  private muted: boolean = loadMuted();

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (this.ctx) return this.ctx;
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      this.ctx = new Ctx();
      return this.ctx;
    } catch {
      return null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    saveMuted(muted);
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(effect: SoundEffect): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const mkOsc = (freq: number, type: OscillatorType, gain: number, duration: number, startAt: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, startAt);
      g.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.connect(g).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration);
    };

    if (effect === SoundEffect.RACE_START) {
      mkOsc(880, "square", 0.2, 0.12, now);
      mkOsc(1318, "square", 0.2, 0.18, now + 0.14);
    } else if (effect === SoundEffect.FANFARE) {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => mkOsc(f, "sine", 0.22, 0.35, now + i * 0.12));
    } else if (effect === SoundEffect.FANFARE_LOSE) {
      mkOsc(440, "sine", 0.18, 0.25, now);
      mkOsc(349, "sine", 0.18, 0.4, now + 0.18);
    } else if (effect === SoundEffect.COUNTDOWN_TICK) {
      mkOsc(600, "sine", 0.25, 0.12, now);
    } else if (effect === SoundEffect.COUNTDOWN_GO) {
      mkOsc(880, "square", 0.22, 0.14, now);
      mkOsc(1318, "square", 0.22, 0.2, now + 0.14);
    } else if (effect === SoundEffect.PHOTO_FINISH) {
      [880, 1108, 1318].forEach((f, i) => mkOsc(f, "sine", 0.2, 0.22, now + i * 0.09));
    } else if (effect === SoundEffect.HOOF) {
      // short low thud for hoof - use square low freq
      mkOsc(120, "square", 0.12, 0.06, now);
      mkOsc(90, "square", 0.08, 0.05, now + 0.03);
    }
  }

  dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

class NoopPlayer implements SoundEffectPlayer {
  private muted = false;
  play(): void {}
  setMuted(muted: boolean): void { this.muted = muted; }
  isMuted(): boolean { return this.muted; }
  dispose(): void {}
}

export function createSoundEffectPlayer(): SoundEffectPlayer {
  if (typeof window === "undefined") return new NoopPlayer();
  try {
    if (!window.AudioContext && !(window as unknown as { webkitAudioContext: unknown }).webkitAudioContext) {
      return new NoopPlayer();
    }
  } catch {
    return new NoopPlayer();
  }
  return new WebAudioPlayer();
}

export { MUTE_KEY };
