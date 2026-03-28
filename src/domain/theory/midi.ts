import { noteNameToChromatic, chromaticToNoteName, type NoteName } from "./notes.js";

/**
 * MIDI note number for middle C (C4).
 * Per the General MIDI standard: C4 = 60.
 */
export const MIDI_MIDDLE_C = 60;

/**
 * The octave number that corresponds to MIDI note 0.
 * C-1 = MIDI 0 → octaveOffset = -1.
 */
const OCTAVE_OFFSET = -1;

/**
 * Converts a note name and octave to a MIDI note number.
 *
 * @param note   - Note name (e.g. "C", "F#").
 * @param octave - Scientific octave number (e.g. 4 for middle C).
 * @returns MIDI note number (0–127).
 * @throws If the resulting MIDI value is outside 0–127.
 */
export function noteToMidi(note: NoteName, octave: number): number {
  const chromatic = noteNameToChromatic(note);
  const midi = (octave - OCTAVE_OFFSET) * 12 + chromatic;
  if (midi < 0 || midi > 127) {
    throw new RangeError(
      `MIDI value ${midi} out of range for ${note}${octave}`
    );
  }
  return midi;
}

/**
 * Converts a MIDI note number to a note name and octave.
 *
 * @param midi        - MIDI note number (0–127).
 * @param preferFlats - When `true`, uses flat accidentals (e.g. "Bb" instead of "A#").
 * @returns An object containing the note name and octave.
 * @throws If `midi` is outside 0–127.
 */
export function midiToNote(
  midi: number,
  preferFlats = false
): { note: NoteName; octave: number } {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
    throw new RangeError(`MIDI value ${midi} is out of range (0–127)`);
  }
  const octave = Math.floor(midi / 12) + OCTAVE_OFFSET;
  const chromaticIndex = midi % 12;
  const note = chromaticToNoteName(chromaticIndex, preferFlats);
  return { note, octave };
}
