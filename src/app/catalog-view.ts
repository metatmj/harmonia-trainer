import type { ExerciseTemplate } from "../types/index.js";

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
  return `<span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colour}">
    ${inputType === "voice" ? "🎤" : "🎵"} ${label}
  </span>`;
}

function directionBadges(directions: string[]): string {
  return directions
    .map(
      (d) =>
        `<span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">${DIRECTION_LABELS[d] ?? d}</span>`
    )
    .join(" ");
}

export function renderCatalogView(
  exercises: ExerciseTemplate[],
  onSelectExercise: (slug: string) => void
): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-gray-50";

  container.innerHTML = `
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-4xl mx-auto px-6 py-5">
        <h1 class="text-3xl font-bold text-indigo-600">Harmonia Trainer</h1>
        <p class="text-gray-500 mt-1">Your harmony singing practice companion</p>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-10">
      <h2 class="text-xl font-semibold text-gray-800 mb-6">Exercise Catalog</h2>
      <div class="grid gap-5" id="exercise-grid">
        ${exercises
          .map(
            (ex) => `
          <div
            class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
            data-slug="${ex.slug}"
            role="button"
            tabindex="0"
            aria-label="Open ${ex.title}"
          >
            <div class="flex items-start justify-between gap-4">
              <h3 class="text-lg font-semibold text-gray-900">${ex.title}</h3>
              <div class="flex flex-wrap gap-1 shrink-0">
                ${ex.supportedInputTypes.map(inputTypeBadge).join("")}
              </div>
            </div>
            <p class="text-gray-600 text-sm leading-relaxed">${ex.description}</p>
            <div class="flex flex-wrap gap-1 mt-1">
              ${directionBadges(ex.supportedDirections)}
            </div>
            <div class="mt-auto pt-3">
              <button
                class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                data-slug="${ex.slug}"
              >
                Configure &amp; Start →
              </button>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </main>
  `;

  // Event delegation – handle clicks on cards or the inner button
  container.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const card = target.closest<HTMLElement>("[data-slug]");
    if (card?.dataset["slug"]) {
      onSelectExercise(card.dataset["slug"]);
    }
  });

  container.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const target = e.target as HTMLElement;
      const card = target.closest<HTMLElement>("[data-slug]");
      if (card?.dataset["slug"]) {
        e.preventDefault();
        onSelectExercise(card.dataset["slug"]);
      }
    }
  });

  return container;
}
