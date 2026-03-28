import type { PlaybackPlan } from "../types/index.js";
import { noteNameToChromatic } from "../domain/theory/notes.js";
import type { NoteName } from "../domain/theory/notes.js";

const NOTE_GAP_SECONDS = 0.05;
const DEFAULT_OCTAVE = 4;

type BrowserAudioContext = typeof AudioContext;

function getAudioContextConstructor(): BrowserAudioContext | null {
  const windowWithWebkit = window as Window & {
    webkitAudioContext?: BrowserAudioContext;
  };

  return window.AudioContext ?? windowWithWebkit.webkitAudioContext ?? null;
}

function noteNameToFrequency(note: NoteName, octave = DEFAULT_OCTAVE): number {
  const midi = 12 * (octave + 1) + noteNameToChromatic(note);
  return 440 * 2 ** ((midi - 69) / 12);
}

export class PromptAudioPlayer {
  private audioContext: AudioContext | null = null;
  private oscillators = new Set<OscillatorNode>();
  private completionTimer: number | null = null;
  private playbackToken = 0;

  async play(plan: PlaybackPlan): Promise<void> {
    if (plan.notes.length === 0) return;

    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) {
      throw new Error("Audio playback is not available in this browser.");
    }

    this.stop();

    if (this.audioContext === null) {
      this.audioContext = new AudioContextCtor();
    }

    await this.audioContext.resume();

    const token = ++this.playbackToken;
    const context = this.audioContext;
    const startTime = context.currentTime + 0.02;
    let cursorSeconds = 0;

    for (const playbackNote of plan.notes) {
      const durationSeconds = Math.max(playbackNote.durationMs / 1000, 0.12);
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = noteNameToFrequency(playbackNote.note);

      gainNode.gain.setValueAtTime(0.0001, startTime + cursorSeconds);
      gainNode.gain.linearRampToValueAtTime(0.18, startTime + cursorSeconds + 0.02);
      gainNode.gain.setValueAtTime(
        0.18,
        startTime + cursorSeconds + Math.max(durationSeconds - 0.05, 0.02)
      );
      gainNode.gain.linearRampToValueAtTime(
        0.0001,
        startTime + cursorSeconds + durationSeconds
      );

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(startTime + cursorSeconds);
      oscillator.stop(startTime + cursorSeconds + durationSeconds);
      oscillator.addEventListener("ended", () => {
        this.oscillators.delete(oscillator);
      });

      this.oscillators.add(oscillator);
      cursorSeconds += durationSeconds + NOTE_GAP_SECONDS;
    }

    const totalDurationMs = Math.ceil(cursorSeconds * 1000);

    await new Promise<void>((resolve) => {
      this.completionTimer = window.setTimeout(() => {
        if (token !== this.playbackToken) {
          resolve();
          return;
        }

        this.completionTimer = null;
        resolve();
      }, totalDurationMs);
    });
  }

  stop(): void {
    this.playbackToken += 1;

    if (this.completionTimer !== null) {
      window.clearTimeout(this.completionTimer);
      this.completionTimer = null;
    }

    for (const oscillator of this.oscillators) {
      try {
        oscillator.stop();
      } catch {
        // Ignore InvalidStateError if the oscillator already ended.
      }
    }

    this.oscillators.clear();
  }
}

export const promptAudioPlayer = new PromptAudioPlayer();
