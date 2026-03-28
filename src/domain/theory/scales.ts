import {
  chromaticToNoteName,
  keyUsesFlats,
  noteNameToChromatic,
  type NoteName,
} from "./notes.js";

/**
 * Intervals (in semitones) of a major scale from the root.
 * Indices 0–6 correspond to scale degrees 1–7.
 */
export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

/**
 * All major keys supported by the application.
 */
export const SUPPORTED_KEYS: ReadonlyArray<NoteName> = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "Gb",
  "Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
] as const;

/**
 * Generates the seven note names of the major scale for a given root key.
 *
 * @param key - The root note of the major scale (e.g. "C", "G", "F").
 * @returns An array of seven note names [degree1, degree2, ..., degree7].
 */
export function getMajorScaleNotes(key: NoteName): NoteName[] {
  const rootIndex = noteNameToChromatic(key);
  const preferFlats = keyUsesFlats(key);
  return MAJOR_SCALE_INTERVALS.map((interval) =>
    chromaticToNoteName(rootIndex + interval, preferFlats)
  );
}

/**
 * Returns `true` if `key` is among the supported major keys.
 */
export function isSupportedKey(key: string): key is NoteName {
  return (SUPPORTED_KEYS as ReadonlyArray<string>).includes(key);
}
