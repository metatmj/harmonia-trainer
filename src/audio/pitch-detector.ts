import { midiToNote } from "../domain/theory/midi.js";
import { keyUsesFlats, type NoteName } from "../domain/theory/notes.js";

const DEFAULT_CONFIDENCE_FLOOR = 0.45;
const MIN_RMS = 0.01;

export interface PitchDetection {
  frequency: number;
  midi: number;
  note: NoteName;
  confidence: number;
}

export interface PitchDetectionOptions {
  preferFlatsForKey?: NoteName;
}

export function frequencyToMidi(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

export function detectPitchFromTimeDomainData(
  samples: Float32Array,
  sampleRate: number,
  options: PitchDetectionOptions = {}
): PitchDetection | null {
  const rms = Math.sqrt(
    samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length
  );

  if (rms < MIN_RMS) {
    return null;
  }

  const frequency = autoCorrelate(samples, sampleRate);
  if (frequency === null) {
    return null;
  }

  const midi = frequencyToMidi(frequency);
  const preferFlats = options.preferFlatsForKey
    ? keyUsesFlats(options.preferFlatsForKey)
    : false;
  const { note } = midiToNote(midi, preferFlats);
  const confidence = Math.max(
    DEFAULT_CONFIDENCE_FLOOR,
    Math.min(1, Math.min(1, rms * 8))
  );

  return {
    frequency,
    midi,
    note,
    confidence,
  };
}

function autoCorrelate(
  samples: Float32Array,
  sampleRate: number
): number | null {
  const size = samples.length;
  const correlations = new Float32Array(size);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let foundGoodCorrelation = false;
  let lastCorrelation = 1;

  for (let offset = 8; offset < size / 2; offset++) {
    let difference = 0;
    for (let i = 0; i < size - offset; i++) {
      difference += Math.abs(samples[i] - samples[i + offset]);
    }

    const correlation = 1 - difference / (size - offset);
    correlations[offset] = correlation;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      const shift =
        (correlations[bestOffset + 1] - correlations[bestOffset - 1]) /
        correlations[bestOffset];
      return sampleRate / (bestOffset + 8 * shift);
    }

    lastCorrelation = correlation;
  }

  if (bestOffset === -1 || bestCorrelation < 0.1) {
    return null;
  }

  return sampleRate / bestOffset;
}

export class MicrophonePitchDetector {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private onUpdate: ((pitch: PitchDetection | null) => void) | null = null;
  private preferFlatsForKey?: NoteName;

  async startListening(
    options: PitchDetectionOptions,
    onUpdate: (pitch: PitchDetection | null) => void
  ): Promise<void> {
    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      throw new Error("Microphone capture is not available in this browser.");
    }

    this.stopListening();

    this.preferFlatsForKey = options.preferFlatsForKey;
    this.onUpdate = onUpdate;
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextCtor = window.AudioContext;
    if (!AudioContextCtor) {
      throw new Error("Web Audio is not available in this browser.");
    }

    this.audioContext = new AudioContextCtor();
    await this.audioContext.resume();

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.sourceNode.connect(this.analyserNode);

    const buffer = new Float32Array(this.analyserNode.fftSize);
    const tick = () => {
      if (!this.analyserNode || !this.audioContext) return;

      this.analyserNode.getFloatTimeDomainData(buffer);
      const detection = detectPitchFromTimeDomainData(
        buffer,
        this.audioContext.sampleRate,
        { preferFlatsForKey: this.preferFlatsForKey }
      );

      this.onUpdate?.(detection);
      this.animationFrameId = window.requestAnimationFrame(tick);
    };

    tick();
  }

  stopListening(): void {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.sourceNode?.disconnect();
    this.analyserNode?.disconnect();
    this.sourceNode = null;
    this.analyserNode = null;

    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    this.onUpdate?.(null);
    this.onUpdate = null;
  }
}

export const microphonePitchDetector = new MicrophonePitchDetector();
