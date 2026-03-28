import type { PlaybackPlan } from "../types/index.js";

type BackFn = () => void;
type PlayExampleFn = (exampleId: "above" | "below") => void;

const C_MAJOR_RELATIONSHIPS = [
  { melody: "C", above: "E", below: "A" },
  { melody: "D", above: "F", below: "B" },
  { melody: "E", above: "G", below: "C" },
  { melody: "F", above: "A", below: "D" },
  { melody: "G", above: "B", below: "E" },
  { melody: "A", above: "C", below: "F" },
  { melody: "B", above: "D", below: "G" },
];

export const LESSON_PLAYBACK_PLANS: Record<"above" | "below", PlaybackPlan> = {
  above: {
    notes: [
      { note: "C", durationMs: 750 },
      { note: "E", durationMs: 750 },
    ],
  },
  below: {
    notes: [
      { note: "E", durationMs: 750 },
      { note: "C", durationMs: 750 },
    ],
  },
};

export function renderLessonView(
  onBack: BackFn,
  onPlayExample: PlayExampleFn
): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-stone-50";

  container.innerHTML = `
    <header class="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center gap-4 px-6 py-5">
        <button
          id="lesson-back-btn"
          class="text-sm text-stone-500 transition-colors hover:text-stone-900"
          aria-label="Back to catalog"
        >
          <- Catalog
        </button>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
            Beginner Lesson
          </p>
          <h1 class="text-3xl font-bold text-stone-900">Third Above and Third Below</h1>
        </div>
      </div>
    </header>

    <main class="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <section class="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <article class="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
            Core Idea
          </p>
          <h2 class="mt-3 text-2xl font-semibold text-stone-900">
            A third means moving two scale steps away from the melody.
          </h2>
          <div class="mt-5 space-y-4 text-stone-600">
            <p>
              In a major scale, a <strong>third above</strong> takes the melody note and moves up
              to the note two scale positions later. If the melody is <strong>C</strong>, the
              third above is <strong>E</strong>.
            </p>
            <p>
              A <strong>third below</strong> moves the other direction. If the melody is
              <strong>E</strong>, the third below is <strong>C</strong>.
            </p>
            <p>
              Harmony singing gets easier when you stop guessing chromatically and instead think in
              terms of the scale you are in.
            </p>
          </div>
        </article>

        <aside class="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
            Quick Rule
          </p>
          <div class="mt-4 space-y-4 text-stone-700">
            <div>
              <p class="text-sm text-stone-500">Third Above</p>
              <p class="text-lg font-semibold">1 -> 3, 2 -> 4, 3 -> 5</p>
            </div>
            <div>
              <p class="text-sm text-stone-500">Third Below</p>
              <p class="text-lg font-semibold">3 -> 1, 4 -> 2, 5 -> 3</p>
            </div>
            <p class="text-sm text-stone-500">
              When you reach the end of the scale, you wrap around to the beginning.
            </p>
          </div>
        </aside>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <article class="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
                Example
              </p>
              <h2 class="mt-3 text-2xl font-semibold text-stone-900">C to E is a third above</h2>
            </div>
            <button
              type="button"
              data-example="above"
              class="lesson-play-btn rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100"
            >
              Play Example
            </button>
          </div>
          <p class="mt-5 text-stone-600">
            In C major, counting C as 1, D as 2, and E as 3 gives us the harmony note E.
          </p>
        </article>

        <article class="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-rose-700">
                Example
              </p>
              <h2 class="mt-3 text-2xl font-semibold text-stone-900">E to C is a third below</h2>
            </div>
            <button
              type="button"
              data-example="below"
              class="lesson-play-btn rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
            >
              Play Example
            </button>
          </div>
          <p class="mt-5 text-stone-600">
            In the same key, if the melody lands on E, the harmony a third below returns to C.
          </p>
        </article>
      </section>

      <section class="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-700">
              Reference Table
            </p>
            <h2 class="mt-3 text-2xl font-semibold text-stone-900">
              C major note relationships
            </h2>
          </div>
          <p class="text-sm text-stone-500">Use this as a beginner cheat sheet.</p>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="min-w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr class="text-xs uppercase tracking-[0.2em] text-stone-500">
                <th class="px-4 py-2">Melody</th>
                <th class="px-4 py-2">Third Above</th>
                <th class="px-4 py-2">Third Below</th>
              </tr>
            </thead>
            <tbody>
              ${C_MAJOR_RELATIONSHIPS.map(
                (row) => `
                  <tr class="rounded-2xl bg-stone-50 text-stone-800">
                    <td class="rounded-l-2xl px-4 py-3 font-semibold">${row.melody}</td>
                    <td class="px-4 py-3">${row.above}</td>
                    <td class="rounded-r-2xl px-4 py-3">${row.below}</td>
                  </tr>
                `
              ).join("")}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `;

  container
    .querySelector<HTMLButtonElement>("#lesson-back-btn")
    ?.addEventListener("click", onBack);

  container.querySelectorAll<HTMLButtonElement>(".lesson-play-btn").forEach((button) => {
    const exampleId = button.dataset["example"];
    if (exampleId === "above" || exampleId === "below") {
      button.addEventListener("click", () => onPlayExample(exampleId));
    }
  });

  return container;
}
