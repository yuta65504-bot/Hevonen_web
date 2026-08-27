export enum SoundEffect {
  RACE_START = "RACE_START",
  FANFARE = "FANFARE",
}

export interface SoundEffectPlayer {
  play(effect: SoundEffect): void;
  dispose(): void;
}

class WebAudioPlayer implements SoundEffectPlayer {
  private ctx: AudioContext | null = null;

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

  play(effect: SoundEffect): void {
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
      // quick fanfare: two short beeps
      mkOsc(880, "square", 0.2, 0.12, now);
      mkOsc(1318, "square", 0.2, 0.18, now + 0.14);
    } else if (effect === SoundEffect.FANFARE) {
      // triumphant arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => mkOsc(f, "sine", 0.22, 0.35, now + i * 0.12));
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
  play(): void {}
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
