import type {
  CompletedSessionRecord,
  ExerciseSession,
  SessionEngineSnapshot,
} from "../../types/index.js";
import type { SessionEngine } from "./engine.js";

const SNAPSHOT_STORAGE_KEY = "harmonia-trainer/session-engine/v1";
const HISTORY_STORAGE_KEY = "harmonia-trainer/session-history/v1";
const MAX_HISTORY_ENTRIES = 12;

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveSessionEngineSnapshot(engine: SessionEngine): void {
  if (!hasStorage()) return;

  const snapshot = engine.exportState();
  if (snapshot.sessions.length === 0 || snapshot.activeSessionId === null) {
    window.localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
}

export function restoreSessionEngineSnapshot(
  engine: SessionEngine
): SessionEngineSnapshot | null {
  if (!hasStorage()) return null;

  const raw = window.localStorage.getItem(SNAPSHOT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const snapshot = JSON.parse(raw) as SessionEngineSnapshot;
    if (!Array.isArray(snapshot.sessions)) {
      throw new Error("Invalid stored session snapshot");
    }

    engine.hydrate(snapshot);
    return snapshot;
  } catch {
    window.localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
    return null;
  }
}

function isValidCompletedSessionRecord(value: unknown): value is CompletedSessionRecord {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<CompletedSessionRecord>;
  return (
    typeof candidate.sessionId === "string" &&
    typeof candidate.exerciseType === "string" &&
    typeof candidate.startedAt === "string" &&
    typeof candidate.endedAt === "string" &&
    typeof candidate.summary === "object" &&
    candidate.summary !== null &&
    typeof candidate.summary.accuracy === "number" &&
    typeof candidate.summary.firstAttemptCorrect === "number" &&
    typeof candidate.summary.totalAttempts === "number" &&
    typeof candidate.summary.totalQuestions === "number" &&
    typeof candidate.summary.totalTimeMs === "number" &&
    typeof candidate.config === "object" &&
    candidate.config !== null &&
    typeof candidate.config.direction === "string" &&
    typeof candidate.config.inputType === "string" &&
    typeof candidate.config.questionCount === "number"
  );
}

function readStoredHistory(): CompletedSessionRecord[] {
  if (!hasStorage()) return [];

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("Invalid session history payload");
    }

    return parsed.filter(isValidCompletedSessionRecord);
  } catch {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    return [];
  }
}

export function loadCompletedSessionHistory(): CompletedSessionRecord[] {
  return readStoredHistory();
}

export function saveCompletedSessionHistoryEntry(session: ExerciseSession): void {
  if (!hasStorage() || session.status !== "completed" || !session.summary || !session.endedAt) {
    return;
  }

  const nextEntry: CompletedSessionRecord = {
    sessionId: session.id,
    exerciseType: session.exerciseType,
    config: {
      direction: session.config.direction,
      inputType: session.config.inputType,
      questionCount: session.config.questionCount,
    },
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    summary: session.summary,
  };

  const existing = readStoredHistory().filter((entry) => entry.sessionId !== session.id);
  const nextHistory = [nextEntry, ...existing]
    .sort((left, right) => right.endedAt.localeCompare(left.endedAt))
    .slice(0, MAX_HISTORY_ENTRIES);

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
}
