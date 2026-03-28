import { describe, it, expect } from "vitest";
import { noteToMidi, midiToNote, MIDI_MIDDLE_C } from "../midi.js";

describe("MIDI_MIDDLE_C", () => {
  it("equals 60", () => {
    expect(MIDI_MIDDLE_C).toBe(60);
  });
});

describe("noteToMidi", () => {
  it("converts middle C (C4) to 60", () => {
    expect(noteToMidi("C", 4)).toBe(60);
  });

  it("converts C-1 (lowest C) to 0", () => {
    expect(noteToMidi("C", -1)).toBe(0);
  });

  it("converts G9 (127) correctly", () => {
    expect(noteToMidi("G", 9)).toBe(127);
  });

  it("converts A4 to 69 (concert pitch)", () => {
    expect(noteToMidi("A", 4)).toBe(69);
  });

  it("handles sharps and flats for the same pitch", () => {
    expect(noteToMidi("C#", 4)).toBe(61);
    expect(noteToMidi("Db", 4)).toBe(61);
  });

  it("throws for values below 0", () => {
    expect(() => noteToMidi("C", -2)).toThrow(RangeError);
  });

  it("throws for values above 127", () => {
    expect(() => noteToMidi("G", 10)).toThrow(RangeError);
  });

  it("covers a chromatic octave starting at C4", () => {
    const expected = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71];
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
    notes.forEach((note, i) => {
      expect(noteToMidi(note, 4)).toBe(expected[i]);
    });
  });
});

describe("midiToNote", () => {
  it("converts 60 to C4", () => {
    expect(midiToNote(60)).toEqual({ note: "C", octave: 4 });
  });

  it("converts 0 to C-1", () => {
    expect(midiToNote(0)).toEqual({ note: "C", octave: -1 });
  });

  it("converts 127 to G9", () => {
    expect(midiToNote(127)).toEqual({ note: "G", octave: 9 });
  });

  it("converts 69 to A4", () => {
    expect(midiToNote(69)).toEqual({ note: "A", octave: 4 });
  });

  it("uses sharps by default for accidentals", () => {
    expect(midiToNote(61)).toEqual({ note: "C#", octave: 4 });
    expect(midiToNote(70)).toEqual({ note: "A#", octave: 4 });
  });

  it("uses flats when preferFlats is true", () => {
    expect(midiToNote(61, true)).toEqual({ note: "Db", octave: 4 });
    expect(midiToNote(70, true)).toEqual({ note: "Bb", octave: 4 });
  });

  it("throws for MIDI values below 0", () => {
    expect(() => midiToNote(-1)).toThrow(RangeError);
  });

  it("throws for MIDI values above 127", () => {
    expect(() => midiToNote(128)).toThrow(RangeError);
  });

  it("throws for non-integer values", () => {
    expect(() => midiToNote(60.5)).toThrow(RangeError);
  });

  it("round-trips noteToMidi and midiToNote", () => {
    const notes = ["C", "D#", "G", "A", "B"] as const;
    for (const note of notes) {
      const midi = noteToMidi(note, 4);
      const result = midiToNote(midi);
      expect(result.note).toBe(note);
      expect(result.octave).toBe(4);
    }
  });
});
