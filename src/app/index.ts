import type { AnswerEvaluation, ExerciseConfig } from "../types/index.js";
import type { NoteName } from "../domain/theory/notes.js";
import { EXERCISE_CATALOG, getExerciseBySlug } from "../domain/exercises/catalog.js";
import { sessionEngine } from "../domain/session/engine.js";
import { promptAudioPlayer } from "../audio/prompt-player.js";
import { renderCatalogView } from "./catalog-view.js";
import { renderSessionConfigView } from "./session-config-view.js";
import {
  renderSessionView,
  renderSummaryView,
  attachChoiceHandlers,
  attachReplayHandler,
  type SessionAudioState,
} from "./session-view.js";

type AppState =
  | { screen: "catalog" }
  | { screen: "config"; slug: string }
  | { screen: "session"; sessionId: string; lastEvaluation: AnswerEvaluation | null }
  | { screen: "summary"; sessionId: string };

export function initApp(root: HTMLElement): void {
  let state: AppState = { screen: "catalog" };
  let sessionAudioState: SessionAudioState = {
    errorMessage: null,
    isPlaying: false,
  };
  let lastAutoPlayedQuestionId: string | null = null;

  function navigate(next: AppState): void {
    if (next.screen !== "session") {
      promptAudioPlayer.stop();
      sessionAudioState = { errorMessage: null, isPlaying: false };
      lastAutoPlayedQuestionId = null;
    }

    state = next;
    render();
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

  function render(): void {
    root.innerHTML = "";

    if (state.screen === "catalog") {
      const view = renderCatalogView(EXERCISE_CATALOG, (slug) =>
        navigate({ screen: "config", slug })
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
          lastAutoPlayedQuestionId = null;
          const session = sessionEngine.createSession(exercise.type, config);
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
          navigate({ screen: "summary", sessionId });
        },
        () => navigate({ screen: "catalog" }),
        state.lastEvaluation,
        sessionAudioState
      );

      root.appendChild(view);
      attachChoiceHandlers(root, handleAnswer);
      attachReplayHandler(root, () => {
        void playQuestionPrompt(session.id, "replay");
      });

      const currentQuestion = session.questions[session.currentQuestionIndex];
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
