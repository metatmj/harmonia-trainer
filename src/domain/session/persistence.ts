import type { SessionEngineSnapshot } from "../../types/index.js";
import type { SessionEngine } from "./engine.js";

const STORAGE_KEY = "harmonia-trainer/session-engine/v1";

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveSessionEngineSnapshot(engine: SessionEngine): void {
  if (!hasStorage()) return;

  const snapshot = engine.exportState();
  if (snapshot.sessions.length === 0 || snapshot.activeSessionId === null) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function restoreSessionEngineSnapshot(
  engine: SessionEngine
): SessionEngineSnapshot | null {
  if (!hasStorage()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const snapshot = JSON.parse(raw) as SessionEngineSnapshot;
    if (!Array.isArray(snapshot.sessions)) {
      throw new Error("Invalid stored session snapshot");
    }

    engine.hydrate(snapshot);
    return snapshot;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
