import type {
  AnswerEvaluation,
  ExerciseSession,
  SessionSummary,
} from "../types/index.js";
import type { NoteName } from "../domain/theory/notes.js";

type SubmitAnswerFn = (note: NoteName) => void;
type SubmitVoiceAnswerFn = () => void;
type FinishFn = () => void;
type BackToCatalogFn = () => void;
type ReplayFn = () => void;
type VoiceActionFn = () => void;

export interface SessionAudioState {
  errorMessage: string | null;
  isPlaying: boolean;
}

export interface SessionVoiceState {
  isListening: boolean;
  isRequestingPermission: boolean;
  errorMessage: string | null;
  detectedNote: NoteName | null;
  detectedMidi: number | null;
  detectedFrequency: number | null;
  confidence: number;
  capturedNotes: NoteName[];
  capturedMidis: number[];
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
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
      <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Session Complete</h2>

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
    .querySelector<HTMLButtonElement>("#back-to-catalog")
    ?.addEventListener("click", onBack);

  return container;
}

export function renderSessionView(
  session: ExerciseSession,
  onFinish: FinishFn,
  onBack: BackToCatalogFn,
  lastEvaluation: AnswerEvaluation | null,
  audioState: SessionAudioState,
  voiceState: SessionVoiceState
): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-gray-50";

  const { currentQuestionIndex, questions, evaluations } = session;
  const questionIndex = currentQuestionIndex;
  const isEndless = session.config.questionCount === 0;
  const totalQuestions = questions.length;
  const question = questions[questionIndex];
  const isPhraseQuestion = question.melody.length > 1;
  const progress =
    !isEndless && totalQuestions > 0
      ? Math.round((questionIndex / totalQuestions) * 100)
      : 0;
  const progressLabel = isEndless ? "Endless" : `${progress}%`;
  const totalLabel = isEndless ? "Infinity" : String(totalQuestions);
  const isVoice = session.config.inputType === "voice";
  const canReplay =
    session.config.allowReplay && (question.playbackPlan?.notes.length ?? 0) > 0;

  container.innerHTML = `
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <button
          id="abandon-btn"
          class="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Back to catalog"
        >
          <- Catalog
        </button>
        <div class="flex-1 mx-4">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Question ${questionIndex + 1} of ${totalLabel}</span>
            <span>${progressLabel}</span>
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
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <p class="text-sm text-gray-500 uppercase tracking-wide mb-3">
          ${
            session.config.direction === "mixed"
              ? `Third ${question.direction}`
              : `Third ${session.config.direction}`
          }
          in <strong>${question.key}</strong> major
        </p>
        <p class="text-lg text-gray-700 mb-1">
          ${isPhraseQuestion ? "Melody phrase:" : "Melody note:"}
        </p>
        <div class="text-6xl font-bold text-indigo-600 my-4">
          ${isPhraseQuestion ? question.melody.join(" - ") : question.melody[0]}
        </div>
        <p class="text-gray-500 text-sm">
          ${
            isPhraseQuestion
              ? "Sing the harmony phrase in order."
              : "Sing or select the correct harmony note."
          }
        </p>
      </div>

      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="text-left">
            <p class="text-sm font-medium text-gray-700">Audio prompt</p>
            <p class="text-sm text-gray-500">
              ${
                audioState.isPlaying
                  ? "Playing the current prompt..."
                  : session.config.playbackMode === "auto"
                    ? "Prompt plays automatically when a new question appears."
                    : "Use the button to play the current prompt."
              }
            </p>
          </div>
          ${
            canReplay
              ? `<button
                  id="replay-btn"
                  type="button"
                  class="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  ${audioState.isPlaying ? "disabled" : ""}
                >
                  ${audioState.isPlaying ? "Playing..." : "Replay Prompt"}
                </button>`
              : ""
          }
        </div>
        ${
          audioState.errorMessage
            ? `<p class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">${audioState.errorMessage}</p>`
            : ""
        }
      </div>

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

      ${
        isVoice
          ? renderVoicePanel(
              voiceState,
              audioState.isPlaying,
              isPhraseQuestion,
              question.expectedHarmony.length
            )
          : renderChoices(question.choices ?? [], lastEvaluation)
      }

      ${(() => {
        const currentEvaluations = evaluations[questionIndex] ?? [];
        if (currentEvaluations.length === 0) return "";
        return `<p class="text-xs text-gray-400 text-center">Attempts on this question: ${currentEvaluations.length}</p>`;
      })()}
    </main>
  `;

  container
    .querySelector<HTMLButtonElement>("#abandon-btn")
    ?.addEventListener("click", onBack);

  container
    .querySelector<HTMLButtonElement>("#finish-btn")
    ?.addEventListener("click", onFinish);

  return container;
}

function renderChoices(
  choices: NoteName[],
  lastEvaluation: AnswerEvaluation | null
): string {
  if (choices.length === 0) return "";

  const wrongChoiceOnLastAttempt =
    lastEvaluation &&
    !lastEvaluation.isCorrect &&
    typeof lastEvaluation.actual === "string"
      ? lastEvaluation.actual
      : null;

  const buttons = choices
    .map((note) => {
      const wasWrong = note === wrongChoiceOnLastAttempt;
      const baseClasses =
        "flex-1 min-w-[4.5rem] py-4 rounded-xl border-2 text-xl font-bold transition-all";
      const colourClasses = wasWrong
        ? "border-red-300 bg-red-50 text-red-600 cursor-not-allowed opacity-60"
        : "border-gray-200 bg-white text-gray-900 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 cursor-pointer";

      return `<button
        class="${baseClasses} ${colourClasses} choice-btn"
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

function renderVoicePanel(
  voiceState: SessionVoiceState,
  isPromptPlaying: boolean,
  isPhraseQuestion: boolean,
  targetLength: number
): string {
  const statusText = voiceState.isListening
    ? voiceState.detectedNote
      ? `Detected: ${voiceState.detectedNote} (${Math.round(
          voiceState.confidence * 100
        )}% confidence)`
      : "Listening for a stable pitch..."
    : voiceState.isRequestingPermission
      ? "Requesting microphone permission..."
      : isPromptPlaying
        ? "Wait for the prompt to finish, then start listening."
        : isPhraseQuestion
          ? "Sing the phrase continuously. Stable notes auto-capture while you listen."
          : "Start listening, sing the harmony note, then submit the detected note.";

  return `
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div class="text-center mb-6">
        <p class="text-4xl mb-3">Mic</p>
        <p class="font-medium text-gray-700">Microphone input</p>
        <p class="text-sm mt-1 text-gray-500">${statusText}</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 text-center mb-5">
        <p class="text-xs uppercase tracking-wide text-gray-500 mb-2">Detected note</p>
        <div class="text-4xl font-bold text-indigo-600">
          ${voiceState.detectedNote ?? "--"}
        </div>
        <p class="mt-2 text-sm text-gray-500">
          ${
            voiceState.detectedMidi === null
              ? "No stable pitch yet."
              : `MIDI ${voiceState.detectedMidi}${
                  voiceState.detectedFrequency === null
                    ? ""
                    : ` | ${voiceState.detectedFrequency.toFixed(1)} Hz`
                }`
          }
        </p>
      </div>

      ${
        isPhraseQuestion
          ? `<div class="rounded-2xl border border-gray-200 bg-white px-6 py-5 mb-5">
              <div class="flex items-center justify-between gap-3 mb-3">
                <p class="text-sm font-medium text-gray-700">Captured harmony phrase</p>
                <p class="text-xs text-gray-500">${voiceState.capturedNotes.length}/${targetLength} notes</p>
              </div>
              <div class="min-h-12 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                ${
                  voiceState.capturedNotes.length > 0
                    ? voiceState.capturedNotes.join(" - ")
                    : "No notes captured yet."
                }
              </div>
              <div class="mt-3 flex flex-col sm:flex-row gap-3">
                <button
                  id="voice-add-note-btn"
                  type="button"
                  class="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  ${
                    voiceState.detectedNote === null ||
                    voiceState.isRequestingPermission ||
                    voiceState.capturedNotes.length >= targetLength
                      ? "disabled"
                      : ""
                  }
                >
                  Add Current Note
                </button>
                <button
                  id="voice-clear-notes-btn"
                  type="button"
                  class="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  ${voiceState.capturedNotes.length === 0 ? "disabled" : ""}
                >
                  Clear Phrase
                </button>
              </div>
            </div>`
          : ""
      }

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          id="voice-toggle-btn"
          type="button"
          class="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          ${voiceState.isRequestingPermission || isPromptPlaying ? "disabled" : ""}
        >
          ${
            voiceState.isListening
              ? "Stop Listening"
              : voiceState.isRequestingPermission
                ? "Starting..."
                : "Start Listening"
          }
        </button>
        <button
          id="voice-submit-btn"
          type="button"
          class="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          ${
            (
              isPhraseQuestion
                ? voiceState.capturedNotes.length === 0
                : voiceState.detectedNote === null
            ) || voiceState.isRequestingPermission
              ? "disabled"
              : ""
          }
        >
          ${isPhraseQuestion ? "Submit Phrase" : "Submit Detected Note"}
        </button>
      </div>

      ${
        voiceState.errorMessage
          ? `<p class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">${voiceState.errorMessage}</p>`
          : ""
      }
    </div>
  `;
}

export function attachChoiceHandlers(
  container: HTMLElement,
  onSubmitAnswer: SubmitAnswerFn
): void {
  container.querySelectorAll<HTMLButtonElement>(".choice-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const note = button.dataset["note"] as NoteName;
      if (note) onSubmitAnswer(note);
    });
  });
}

export function attachReplayHandler(
  container: HTMLElement,
  onReplay: ReplayFn
): void {
  container
    .querySelector<HTMLButtonElement>("#replay-btn")
    ?.addEventListener("click", onReplay);
}

export function attachVoiceHandlers(
  container: HTMLElement,
  onToggleListening: VoiceActionFn,
  onSubmitVoiceAnswer: SubmitVoiceAnswerFn,
  onAddDetectedNote: VoiceActionFn,
  onClearDetectedNotes: VoiceActionFn
): void {
  container
    .querySelector<HTMLButtonElement>("#voice-toggle-btn")
    ?.addEventListener("click", onToggleListening);

  container
    .querySelector<HTMLButtonElement>("#voice-submit-btn")
    ?.addEventListener("click", onSubmitVoiceAnswer);

  container
    .querySelector<HTMLButtonElement>("#voice-add-note-btn")
    ?.addEventListener("click", onAddDetectedNote);

  container
    .querySelector<HTMLButtonElement>("#voice-clear-notes-btn")
    ?.addEventListener("click", onClearDetectedNotes);
}
