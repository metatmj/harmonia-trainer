/**
 * Chromatic note names using sharps (12-tone equal temperament).
 * Index 0 = C, index 1 = C#/Db, ..., index 11 = B.
 */
export const CHROMATIC_NOTES_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

/**
 * Chromatic note names using flats.
 */
export const CHROMATIC_NOTES_FLAT = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

export type NoteName =
  | "C"
  | "C#"
  | "Db"
  | "D"
  | "D#"
  | "Eb"
  | "E"
  | "F"
  | "F#"
  | "Gb"
  | "G"
  | "G#"
  | "Ab"
  | "A"
  | "A#"
  | "Bb"
  | "B";

/**
 * Keys that use flat notation for accidentals.
 */
const FLAT_KEYS = new Set<NoteName>([
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
  "Gb",
]);

/**
 * Returns the chromatic index (0–11) for a given note name.
 * Throws if the note name is unrecognised.
 */
export function noteNameToChromatic(note: NoteName): number {
  const idx = CHROMATIC_NOTES_SHARP.indexOf(note as never);
  if (idx !== -1) return idx;
  const idx2 = CHROMATIC_NOTES_FLAT.indexOf(note as never);
  if (idx2 !== -1) return idx2;
  throw new Error(`Unknown note name: ${note}`);
}

/**
 * Returns the canonical note name for a chromatic index using sharps or flats
 * depending on the `preferFlats` flag.
 */
export function chromaticToNoteName(
  chromaticIndex: number,
  preferFlats = false
): NoteName {
  const idx = ((chromaticIndex % 12) + 12) % 12;
  return (preferFlats ? CHROMATIC_NOTES_FLAT[idx] : CHROMATIC_NOTES_SHARP[idx]) as NoteName;
}

/**
 * Returns `true` if the given key name conventionally uses flat accidentals.
 */
export function keyUsesFlats(key: NoteName): boolean {
  return FLAT_KEYS.has(key);
}

/**
 * Normalises an enharmonic note name to its sharp-based equivalent.
 * e.g. "Db" → "C#", "Bb" → "A#"
 */
export function normaliseNoteName(note: NoteName): NoteName {
  return chromaticToNoteName(noteNameToChromatic(note), false);
}
