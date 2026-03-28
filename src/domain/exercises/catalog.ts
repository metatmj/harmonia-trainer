import type { ExerciseTemplate } from "../../types/index.js";
import { SUPPORTED_KEYS } from "../theory/scales.js";

const ALL_KEYS = SUPPORTED_KEYS.slice() as ExerciseTemplate["defaultConfig"]["allowedKeys"];

export const EXERCISE_CATALOG: ExerciseTemplate[] = [
  {
    id: "1",
    slug: "match-third",
    title: "Match the Third",
    description:
      "Listen to a melody note and pick the correct third above or below from a set of choices.",
    type: "match-third",
    supportedInputTypes: ["multiple-choice"],
    supportedDirections: ["above", "below", "mixed"],
    defaultConfig: {
      direction: "above",
      allowedKeys: ALL_KEYS,
      questionCount: 10,
      melodyLength: 1,
      playbackMode: "auto",
      playTonicBeforeQuestion: false,
      allowReplay: true,
      tempoBpm: 80,
      choiceCount: 4,
      scoringMode: "first-attempt",
      inputType: "multiple-choice",
    },
    presets: [
      {
        id: "match-third-beginner",
        label: "Beginner – C major, 5 questions",
        config: {
          direction: "above",
          allowedKeys: ["C"],
          questionCount: 5,
          melodyLength: 1,
          playbackMode: "auto",
          playTonicBeforeQuestion: true,
          allowReplay: true,
          tempoBpm: 72,
          choiceCount: 3,
          scoringMode: "first-attempt",
          inputType: "multiple-choice",
        },
      },
      {
        id: "match-third-intermediate",
        label: "Intermediate – all keys, mixed, 10 questions",
        config: {
          direction: "mixed",
          allowedKeys: ALL_KEYS,
          questionCount: 10,
          melodyLength: 1,
          playbackMode: "auto",
          playTonicBeforeQuestion: false,
          allowReplay: true,
          tempoBpm: 80,
          choiceCount: 4,
          scoringMode: "first-attempt",
          inputType: "multiple-choice",
        },
      },
    ],
  },
  {
    id: "2",
    slug: "sing-third",
    title: "Sing the Third",
    description:
      "Hear a melody note and sing the correct harmony note (a third above or below) into the microphone.",
    type: "sing-third",
    supportedInputTypes: ["voice"],
    supportedDirections: ["above", "below", "mixed"],
    defaultConfig: {
      direction: "above",
      allowedKeys: ALL_KEYS,
      questionCount: 10,
      melodyLength: 1,
      playbackMode: "auto",
      playTonicBeforeQuestion: false,
      allowReplay: true,
      tempoBpm: 80,
      choiceCount: 1,
      scoringMode: "first-attempt",
      inputType: "voice",
    },
    presets: [
      {
        id: "sing-third-beginner",
        label: "Beginner – C major, 5 questions",
        config: {
          direction: "above",
          allowedKeys: ["C"],
          questionCount: 5,
          melodyLength: 1,
          playbackMode: "auto",
          playTonicBeforeQuestion: true,
          allowReplay: true,
          tempoBpm: 72,
          choiceCount: 1,
          scoringMode: "first-attempt",
          inputType: "voice",
        },
      },
    ],
  },
  {
    id: "3",
    slug: "phrase-harmony",
    title: "Phrase Harmony",
    description:
      "Listen to a short melody phrase and sing the full harmony line across all notes.",
    type: "phrase-harmony",
    supportedInputTypes: ["voice"],
    supportedDirections: ["above", "below", "mixed"],
    defaultConfig: {
      direction: "above",
      allowedKeys: ALL_KEYS,
      questionCount: 5,
      melodyLength: 4,
      playbackMode: "auto",
      playTonicBeforeQuestion: false,
      allowReplay: true,
      tempoBpm: 80,
      choiceCount: 1,
      scoringMode: "first-attempt",
      inputType: "voice",
    },
    presets: [
      {
        id: "phrase-harmony-beginner",
        label: "Beginner – C major, 3 questions",
        config: {
          direction: "above",
          allowedKeys: ["C"],
          questionCount: 3,
          melodyLength: 3,
          playbackMode: "auto",
          playTonicBeforeQuestion: true,
          allowReplay: true,
          tempoBpm: 72,
          choiceCount: 1,
          scoringMode: "first-attempt",
          inputType: "voice",
        },
      },
    ],
  },
];

/** Returns an exercise template by slug, or undefined if not found. */
export function getExerciseBySlug(slug: string): ExerciseTemplate | undefined {
  return EXERCISE_CATALOG.find((e) => e.slug === slug);
}
