import { describe, expect, it } from "vitest";
import {
  createPhraseCaptureState,
  updatePhraseCaptureState,
} from "../phrase-capture.js";

const detectionA = {
  note: "A" as const,
  midi: 69,
  frequency: 440,
  confidence: 0.9,
};

describe("phrase capture", () => {
  it("does not commit immediately for a new note", () => {
    const result = updatePhraseCaptureState(createPhraseCaptureState(), detectionA);
    expect(result.committed).toBeNull();
    expect(result.nextState.candidateNote).toBe("A");
  });

  it("commits after the same note is stable long enough", () => {
    let state = createPhraseCaptureState();
    let committed = null;

    for (let i = 0; i < 6; i++) {
      const result = updatePhraseCaptureState(state, detectionA);
      state = result.nextState;
      committed = result.committed;
    }

    expect(committed).toEqual({ note: "A", midi: 69 });
    expect(state.lastCommittedNote).toBe("A");
  });

  it("does not recommit the same note without a note change", () => {
    let state = createPhraseCaptureState();

    for (let i = 0; i < 6; i++) {
      state = updatePhraseCaptureState(state, detectionA).nextState;
    }

    const result = updatePhraseCaptureState(state, detectionA);
    expect(result.committed).toBeNull();
  });

  it("resets the stability streak when input disappears", () => {
    let state = updatePhraseCaptureState(createPhraseCaptureState(), detectionA).nextState;
    state = updatePhraseCaptureState(state, null).nextState;

    expect(state.candidateNote).toBeNull();
    expect(state.stableFrames).toBe(0);
  });
});
