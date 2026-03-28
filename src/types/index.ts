import type { NoteName } from "../domain/theory/notes.js";

// ─── Primitive enumerations ──────────────────────────────────────────────────

export type ExerciseType = "match-third" | "sing-third" | "phrase-harmony";
export type InputType = "multiple-choice" | "note-button" | "voice";
export type Direction = "above" | "below" | "mixed";
export type PlaybackMode = "auto" | "manual";
export type ScoringMode = "first-attempt";
export type SessionStatus = "draft" | "active" | "completed" | "abandoned";
/**
 * Feedback codes shared by both multiple-choice/note-button and voice answers.
 * PitchJudgement is kept as a separate alias because voice evaluation may
 * eventually expose finer-grained pitch offsets (e.g. cents) that do not
 * apply to discrete-choice feedback.
 */
export type FeedbackCode =
  | "correct"
  | "near-high"
  | "near-low"
  | "wrong"
  | "same-as-melody"
  | "no-input";
export type PitchJudgement = FeedbackCode;

// ─── Exercise template & config ───────────────────────────────────────────────

export interface ExercisePreset {
  id: string;
  label: string;
  config: ExerciseConfig;
}

export interface ExerciseTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ExerciseType;
  supportedInputTypes: InputType[];
  supportedDirections: Direction[];
  defaultConfig: ExerciseConfig;
  presets: ExercisePreset[];
}

export interface ExerciseConfig {
  direction: Direction;
  allowedKeys: NoteName[];
  /** Number of questions; 0 = endless mode. */
  questionCount: number;
  melodyLength: number;
  playbackMode: PlaybackMode;
  playTonicBeforeQuestion: boolean;
  allowReplay: boolean;
  tempoBpm: number;
  choiceCount: number;
  scoringMode: ScoringMode;
  inputType: InputType;
}

// ─── Question & answer models ─────────────────────────────────────────────────

export interface PlaybackNote {
  note: NoteName;
  durationMs: number;
}

export interface PlaybackPlan {
  notes: PlaybackNote[];
}

export interface GeneratedQuestion {
  id: string;
  exerciseType: ExerciseType;
  key: NoteName;
  /** Resolved direction for this individual question (never "mixed"). */
  direction: "above" | "below";
  melody: NoteName[];
  expectedHarmony: NoteName[];
  /** Available for multiple-choice exercises. */
  choices?: NoteName[];
  playbackPlan?: PlaybackPlan;
  metadata?: Record<string, unknown>;
}

export type UserAnswer =
  | { type: "multiple-choice"; choiceIndex: number; choiceValue: NoteName }
  | { type: "note-button"; midi: number; note: NoteName }
  | { type: "voice"; detectedMidi?: number; detectedNote?: NoteName; confidence: number };

export interface AnswerEvaluation {
  isCorrect: boolean;
  /** False for replay-triggered or non-scoring interactions. */
  countedForScore: boolean;
  expected: NoteName[];
  actual: NoteName | null;
  pitchJudgement?: PitchJudgement;
  feedbackCode: FeedbackCode;
  feedbackMessage: string;
}

// ─── Session model ────────────────────────────────────────────────────────────

export interface SessionSummary {
  totalQuestions: number;
  firstAttemptCorrect: number;
  /** First-attempt accuracy as an integer percentage 0-100. */
  accuracy: number;
  totalAttempts: number;
  totalTimeMs: number;
  byKey?: Record<string, { total: number; firstAttemptCorrect: number }>;
  byDirection?: Record<"above" | "below", { total: number; firstAttemptCorrect: number }>;
}

export interface ExerciseSession {
  id: string;
  exerciseType: ExerciseType;
  config: ExerciseConfig;
  status: SessionStatus;
  questions: GeneratedQuestion[];
  /** answers[i] holds every submitted answer for question index i. */
  answers: UserAnswer[][];
  /** evaluations[i] holds every evaluation for question index i. */
  evaluations: AnswerEvaluation[][];
  currentQuestionIndex: number;
  /** ISO-8601 timestamp. */
  startedAt: string;
  endedAt?: string;
  summary?: SessionSummary;
}
