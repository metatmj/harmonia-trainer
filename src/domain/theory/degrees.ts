import { getMajorScaleNotes } from "./scales.js";
import { type NoteName } from "./notes.js";

/**
 * Scale degree as a 1-based integer (1–7).
 */
export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Mapping: scale degree → third above (within the same major key).
 * Wraps around the octave: 6→1 and 7→2.
 */
export const THIRD_ABOVE_MAP: Readonly<Record<ScaleDegree, ScaleDegree>> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 1,
  7: 2,
};

/**
 * Mapping: scale degree → third below (within the same major key).
 */
export const THIRD_BELOW_MAP: Readonly<Record<ScaleDegree, ScaleDegree>> = {
  1: 6,
  2: 7,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
};

/**
 * Returns the scale degree (1–7) of `note` within the given major `key`.
 * Returns `null` if the note is not diatonic to the key.
 */
export function getScaleDegree(note: NoteName, key: NoteName): ScaleDegree | null {
  const scale = getMajorScaleNotes(key);
  const idx = scale.indexOf(note);
  if (idx === -1) return null;
  return (idx + 1) as ScaleDegree;
}

/**
 * Returns the note name a third above `note` within the major scale of `key`.
 */
export function getThirdAbove(note: NoteName, key: NoteName): NoteName | null {
  const degree = getScaleDegree(note, key);
  if (degree === null) return null;
  const targetDegree = THIRD_ABOVE_MAP[degree];
  const scale = getMajorScaleNotes(key);
  return scale[targetDegree - 1];
}

/**
 * Returns the note name a third below `note` within the major scale of `key`.
 */
export function getThirdBelow(note: NoteName, key: NoteName): NoteName | null {
  const degree = getScaleDegree(note, key);
  if (degree === null) return null;
  const targetDegree = THIRD_BELOW_MAP[degree];
  const scale = getMajorScaleNotes(key);
  return scale[targetDegree - 1];
}
