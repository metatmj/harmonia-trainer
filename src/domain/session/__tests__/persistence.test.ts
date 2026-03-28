import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExerciseSession } from "../../../types/index.js";
import {
  loadCompletedSessionHistory,
  restoreSessionEngineSnapshot,
  saveCompletedSessionHistoryEntry,
  saveSessionEngineSnapshot,
} from "../persistence.js";
import { SessionEngine } from "../engine.js";

describe("session persistence helpers", () => {
  beforeEach(() => {
    const storage = createLocalStorageMock();
    vi.stubGlobal("window", { localStorage: storage });
    storage.clear();
  });

  it("stores and restores the active session snapshot", () => {
    const sourceEngine = new SessionEngine();
    const session = sourceEngine.createSession("match-third", {
      direction: "above",
      allowedKeys: ["C"],
      questionCount: 2,
      melodyLength: 1,
      playbackMode: "auto",
      playTonicBeforeQuestion: false,
      allowReplay: true,
      tempoBpm: 80,
      choiceCount: 4,
      scoringMode: "first-attempt",
      inputType: "multiple-choice",
    });

    saveSessionEngineSnapshot(sourceEngine);

    const restoredEngine = new SessionEngine();
    const snapshot = restoreSessionEngineSnapshot(restoredEngine);

    expect(snapshot?.activeSessionId).toBe(session.id);
    expect(restoredEngine.getActiveSession()?.id).toBe(session.id);
  });

  it("stores completed sessions in reverse chronological order without duplicates", () => {
    const older = createCompletedSession("older-session", "2026-03-28T10:00:00.000Z", 80);
    const newer = createCompletedSession("newer-session", "2026-03-28T11:00:00.000Z", 95);

    saveCompletedSessionHistoryEntry(older);
    saveCompletedSessionHistoryEntry(newer);
    saveCompletedSessionHistoryEntry(older);

    const history = loadCompletedSessionHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.sessionId).toBe("newer-session");
    expect(history[1]?.sessionId).toBe("older-session");
  });

  it("ignores invalid history payloads", () => {
    window.localStorage.setItem("harmonia-trainer/session-history/v1", "{\"bad\":true}");
    expect(loadCompletedSessionHistory()).toEqual([]);
  });
});

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function createCompletedSession(
  id: string,
  endedAt: string,
  accuracy: number
): ExerciseSession {
  return {
    id,
    exerciseType: "sing-third",
    config: {
      direction: "above",
      allowedKeys: ["C"],
      questionCount: 5,
      melodyLength: 1,
      playbackMode: "auto",
      playTonicBeforeQuestion: false,
      allowReplay: true,
      tempoBpm: 80,
      choiceCount: 1,
      scoringMode: "first-attempt",
      inputType: "voice",
    },
    status: "completed",
    questions: [],
    answers: [],
    evaluations: [],
    currentQuestionIndex: 0,
    startedAt: "2026-03-28T09:55:00.000Z",
    endedAt,
    summary: {
      totalQuestions: 5,
      firstAttemptCorrect: 4,
      accuracy,
      totalAttempts: 6,
      totalTimeMs: 120000,
      byKey: {},
      byDirection: {
        above: { total: 5, firstAttemptCorrect: 4 },
        below: { total: 0, firstAttemptCorrect: 0 },
      },
    },
  };
}
