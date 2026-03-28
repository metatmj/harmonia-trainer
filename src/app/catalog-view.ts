import type { CompletedSessionRecord, ExerciseTemplate } from "../types/index.js";

const INPUT_TYPE_LABELS: Record<string, string> = {
  "multiple-choice": "Note Selection",
  "note-button": "Note Button",
  voice: "Microphone",
};

const DIRECTION_LABELS: Record<string, string> = {
  above: "Third Above",
  below: "Third Below",
  mixed: "Mixed",
};

function inputTypeBadge(inputType: string): string {
  const label = INPUT_TYPE_LABELS[inputType] ?? inputType;
  const colour =
    inputType === "voice"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";
  const icon = inputType === "voice" ? "Mic" : "Note";

  return `<span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colour}">
    ${icon} ${label}
  </span>`;
}

function directionBadges(directions: string[]): string {
  return directions
    .map(
      (direction) =>
        `<span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">${DIRECTION_LABELS[direction] ?? direction}</span>`
    )
    .join(" ");
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function renderHistorySection(
  exercises: ExerciseTemplate[],
  history: CompletedSessionRecord[]
): string {
  if (history.length === 0) {
    return `
      <section class="mb-10 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-7">
        <div class="flex flex-col gap-2">
          <h2 class="text-xl font-semibold text-gray-800">Recent Progress</h2>
          <p class="text-sm text-gray-500">
            Complete your first session to see accuracy, duration, and recent practice history here.
          </p>
        </div>
      </section>
    `;
  }

  const totalSessions = history.length;
  const averageAccuracy = Math.round(
    history.reduce((sum, entry) => sum + entry.summary.accuracy, 0) / totalSessions
  );
  const totalQuestions = history.reduce(
    (sum, entry) => sum + entry.summary.totalQuestions,
    0
  );
  const totalPracticeMinutes = Math.max(
    1,
    Math.round(
      history.reduce((sum, entry) => sum + entry.summary.totalTimeMs, 0) / 60000
    )
  );

  return `
    <section class="mb-10">
      <div class="mb-5 flex flex-col gap-2">
        <h2 class="text-xl font-semibold text-gray-800">Recent Progress</h2>
        <p class="text-sm text-gray-500">Your latest completed practice sessions, saved locally in this browser.</p>
      </div>

      <div class="mb-5 grid gap-4 sm:grid-cols-3">
        <article class="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wide text-indigo-600">Completed sessions</p>
          <p class="mt-2 text-3xl font-bold text-indigo-900">${totalSessions}</p>
        </article>
        <article class="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wide text-emerald-600">Average accuracy</p>
          <p class="mt-2 text-3xl font-bold text-emerald-900">${averageAccuracy}%</p>
        </article>
        <article class="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wide text-amber-600">Practice time</p>
          <p class="mt-2 text-3xl font-bold text-amber-900">${totalPracticeMinutes}m</p>
          <p class="mt-1 text-xs text-amber-700">${totalQuestions} completed questions</p>
        </article>
      </div>

      <div class="grid gap-4">
        ${history
          .map((entry) => {
            const exercise = exercises.find((item) => item.type === entry.exerciseType);
            const title = exercise?.title ?? entry.exerciseType;
            const direction =
              entry.config.direction === "mixed"
                ? "Mixed"
                : DIRECTION_LABELS[entry.config.direction] ?? entry.config.direction;
            const questionLabel =
              entry.config.questionCount === 0
                ? `${entry.summary.totalQuestions} answered in endless mode`
                : `${entry.summary.totalQuestions} of ${entry.config.questionCount} completed`;

            return `
              <article class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-base font-semibold text-gray-900">${title}</h3>
                      ${inputTypeBadge(entry.config.inputType)}
                    </div>
                    <p class="mt-1 text-sm text-gray-500">
                      ${direction} • ${questionLabel}
                    </p>
                    <p class="mt-1 text-xs text-gray-400">${formatDateTime(entry.endedAt)}</p>
                  </div>
                  <div class="grid min-w-[11rem] grid-cols-3 gap-3 text-center sm:text-right">
                    <div>
                      <p class="text-xs text-gray-500">Accuracy</p>
                      <p class="text-lg font-semibold text-gray-900">${entry.summary.accuracy}%</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">First try</p>
                      <p class="text-lg font-semibold text-gray-900">${entry.summary.firstAttemptCorrect}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Time</p>
                      <p class="text-lg font-semibold text-gray-900">${formatTime(entry.summary.totalTimeMs)}</p>
                    </div>
                  </div>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

export function renderCatalogView(
  exercises: ExerciseTemplate[],
  history: CompletedSessionRecord[],
  onSelectExercise: (slug: string) => void,
  onOpenLesson: () => void
): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-gray-50";

  container.innerHTML = `
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-indigo-600">Harmonia Trainer</h1>
          <p class="text-gray-500 mt-1">Your harmony singing practice companion</p>
        </div>
        <button
          id="open-lesson-btn"
          type="button"
          class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
        >
          Open Lesson
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-10">
      ${renderHistorySection(exercises, history)}
      <h2 class="text-xl font-semibold text-gray-800 mb-6">Exercise Catalog</h2>
      <div class="grid gap-5" id="exercise-grid">
        ${exercises
          .map(
            (exercise) => `
          <article class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3 hover:border-indigo-400 hover:shadow-md transition-all">
            <div class="flex items-start justify-between gap-4">
              <h3 class="text-lg font-semibold text-gray-900">${exercise.title}</h3>
              <div class="flex flex-wrap gap-1 shrink-0">
                ${exercise.supportedInputTypes.map(inputTypeBadge).join("")}
              </div>
            </div>
            <p class="text-gray-600 text-sm leading-relaxed">${exercise.description}</p>
            <div class="flex flex-wrap gap-1 mt-1">
              ${directionBadges(exercise.supportedDirections)}
            </div>
            <div class="mt-auto pt-3">
              <button
                type="button"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors text-left"
                data-slug="${exercise.slug}"
                aria-label="Configure and start ${exercise.title}"
              >
                Configure &amp; Start ->
              </button>
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </main>
  `;

  container.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("#open-lesson-btn")) {
      onOpenLesson();
      return;
    }

    const button = target.closest<HTMLButtonElement>("button[data-slug]");
    if (button?.dataset["slug"]) {
      onSelectExercise(button.dataset["slug"]);
    }
  });

  return container;
}
