import { describe, it, expect } from "vitest";
import {
  CHROMATIC_NOTES_SHARP,
  CHROMATIC_NOTES_FLAT,
  noteNameToChromatic,
  chromaticToNoteName,
  keyUsesFlats,
  normaliseNoteName,
} from "../notes.js";

describe("CHROMATIC_NOTES_SHARP", () => {
  it("has 12 entries starting with C", () => {
    expect(CHROMATIC_NOTES_SHARP).toHaveLength(12);
    expect(CHROMATIC_NOTES_SHARP[0]).toBe("C");
    expect(CHROMATIC_NOTES_SHARP[11]).toBe("B");
  });
});

describe("CHROMATIC_NOTES_FLAT", () => {
  it("has 12 entries starting with C", () => {
    expect(CHROMATIC_NOTES_FLAT).toHaveLength(12);
    expect(CHROMATIC_NOTES_FLAT[0]).toBe("C");
    expect(CHROMATIC_NOTES_FLAT[11]).toBe("B");
  });
});

describe("noteNameToChromatic", () => {
  it.each([
    ["C", 0],
    ["C#", 1],
    ["D", 2],
    ["D#", 3],
    ["E", 4],
    ["F", 5],
    ["F#", 6],
    ["G", 7],
    ["G#", 8],
    ["A", 9],
    ["A#", 10],
    ["B", 11],
  ] as const)("maps %s → %i (sharps)", (note, expected) => {
    expect(noteNameToChromatic(note)).toBe(expected);
  });

  it.each([
    ["Db", 1],
    ["Eb", 3],
    ["Gb", 6],
    ["Ab", 8],
    ["Bb", 10],
  ] as const)("maps %s → %i (flats)", (note, expected) => {
    expect(noteNameToChromatic(note)).toBe(expected);
  });

  it("throws for an unknown note name", () => {
    // @ts-expect-error intentional invalid input
    expect(() => noteNameToChromatic("X")).toThrow();
  });
});

describe("chromaticToNoteName", () => {
  it("returns sharp names by default", () => {
    expect(chromaticToNoteName(0)).toBe("C");
    expect(chromaticToNoteName(1)).toBe("C#");
    expect(chromaticToNoteName(10)).toBe("A#");
  });

  it("returns flat names when preferFlats is true", () => {
    expect(chromaticToNoteName(1, true)).toBe("Db");
    expect(chromaticToNoteName(10, true)).toBe("Bb");
  });

  it("wraps around for indices ≥ 12", () => {
    expect(chromaticToNoteName(12)).toBe("C");
    expect(chromaticToNoteName(13)).toBe("C#");
  });

  it("handles negative indices via modulo", () => {
    expect(chromaticToNoteName(-1)).toBe("B");
  });
});

describe("keyUsesFlats", () => {
  it.each(["F", "Bb", "Eb", "Ab", "Db", "Gb"] as const)(
    "returns true for %s",
    (key) => {
      expect(keyUsesFlats(key)).toBe(true);
    }
  );

  it.each(["C", "G", "D", "A", "E", "B", "F#"] as const)(
    "returns false for %s",
    (key) => {
      expect(keyUsesFlats(key)).toBe(false);
    }
  );
});

describe("normaliseNoteName", () => {
  it("returns the sharp equivalent for flat names", () => {
    expect(normaliseNoteName("Db")).toBe("C#");
    expect(normaliseNoteName("Eb")).toBe("D#");
    expect(normaliseNoteName("Gb")).toBe("F#");
    expect(normaliseNoteName("Ab")).toBe("G#");
    expect(normaliseNoteName("Bb")).toBe("A#");
  });

  it("returns natural notes unchanged", () => {
    expect(normaliseNoteName("C")).toBe("C");
    expect(normaliseNoteName("E")).toBe("E");
    expect(normaliseNoteName("G")).toBe("G");
  });
});
