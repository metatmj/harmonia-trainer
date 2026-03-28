import { describe, it, expect } from "vitest";
import { getMajorScaleNotes, isSupportedKey, SUPPORTED_KEYS } from "../scales.js";

describe("getMajorScaleNotes", () => {
  it("returns 7 notes for C major", () => {
    const scale = getMajorScaleNotes("C");
    expect(scale).toHaveLength(7);
    expect(scale).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
  });

  it("returns correct notes for G major (1 sharp)", () => {
    expect(getMajorScaleNotes("G")).toEqual(["G", "A", "B", "C", "D", "E", "F#"]);
  });

  it("returns correct notes for D major (2 sharps)", () => {
    expect(getMajorScaleNotes("D")).toEqual(["D", "E", "F#", "G", "A", "B", "C#"]);
  });

  it("returns correct notes for F major (1 flat)", () => {
    expect(getMajorScaleNotes("F")).toEqual(["F", "G", "A", "Bb", "C", "D", "E"]);
  });

  it("returns correct notes for Bb major (2 flats)", () => {
    expect(getMajorScaleNotes("Bb")).toEqual(["Bb", "C", "D", "Eb", "F", "G", "A"]);
  });

  it("returns correct notes for Eb major (3 flats)", () => {
    expect(getMajorScaleNotes("Eb")).toEqual(["Eb", "F", "G", "Ab", "Bb", "C", "D"]);
  });

  it("returns correct notes for Ab major (4 flats)", () => {
    expect(getMajorScaleNotes("Ab")).toEqual(["Ab", "Bb", "C", "Db", "Eb", "F", "G"]);
  });

  it("returns correct notes for F# major (6 sharps)", () => {
    // E# is returned as its enharmonic equivalent "F" since E# is not in the type system
    expect(getMajorScaleNotes("F#")).toEqual(["F#", "G#", "A#", "B", "C#", "D#", "F"]);
  });

  it("covers all 13 supported keys without throwing", () => {
    for (const key of SUPPORTED_KEYS) {
      expect(() => getMajorScaleNotes(key)).not.toThrow();
      expect(getMajorScaleNotes(key)).toHaveLength(7);
    }
  });
});

describe("isSupportedKey", () => {
  it("returns true for all supported keys", () => {
    for (const key of SUPPORTED_KEYS) {
      expect(isSupportedKey(key)).toBe(true);
    }
  });

  it("returns false for unsupported strings", () => {
    expect(isSupportedKey("H")).toBe(false);
    expect(isSupportedKey("X#")).toBe(false);
    expect(isSupportedKey("")).toBe(false);
  });
});
