import { describe, expect, it } from "vitest";
import {
  detectPitchFromTimeDomainData,
  frequencyToMidi,
} from "../pitch-detector.js";

function buildSineWave(
  frequency: number,
  sampleRate: number,
  length: number
): Float32Array {
  return Float32Array.from({ length }, (_, index) =>
    Math.sin((2 * Math.PI * frequency * index) / sampleRate)
  );
}

describe("frequencyToMidi", () => {
  it("maps concert A to MIDI 69", () => {
    expect(frequencyToMidi(440)).toBe(69);
  });

  it("maps middle C close to MIDI 60", () => {
    expect(frequencyToMidi(261.63)).toBe(60);
  });
});

describe("detectPitchFromTimeDomainData", () => {
  it("returns null for a nearly silent signal", () => {
    const silent = new Float32Array(2048);
    expect(detectPitchFromTimeDomainData(silent, 44100)).toBeNull();
  });

  it("detects concert A from a clean sine wave", () => {
    const signal = buildSineWave(440, 44100, 2048);
    const detection = detectPitchFromTimeDomainData(signal, 44100);

    expect(detection).not.toBeNull();
    expect(detection?.midi).toBe(69);
    expect(detection?.note).toBe("A");
    expect(detection?.confidence).toBeGreaterThan(0.4);
  });

  it("prefers flat note names when the key convention uses flats", () => {
    const signal = buildSineWave(466.16, 44100, 2048);
    const detection = detectPitchFromTimeDomainData(signal, 44100, {
      preferFlatsForKey: "Bb",
    });

    expect(detection?.note).toBe("Bb");
  });
});
