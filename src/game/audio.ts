export const AUDIO_PREF_KEY = 'dtf-ganjumanji-audio-v1';

export type AudioCue = 'move' | 'relic' | 'ward' | 'checkpoint' | 'damage' | 'region' | 'win' | 'lose';

const cueMap: Record<AudioCue, { frequency: number; duration: number; gain: number; second?: number }> = {
  move: { frequency: 180, duration: 0.045, gain: 0.018 },
  relic: { frequency: 720, duration: 0.16, gain: 0.055, second: 980 },
  ward: { frequency: 520, duration: 0.13, gain: 0.045, second: 680 },
  checkpoint: { frequency: 420, duration: 0.18, gain: 0.045, second: 610 },
  damage: { frequency: 110, duration: 0.18, gain: 0.06 },
  region: { frequency: 330, duration: 0.22, gain: 0.05, second: 660 },
  win: { frequency: 660, duration: 0.34, gain: 0.06, second: 990 },
  lose: { frequency: 140, duration: 0.32, gain: 0.05, second: 90 }
};

export class GameAudio {
  private context: AudioContext | null = null;
  private enabled = true;

  constructor(private readonly storage: Storage | null) {
    try { this.enabled = storage?.getItem(AUDIO_PREF_KEY) !== 'off'; } catch {}
  }

  isEnabled() { return this.enabled; }

  toggle() {
    this.enabled = !this.enabled;
    try { this.storage?.setItem(AUDIO_PREF_KEY, this.enabled ? 'on' : 'off'); } catch {}
    return this.enabled;
  }

  play(cue: AudioCue) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      this.context ??= new AudioCtor();
      const config = cueMap[cue];
      const now = this.context.currentTime;
      void this.context.resume();
      this.tone(config.frequency, now, config.duration, config.gain);
      if (config.second) this.tone(config.second, now + config.duration * 0.55, config.duration, config.gain * 0.8);
    } catch {
      // Audio is progressive enhancement; gameplay must never depend on it.
    }
  }

  private tone(frequency: number, start: number, duration: number, peak: number) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}
