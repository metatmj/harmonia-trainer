import type {
  ExerciseConfig,
  ExerciseType,
  GeneratedQuestion,
  PlaybackPlan,
} from "../../types/index.js";
import { getMajorScaleNotes } from "../theory/scales.js";
import { getThirdAbove, getThirdBelow } from "../theory/degrees.js";
import type { NoteName } from "../theory/notes.js";

/** Fisher-Yates in-place shuffle; returns the same array. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("Cannot pick from empty array");
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Simple id that is unique for the session lifetime (not across runs). */
function makeId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Date.now().toString(36)}`;
}

/**
 * Builds distractors for a multiple-choice question.
 * Guarantees no duplicates and no repetition of the correct answer.
 */
function buildChoices(
  correct: NoteName,
  scaleNotes: NoteName[],
  count: number
): NoteName[] {
  const pool = scaleNotes.filter((n) => n !== correct);
  shuffle(pool);
  const distractors = pool.slice(0, count - 1);
  const all = [correct, ...distractors];
  shuffle(all);
  return all;
}

/** Resolves "mixed" direction to a concrete direction for a single question. */
function resolveDirection(
  direction: ExerciseConfig["direction"]
): "above" | "below" {
  if (direction === "mixed") {
    return Math.random() < 0.5 ? "above" : "below";
  }
  return direction;
}

function buildPlaybackPlan(
  key: NoteName,
  melody: NoteName[],
  config: ExerciseConfig
): PlaybackPlan {
  const beatMs = Math.round(60000 / Math.max(40, config.tempoBpm));
  const notes = [
    ...(config.playTonicBeforeQuestion
      ? [{ note: key, durationMs: beatMs }]
      : []),
    ...melody.map((note) => ({ note, durationMs: beatMs })),
  ];

  return { notes };
}

/** Generates a single question for the given exercise type and config. */
function generateQuestion(
  exerciseType: ExerciseType,
  config: ExerciseConfig,
  index: number
): GeneratedQuestion {
  const key = pickRandom(config.allowedKeys);
  const direction = resolveDirection(config.direction);
  const scaleNotes = getMajorScaleNotes(key);

  if (exerciseType === "match-third" || exerciseType === "sing-third") {
    const melodyNote = pickRandom(scaleNotes);
    const harmonyNote =
      direction === "above"
        ? getThirdAbove(melodyNote, key)
        : getThirdBelow(melodyNote, key);

    if (!harmonyNote) {
      throw new Error(
        `Could not compute harmony for ${melodyNote} in ${key} (${direction})`
      );
    }

    const choices =
      exerciseType === "match-third"
        ? buildChoices(harmonyNote, scaleNotes, config.choiceCount)
        : undefined;

    return {
      id: makeId("q", index),
      exerciseType,
      key,
      direction,
      melody: [melodyNote],
      expectedHarmony: [harmonyNote],
      choices,
      playbackPlan: buildPlaybackPlan(key, [melodyNote], config),
    };
  }

  // phrase-harmony: generate a phrase of melodyLength notes (clamp 3-5)
  const phraseLength = Math.max(3, Math.min(5, config.melodyLength));
  const melody: NoteName[] = [];
  const harmony: NoteName[] = [];

  for (let i = 0; i < phraseLength; i++) {
    const melodyNote = pickRandom(scaleNotes);
    const harmonyNote =
      direction === "above"
        ? getThirdAbove(melodyNote, key)
        : getThirdBelow(melodyNote, key);

    if (!harmonyNote) {
      throw new Error(
        `Could not compute harmony for ${melodyNote} in ${key} (${direction})`
      );
    }

    melody.push(melodyNote);
    harmony.push(harmonyNote);
  }

  return {
    id: makeId("q", index),
    exerciseType,
    key,
    direction,
    melody,
    expectedHarmony: harmony,
    playbackPlan: buildPlaybackPlan(key, melody, config),
  };
}

/**
 * Generates all questions for a session upfront.
 * For endless mode (questionCount = 0) a default batch of 10 is generated.
 */
export function generateQuestions(
  exerciseType: ExerciseType,
  config: ExerciseConfig
): GeneratedQuestion[] {
  const count = config.questionCount > 0 ? config.questionCount : 10;
  return Array.from({ length: count }, (_, i) =>
    generateQuestion(exerciseType, config, i)
  );
}
