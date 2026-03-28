import type { NoteName } from "../domain/theory/notes.js";
import type { PitchDetection } from "./pitch-detector.js";

const STABLE_FRAME_THRESHOLD = 6;

export interface PhraseCaptureState {
  candidateNote: NoteName | null;
  candidateMidi: number | null;
  stableFrames: number;
  lastCommittedNote: NoteName | null;
}

export interface PhraseCaptureResult {
  nextState: PhraseCaptureState;
  committed:
    | {
        note: NoteName;
        midi: number;
      }
    | null;
}

export function createPhraseCaptureState(): PhraseCaptureState {
  return {
    candidateNote: null,
    candidateMidi: null,
    stableFrames: 0,
    lastCommittedNote: null,
  };
}

export function updatePhraseCaptureState(
  state: PhraseCaptureState,
  detection: PitchDetection | null
): PhraseCaptureResult {
  if (!detection) {
    return {
      nextState: {
        ...state,
        candidateNote: null,
        candidateMidi: null,
        stableFrames: 0,
      },
      committed: null,
    };
  }

  if (state.candidateNote !== detection.note) {
    return {
      nextState: {
        ...state,
        candidateNote: detection.note,
        candidateMidi: detection.midi,
        stableFrames: 1,
      },
      committed: null,
    };
  }

  const stableFrames = state.stableFrames + 1;
  const nextState: PhraseCaptureState = {
    ...state,
    candidateNote: detection.note,
    candidateMidi: detection.midi,
    stableFrames,
  };

  if (
    stableFrames >= STABLE_FRAME_THRESHOLD &&
    detection.note !== state.lastCommittedNote
  ) {
    return {
      nextState: {
        ...nextState,
        stableFrames: 0,
        lastCommittedNote: detection.note,
      },
      committed: {
        note: detection.note,
        midi: detection.midi,
      },
    };
  }

  return {
    nextState,
    committed: null,
  };
}
