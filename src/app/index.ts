import type { AnswerEvaluation, ExerciseConfig } from "../types/index.js";
import type { NoteName } from "../domain/theory/notes.js";
import { EXERCISE_CATALOG, getExerciseBySlug } from "../domain/exercises/catalog.js";
import { sessionEngine } from "../domain/session/engine.js";
import {
  restoreSessionEngineSnapshot,
  saveSessionEngineSnapshot,
} from "../domain/session/persistence.js";
import { promptAudioPlayer } from "../audio/prompt-player.js";
import { microphonePitchDetector } from "../audio/pitch-detector.js";
import { renderCatalogView } from "./catalog-view.js";
import {
  LESSON_PLAYBACK_PLANS,
  renderLessonView,
} from "./lesson-view.js";
import { renderSessionConfigView } from "./session-config-view.js";
import {
  renderSessionView,
  renderSummaryView,
  attachChoiceHandlers,
  attachReplayHandler,
  type SessionAudioState,
  type SessionVoiceState,
  attachVoiceHandlers,
} from "./session-view.js";

type AppState =
  | { screen: "catalog" }
  | { screen: "lesson" }
  | { screen: "config"; slug: string }
  | { screen: "session"; sessionId: string; lastEvaluation: AnswerEvaluation | null }
  | { screen: "summary"; sessionId: string };

export function initApp(root: HTMLElement): void {
  const restoredState = restoreSessionEngineSnapshot(sessionEngine);
  let state: AppState =
    restoredState?.activeSessionId
      ? {
          screen: "session",
          sessionId: restoredState.activeSessionId,
          lastEvaluation: null,
        }
      : { screen: "catalog" };
  let sessionAudioState: SessionAudioState = {
    errorMessage: null,
    isPlaying: false,
  };
  let sessionVoiceState: SessionVoiceState = {
    isListening: false,
    isRequestingPermission: false,
    errorMessage: null,
    detectedNote: null,
    detectedMidi: null,
    detectedFrequency: null,
    confidence: 0,
    capturedNotes: [],
    capturedMidis: [],
  };
  let lastAutoPlayedQuestionId: string | null = null;
  let lastVoiceQuestionId: string | null = null;

  function navigate(next: AppState): void {
    if (next.screen !== "session") {
      promptAudioPlayer.stop();
      microphonePitchDetector.stopListening();
      sessionAudioState = { errorMessage: null, isPlaying: false };
      sessionVoiceState = {
        isListening: false,
        isRequestingPermission: false,
        errorMessage: null,
        detectedNote: null,
        detectedMidi: null,
        detectedFrequency: null,
        confidence: 0,
        capturedNotes: [],
        capturedMidis: [],
      };
      lastAutoPlayedQuestionId = null;
      lastVoiceQuestionId = null;
    }

    state = next;
    render();
  }

  function persistSessionState(): void {
    saveSessionEngineSnapshot(sessionEngine);
  }

  async function playQuestionPrompt(
    sessionId: string,
    source: "auto" | "replay"
  ): Promise<void> {
    const session = sessionEngine.getSession(sessionId);
    if (!session || session.status !== "active") return;

    const question = session.questions[session.currentQuestionIndex];
    const plan = question?.playbackPlan;
    if (!question || !plan || plan.notes.length === 0) return;

    microphonePitchDetector.stopListening();
    sessionVoiceState = {
      ...sessionVoiceState,
      isListening: false,
      isRequestingPermission: false,
      errorMessage: null,
      detectedNote: null,
      detectedMidi: null,
      detectedFrequency: null,
      confidence: 0,
      capturedNotes: [],
      capturedMidis: [],
    };

    if (source === "auto") {
      lastAutoPlayedQuestionId = question.id;
    }

    sessionAudioState = {
      errorMessage: null,
      isPlaying: true,
    };
    render();

    try {
      await promptAudioPlayer.play(plan);
      sessionAudioState = {
        errorMessage: null,
        isPlaying: false,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Audio playback failed. Try replaying the prompt.";
      sessionAudioState = {
        errorMessage: message,
        isPlaying: false,
      };
    }

    render();
  }

  function resetVoiceStateForQuestion(questionId: string): void {
    if (lastVoiceQuestionId === questionId) return;

    microphonePitchDetector.stopListening();
    sessionVoiceState = {
      isListening: false,
      isRequestingPermission: false,
      errorMessage: null,
      detectedNote: null,
      detectedMidi: null,
      detectedFrequency: null,
      confidence: 0,
      capturedNotes: [],
      capturedMidis: [],
    };
    lastVoiceQuestionId = questionId;
  }

  async function startVoiceListening(sessionId: string): Promise<void> {
    const session = sessionEngine.getSession(sessionId);
    if (!session || session.status !== "active") return;

    const question = session.questions[session.currentQuestionIndex];
    if (!question) return;

    promptAudioPlayer.stop();
    sessionAudioState = { ...sessionAudioState, isPlaying: false };
    sessionVoiceState = {
      ...sessionVoiceState,
      isRequestingPermission: true,
      errorMessage: null,
    };
    render();

    try {
      await microphonePitchDetector.startListening(
        { preferFlatsForKey: question.key },
        (detection) => {
          sessionVoiceState = {
            ...sessionVoiceState,
            isListening: true,
            isRequestingPermission: false,
            detectedNote: detection?.note ?? null,
            detectedMidi: detection?.midi ?? null,
            detectedFrequency: detection?.frequency ?? null,
            confidence: detection?.confidence ?? 0,
          };
          render();
        }
      );
    } catch (error) {
      sessionVoiceState = {
        ...sessionVoiceState,
        isListening: false,
        isRequestingPermission: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Microphone access failed. Please try again.",
      };
      render();
    }
  }

  function stopVoiceListening(): void {
    microphonePitchDetector.stopListening();
    sessionVoiceState = {
      ...sessionVoiceState,
      isListening: false,
      isRequestingPermission: false,
      detectedNote: null,
      detectedMidi: null,
      detectedFrequency: null,
      confidence: 0,
    };
    render();
  }

  function render(): void {
    root.innerHTML = "";

    if (state.screen === "catalog") {
      const view = renderCatalogView(
        EXERCISE_CATALOG,
        (slug) => navigate({ screen: "config", slug }),
        () => navigate({ screen: "lesson" })
      );
      root.appendChild(view);
      return;
    }

    if (state.screen === "lesson") {
      const view = renderLessonView(
        () => navigate({ screen: "catalog" }),
        (exampleId) => {
          void promptAudioPlayer.play(LESSON_PLAYBACK_PLANS[exampleId]);
        }
      );
      root.appendChild(view);
      return;
    }

    if (state.screen === "config") {
      const exercise = getExerciseBySlug(state.slug);
      if (!exercise) {
        navigate({ screen: "catalog" });
        return;
      }

      const view = renderSessionConfigView(
        exercise,
        (config: ExerciseConfig) => {
          sessionAudioState = { errorMessage: null, isPlaying: false };
          sessionVoiceState = {
            isListening: false,
            isRequestingPermission: false,
            errorMessage: null,
            detectedNote: null,
            detectedMidi: null,
            detectedFrequency: null,
            confidence: 0,
            capturedNotes: [],
            capturedMidis: [],
          };
          lastAutoPlayedQuestionId = null;
          lastVoiceQuestionId = null;
          const session = sessionEngine.createSession(exercise.type, config);
          persistSessionState();
          navigate({ screen: "session", sessionId: session.id, lastEvaluation: null });
        },
        () => navigate({ screen: "catalog" })
      );
      root.appendChild(view);
      return;
    }

    if (state.screen === "session") {
      const { sessionId } = state;
      const session = sessionEngine.getSession(sessionId);

      if (!session || session.status === "completed") {
        navigate({ screen: "summary", sessionId });
        return;
      }

      const currentQuestion = session.questions[session.currentQuestionIndex];
      resetVoiceStateForQuestion(currentQuestion.id);
      const isPhraseQuestion = currentQuestion.melody.length > 1;

      const handleAnswer = (note: NoteName) => {
        const questionIndex = session.currentQuestionIndex;
        const question = session.questions[questionIndex];
        const choiceIndex = question.choices?.indexOf(note) ?? -1;
        if (choiceIndex < 0) {
          throw new Error(`Selected note "${note}" not found in question choices`);
        }

        const { evaluation } = sessionEngine.submitAnswer(session.id, {
          type: "multiple-choice",
          choiceIndex,
          choiceValue: note,
        });
        persistSessionState();

        if (session.status === "completed") {
          navigate({ screen: "summary", sessionId: session.id });
          return;
        }

        navigate({
          screen: "session",
          sessionId: session.id,
          lastEvaluation: evaluation.isCorrect ? null : evaluation,
        });
      };

      const handleVoiceSubmit = () => {
        const detectedNote = sessionVoiceState.detectedNote;
        const detectedMidi = sessionVoiceState.detectedMidi;
        const detectedFrequency = sessionVoiceState.detectedFrequency;
        const confidence = sessionVoiceState.confidence;
        const detectedNotes = sessionVoiceState.capturedNotes;
        const detectedMidis = sessionVoiceState.capturedMidis;

        if (isPhraseQuestion) {
          if (detectedNotes.length === 0) return;
        } else if (detectedNote === null) {
          return;
        }

        stopVoiceListening();
        const { evaluation } = sessionEngine.submitAnswer(session.id, {
          type: "voice",
          detectedMidi: detectedMidi ?? undefined,
          detectedNote: detectedNote ?? undefined,
          detectedMidis,
          detectedNotes,
          detectedFrequency: detectedFrequency ?? undefined,
          confidence,
        });
        persistSessionState();

        if (session.status === "completed") {
          navigate({ screen: "summary", sessionId: session.id });
          return;
        }

        navigate({
          screen: "session",
          sessionId: session.id,
          lastEvaluation: evaluation.isCorrect ? null : evaluation,
        });
      };

      const view = renderSessionView(
        session,
        () => {
          sessionEngine.finishSession(sessionId);
          persistSessionState();
          navigate({ screen: "summary", sessionId });
        },
        () => navigate({ screen: "catalog" }),
        state.lastEvaluation,
        sessionAudioState,
        sessionVoiceState
      );

      root.appendChild(view);
      attachChoiceHandlers(root, handleAnswer);
      attachReplayHandler(root, () => {
        void playQuestionPrompt(session.id, "replay");
      });
      attachVoiceHandlers(
        root,
        () => {
          if (sessionVoiceState.isListening) {
            stopVoiceListening();
            return;
          }

          void startVoiceListening(session.id);
        },
        handleVoiceSubmit,
        () => {
          if (sessionVoiceState.detectedNote === null) return;

          sessionVoiceState = {
            ...sessionVoiceState,
            capturedNotes: [...sessionVoiceState.capturedNotes, sessionVoiceState.detectedNote],
            capturedMidis:
              sessionVoiceState.detectedMidi === null
                ? sessionVoiceState.capturedMidis
                : [...sessionVoiceState.capturedMidis, sessionVoiceState.detectedMidi],
            errorMessage: null,
          };
          render();
        },
        () => {
          sessionVoiceState = {
            ...sessionVoiceState,
            capturedNotes: [],
            capturedMidis: [],
          };
          render();
        }
      );

      if (
        session.config.playbackMode === "auto" &&
        currentQuestion &&
        currentQuestion.id !== lastAutoPlayedQuestionId &&
        !sessionAudioState.isPlaying
      ) {
        void playQuestionPrompt(session.id, "auto");
      }
      return;
    }

    if (state.screen === "summary") {
      const session = sessionEngine.getSession(state.sessionId);
      const summary = session?.summary;

      if (!summary) {
        navigate({ screen: "catalog" });
        return;
      }

      const view = renderSummaryView(summary, () => navigate({ screen: "catalog" }));
      root.appendChild(view);
    }
  }

  render();
}
