import type {
  AnswerEvaluation,
  ExerciseSession,
  SessionSummary,
} from "../types/index.js";
import type { NoteName } from "../domain/theory/notes.js";

type SubmitAnswerFn = (note: NoteName) => void;
type FinishFn = () => void;
type BackToCatalogFn = () => void;

// ── Summary screen ─────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export function renderSummaryView(
  summary: SessionSummary,
  onBack: BackToCatalogFn
): HTMLElement {
  const container = document.createElement("div");
  container.className =
    "min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12";

  const scoreColour =
    summary.accuracy >= 80
      ? "text-green-600"
      : summary.accuracy >= 50
        ? "text-yellow-600"
        : "text-red-600";

  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-md border border-gray-200 max-w-md w-full p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Session Complete 🎉</h2>

      <div class="flex flex-col gap-4 mb-8">
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-600 text-sm">Questions completed</span>
          <span class="font-semibold text-gray-900">${summary.totalQuestions}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-600 text-sm">First-attempt correct</span>
          <span class="font-semibold text-gray-900">${summary.firstAttemptCorrect}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-600 text-sm">Accuracy</span>
          <span class="font-bold text-lg ${scoreColour}">${summary.accuracy}%</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-600 text-sm">Total attempts</span>
          <span class="font-semibold text-gray-900">${summary.totalAttempts}</span>
        </div>
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-600 text-sm">Session time</span>
          <span class="font-semibold text-gray-900">${formatTime(summary.totalTimeMs)}</span>
        </div>
      </div>

      <button
        id="back-to-catalog"
        class="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Back to Catalog
      </button>
    </div>
  `;

  container
    .querySelector<HTMLButtonElement>("#back-to-catalog")!
    .addEventListener("click", onBack);

  return container;
}

// ── Active session screen ──────────────────────────────────────────────────

export function renderSessionView(
  session: ExerciseSession,
  onFinish: FinishFn,
  onBack: BackToCatalogFn,
  lastEvaluation: AnswerEvaluation | null
): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-gray-50";

  const { currentQuestionIndex, questions, evaluations } = session;
  const qi = currentQuestionIndex;
  const total = questions.length;
  const question = questions[qi];
  const progress = total > 0 ? Math.round((qi / total) * 100) : 0;

  const isVoice = session.config.inputType === "voice";

  container.innerHTML = `
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <button
          id="abandon-btn"
          class="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Back to catalog"
        >
          ← Catalog
        </button>
        <div class="flex-1 mx-4">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Question ${qi + 1} of ${total > 0 ? total : "∞"}</span>
            <span>${progress}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-indigo-500 h-2 rounded-full transition-all"
              style="width: ${progress}%"
            ></div>
          </div>
        </div>
        <button
          id="finish-btn"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
        >
          Finish
        </button>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">

      <!-- Question card -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <p class="text-sm text-gray-500 uppercase tracking-wide mb-3">
          ${
            session.config.direction === "mixed"
              ? `Third ${question.direction}`
              : `Third ${session.config.direction}`
          }
          in <strong>${question.key}</strong> major
        </p>
        <p class="text-lg text-gray-700 mb-1">Melody note:</p>
        <div class="text-6xl font-bold text-indigo-600 my-4">${question.melody[0]}</div>
        <p class="text-gray-500 text-sm">
          ${
            question.melody.length > 1
              ? `Phrase: ${question.melody.join(" – ")}`
              : "Sing or select the correct harmony note."
          }
        </p>
      </div>

      <!-- Feedback banner -->
      ${
        lastEvaluation
          ? `<div class="rounded-xl px-5 py-4 text-center font-medium ${
              lastEvaluation.isCorrect
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }">
              ${lastEvaluation.feedbackMessage}
            </div>`
          : ""
      }

      <!-- Answer area -->
      ${
        isVoice
          ? `<div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
              <p class="text-4xl mb-3">🎤</p>
              <p class="font-medium text-gray-700">Microphone input</p>
              <p class="text-sm mt-1">Audio features are not yet available in this build.</p>
            </div>`
          : renderChoices(question.choices ?? [], lastEvaluation)
      }

      <!-- Attempt counter for this question -->
      ${(() => {
        const evals = evaluations[qi] ?? [];
        if (evals.length === 0) return "";
        return `<p class="text-xs text-gray-400 text-center">Attempts on this question: ${evals.length}</p>`;
      })()}

    </main>
  `;

  container
    .querySelector<HTMLButtonElement>("#abandon-btn")!
    .addEventListener("click", onBack);

  container
    .querySelector<HTMLButtonElement>("#finish-btn")!
    .addEventListener("click", onFinish);

  return container;
}

function renderChoices(
  choices: NoteName[],
  lastEvaluation: AnswerEvaluation | null
): string {
  if (choices.length === 0) return "";

  const wrongChoiceOnLastAttempt =
    lastEvaluation && !lastEvaluation.isCorrect ? lastEvaluation.actual : null;

  const buttons = choices
    .map((note) => {
      const wasWrong = note === wrongChoiceOnLastAttempt;
      const base =
        "flex-1 min-w-[4.5rem] py-4 rounded-xl border-2 text-xl font-bold transition-all";
      const colours = wasWrong
        ? "border-red-300 bg-red-50 text-red-600 cursor-not-allowed opacity-60"
        : "border-gray-200 bg-white text-gray-900 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 cursor-pointer";

      return `<button
        class="${base} ${colours} choice-btn"
        data-note="${note}"
        ${wasWrong ? "disabled" : ""}
        aria-label="Select note ${note}"
      >${note}</button>`;
    })
    .join("");

  return `
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <p class="text-sm text-gray-500 text-center mb-4">Select the harmony note:</p>
      <div class="flex flex-wrap gap-3 justify-center">
        ${buttons}
      </div>
    </div>
  `;
}

/**
 * Attaches click handlers to choice buttons inside the given container.
 * Must be called after the container is appended to the DOM.
 */
export function attachChoiceHandlers(
  container: HTMLElement,
  onSubmitAnswer: SubmitAnswerFn
): void {
  container.querySelectorAll<HTMLButtonElement>(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const note = btn.dataset["note"] as NoteName;
      if (note) onSubmitAnswer(note);
    });
  });
}
