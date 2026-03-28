import type {
  AnswerEvaluation,
  ExerciseSession,
  GeneratedQuestion,
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

function centsDifference(actualFrequency: number, targetMidi: number): number {
  const targetFrequency = 440 * 2 ** ((targetMidi - 69) / 12);
  return 1200 * Math.log2(actualFrequency / targetFrequency);
}

function getCurrentVoiceTarget(
  question: GeneratedQuestion,
  capturedCount: number
): { note: NoteName; midi: number } | null {
  const targetIndex = Math.min(capturedCount, question.expectedHarmony.length - 1);
  const midiList = question.metadata?.["expectedHarmonyMidis"];

  if (
    !Array.isArray(midiList) ||
    typeof midiList[targetIndex] !== "number" ||
    typeof question.expectedHarmony[targetIndex] !== "string"
  ) {
    return null;
  }

  return {
    note: question.expectedHarmony[targetIndex],
    midi: midiList[targetIndex] as number,
  };
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
        class="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
  const currentVoiceTarget = getCurrentVoiceTarget(
    question,
    voiceState.capturedNotes.length
  );
  const progress =
    !isEndless && totalQuestions > 0
      ? Math.round((questionIndex / totalQuestions) * 100)
      : 0;
  const progressLabel = isEndless ? "Endless" : `${progress}%`;
  const totalLabel = isEndless ? "Infinity" : String(totalQuestions);
  const isVoice = session.config.inputType === "voice";
  const canTriggerPlayback =
    (question.playbackPlan?.notes.length ?? 0) > 0 &&
    (session.config.playbackMode === "manual" || session.config.allowReplay);
  const playbackButtonLabel =
    session.config.playbackMode === "manual" ? "Play Prompt" : "Replay Prompt";

  container.innerHTML = `
    <header class="border-b border-gray-200 bg-white shadow-sm">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <button
          id="abandon-btn"
          class="text-sm text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Back to catalog"
        >
          <- Catalog
        </button>
        <div class="mx-2 flex-1 sm:mx-4">
          <div class="mb-1 flex justify-between text-xs text-gray-500">
            <span>Question ${questionIndex + 1} of ${totalLabel}</span>
            <span>${progressLabel}</span>
          </div>
          <div class="h-2 w-full rounded-full bg-gray-200">
            <div
              class="h-2 rounded-full bg-indigo-500 transition-all"
              style="width: ${progress}%"
            ></div>
          </div>
        </div>
        <button
          id="finish-btn"
          class="whitespace-nowrap text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Finish
        </button>
      </div>
    </header>

    <main class="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div class="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p class="mb-3 text-sm uppercase tracking-wide text-gray-500">
          ${
            session.config.direction === "mixed"
              ? `Third ${question.direction}`
              : `Third ${session.config.direction}`
          }
          in <strong>${question.key}</strong> major
        </p>
        <p class="mb-1 text-lg text-gray-700">
          ${isPhraseQuestion ? "Melody phrase:" : "Melody note:"}
        </p>
        <div class="my-4 break-words text-4xl font-bold text-indigo-600 sm:text-6xl">
          ${isPhraseQuestion ? question.melody.join(" - ") : question.melody[0]}
        </div>
        <p class="text-sm text-gray-500">
          ${
            isPhraseQuestion
              ? "Sing the harmony phrase in order."
              : "Sing or select the correct harmony note."
          }
        </p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            canTriggerPlayback
              ? `<button
                  id="replay-btn"
                  type="button"
                  class="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  ${audioState.isPlaying ? "disabled" : ""}
                >
                  ${audioState.isPlaying ? "Playing..." : playbackButtonLabel}
                </button>`
              : ""
          }
        </div>
        ${
          audioState.errorMessage
            ? `<p class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">${audioState.errorMessage}</p>`
            : ""
        }
      </div>

      ${
        lastEvaluation
          ? `<div
              class="rounded-xl border px-5 py-4 text-center font-medium ${
                lastEvaluation.isCorrect
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }"
              role="status"
              aria-live="polite"
            >
              ${lastEvaluation.feedbackMessage}
            </div>`
          : ""
      }

      ${
        isVoice
          ? renderVoicePanel(
              voiceState,
              currentVoiceTarget,
              audioState.isPlaying,
              isPhraseQuestion,
              question.expectedHarmony.length
            )
          : renderChoices(question.choices ?? [], lastEvaluation)
      }

      ${(() => {
        const currentEvaluations = evaluations[questionIndex] ?? [];
        if (currentEvaluations.length === 0) return "";
        return `<p class="text-center text-xs text-gray-400">Attempts on this question: ${currentEvaluations.length}</p>`;
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
        "flex-1 min-w-[4.5rem] rounded-xl border-2 py-4 text-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
      const colourClasses = wasWrong
        ? "cursor-not-allowed border-red-300 bg-red-50 text-red-600 opacity-60"
        : "cursor-pointer border-gray-200 bg-white text-gray-900 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95";

      return `<button
        class="${baseClasses} ${colourClasses} choice-btn"
        data-note="${note}"
        ${wasWrong ? "disabled" : ""}
        aria-label="Select note ${note}"
      >${note}</button>`;
    })
    .join("");

  return `
    <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p class="mb-4 text-center text-sm text-gray-500">Select the harmony note:</p>
      <div class="flex flex-wrap justify-center gap-3">
        ${buttons}
      </div>
    </div>
  `;
}

function renderVoicePanel(
  voiceState: SessionVoiceState,
  currentVoiceTarget: { note: NoteName; midi: number } | null,
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

  const centsOff =
    voiceState.detectedFrequency !== null && currentVoiceTarget !== null
      ? Math.round(centsDifference(voiceState.detectedFrequency, currentVoiceTarget.midi))
      : null;
  const clampedCents = centsOff === null ? 0 : Math.max(-100, Math.min(100, centsOff));
  const tunerPosition = 50 + clampedCents / 2;
  const tunerLabel =
    centsOff === null
      ? "Waiting for stable pitch"
      : centsOff === 0
        ? "Centered"
        : centsOff > 0
          ? `${centsOff} cents high`
          : `${Math.abs(centsOff)} cents low`;

  return `
    <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div class="mb-6 text-center">
        <p class="mb-3 text-4xl">Mic</p>
        <p class="font-medium text-gray-700">Microphone input</p>
        <p class="mt-1 text-sm text-gray-500">${statusText}</p>
      </div>

      <div class="mb-5 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 text-center" aria-live="polite">
        <p class="mb-2 text-xs uppercase tracking-wide text-gray-500">Detected note</p>
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
        currentVoiceTarget
          ? `<div class="mb-5 rounded-2xl border border-gray-200 bg-white px-6 py-5">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-sm font-medium text-gray-700">Pitch tuner</p>
                <p class="text-xs text-gray-500">Target ${currentVoiceTarget.note}</p>
              </div>
              <div class="mb-3 flex items-end justify-between gap-4">
                <div>
                  <div class="text-3xl font-bold text-indigo-600">${currentVoiceTarget.note}</div>
                  <p class="text-sm text-gray-500">${tunerLabel}</p>
                </div>
                <div class="text-right text-xs text-gray-500">
                  <div>Low</div>
                  <div>Center</div>
                  <div>High</div>
                </div>
              </div>
              <div class="relative h-3 rounded-full bg-gradient-to-r from-rose-200 via-emerald-200 to-amber-200">
                <div class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-gray-700"></div>
                <div
                  class="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-600 shadow"
                  style="left: calc(${tunerPosition}% - 10px)"
                ></div>
              </div>
            </div>`
          : ""
      }

      ${
        isPhraseQuestion
          ? `<div class="mb-5 rounded-2xl border border-gray-200 bg-white px-6 py-5" aria-live="polite">
              <div class="mb-3 flex items-center justify-between gap-3">
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
              <div class="mt-3 flex flex-col gap-3 sm:flex-row">
                <button
                  id="voice-add-note-btn"
                  type="button"
                  class="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                  class="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  ${voiceState.capturedNotes.length === 0 ? "disabled" : ""}
                >
                  Clear Phrase
                </button>
              </div>
            </div>`
          : ""
      }

      <div class="flex flex-col gap-3 sm:flex-row">
        <button
          id="voice-toggle-btn"
          type="button"
          class="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
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
          class="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
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
          ? `<p class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">${voiceState.errorMessage}</p>`
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
