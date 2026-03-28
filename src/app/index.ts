import type { AnswerEvaluation, ExerciseConfig } from "../types/index.js";
import type { NoteName } from "../domain/theory/notes.js";
import { EXERCISE_CATALOG, getExerciseBySlug } from "../domain/exercises/catalog.js";
import { sessionEngine } from "../domain/session/engine.js";
import { renderCatalogView } from "./catalog-view.js";
import { renderSessionConfigView } from "./session-config-view.js";
import {
  renderSessionView,
  renderSummaryView,
  attachChoiceHandlers,
} from "./session-view.js";

type AppState =
  | { screen: "catalog" }
  | { screen: "config"; slug: string }
  | { screen: "session"; sessionId: string; lastEvaluation: AnswerEvaluation | null }
  | { screen: "summary"; sessionId: string };

export function initApp(root: HTMLElement): void {
  let state: AppState = { screen: "catalog" };

  function navigate(next: AppState): void {
    state = next;
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
      if (!exercise) return navigate({ screen: "catalog" });

      const view = renderSessionConfigView(
        exercise,
        (config: ExerciseConfig) => {
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
        return navigate({ screen: "summary", sessionId });
      }

      const handleAnswer = (note: NoteName) => {
        const qi = session.currentQuestionIndex;
        const question = session.questions[qi];
        const { evaluation } = sessionEngine.submitAnswer(session.id, {
          type: "multiple-choice",
          choiceIndex: question.choices?.indexOf(note) ?? 0,
          choiceValue: note,
        });

        if (session.status === "completed") {
          navigate({ screen: "summary", sessionId: session.id });
        } else {
          // Clear feedback on advance, keep it on incorrect
          navigate({
            screen: "session",
            sessionId: session.id,
            lastEvaluation: evaluation.isCorrect ? null : evaluation,
          });
        }
      };

      const view = renderSessionView(
        session,
        () => {
          sessionEngine.finishSession(sessionId);
          navigate({ screen: "summary", sessionId });
        },
        () => navigate({ screen: "catalog" }),
        state.lastEvaluation
      );

      root.appendChild(view);
      attachChoiceHandlers(root, handleAnswer);
      return;
    }

    if (state.screen === "summary") {
      const session = sessionEngine.getSession(state.sessionId);
      const summary = session?.summary;

      if (!summary) return navigate({ screen: "catalog" });

      const view = renderSummaryView(summary, () => navigate({ screen: "catalog" }));
      root.appendChild(view);
      return;
    }
  }

  render();
}
