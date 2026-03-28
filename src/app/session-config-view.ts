import type { ExerciseConfig, ExerciseTemplate } from "../types/index.js";
import type { NoteName } from "../domain/theory/notes.js";
import { SUPPORTED_KEYS } from "../domain/theory/scales.js";

export type { ExerciseConfig };

const DIRECTION_OPTIONS = [
  { value: "above", label: "Third Above" },
  { value: "below", label: "Third Below" },
  { value: "mixed", label: "Mixed (random per question)" },
] as const;

function buildKeyCheckboxes(selectedKeys: readonly NoteName[]): string {
  return SUPPORTED_KEYS.map(
    (key) => `
    <label class="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        class="key-checkbox accent-indigo-600"
        value="${key}"
        ${selectedKeys.includes(key) ? "checked" : ""}
      />
      ${key}
    </label>`
  ).join("");
}

function buildPresetOptions(exercise: ExerciseTemplate): string {
  if (exercise.presets.length === 0) return "";
  const options = exercise.presets
    .map((preset) => `<option value="${preset.id}">${preset.label}</option>`)
    .join("");
  return `
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">Quick Preset</label>
      <select
        id="preset-select"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">-- Choose a preset --</option>
        ${options}
      </select>
    </div>
  `;
}

function parseIntegerOrFallback(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function renderSessionConfigView(
  exercise: ExerciseTemplate,
  onStart: (config: ExerciseConfig) => void,
  onBack: () => void
): HTMLElement {
  const defaults = exercise.defaultConfig;
  const container = document.createElement("div");
  container.className = "min-h-screen bg-gray-50";

  container.innerHTML = `
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
        <button id="back-btn" class="text-gray-400 hover:text-gray-700 transition-colors text-lg" aria-label="Back to catalog">
          <- Back
        </button>
        <div>
          <h1 class="text-2xl font-bold text-indigo-600">${exercise.title}</h1>
          <p class="text-gray-500 text-sm">${exercise.description}</p>
        </div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-6 py-10">
      <form id="config-form" novalidate>
        ${buildPresetOptions(exercise)}

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Direction</label>
          <div class="flex flex-col gap-2">
            ${DIRECTION_OPTIONS.filter((option) =>
              exercise.supportedDirections.includes(option.value)
            )
              .map(
                (option) => `
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="direction"
                  value="${option.value}"
                  class="accent-indigo-600"
                  ${defaults.direction === option.value ? "checked" : ""}
                />
                ${option.label}
              </label>`
              )
              .join("")}
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Allowed Keys</label>
          <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 p-3 bg-white border border-gray-200 rounded-lg">
            ${buildKeyCheckboxes(defaults.allowedKeys)}
          </div>
          <p class="text-xs text-gray-400 mt-1">Select at least one key.</p>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1" for="question-count">
            Number of Questions <span class="text-gray-400">(0 = endless)</span>
          </label>
          <input
            type="number"
            id="question-count"
            min="0"
            max="50"
            value="${defaults.questionCount}"
            class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        ${
          exercise.type !== "match-third"
            ? ""
            : `
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1" for="choice-count">
            Number of Choices
          </label>
          <select
            id="choice-count"
            class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="3" ${defaults.choiceCount === 3 ? "selected" : ""}>3</option>
            <option value="4" ${defaults.choiceCount === 4 ? "selected" : ""}>4</option>
          </select>
        </div>`
        }

        ${
          exercise.type === "phrase-harmony"
            ? `
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1" for="melody-length">
            Melody Length (3-5 notes)
          </label>
          <input
            type="number"
            id="melody-length"
            min="3"
            max="5"
            value="${defaults.melodyLength}"
            class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>`
            : ""
        }

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1" for="tempo">
            Tempo (BPM)
          </label>
          <input
            type="number"
            id="tempo"
            min="40"
            max="200"
            value="${defaults.tempoBpm}"
            class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="mb-8 flex flex-col gap-3">
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              id="play-tonic"
              class="accent-indigo-600"
              ${defaults.playTonicBeforeQuestion ? "checked" : ""}
            />
            Play tonic before each question
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              id="allow-replay"
              class="accent-indigo-600"
              ${defaults.allowReplay ? "checked" : ""}
            />
            Allow replay
          </label>
        </div>

        <div id="form-error" class="hidden text-red-600 text-sm mb-4"></div>

        <button
          type="submit"
          class="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors text-base"
        >
          Start Session
        </button>
      </form>
    </main>
  `;

  const form = container.querySelector<HTMLFormElement>("#config-form")!;
  const errorEl = container.querySelector<HTMLElement>("#form-error")!;

  container
    .querySelector<HTMLButtonElement>("#back-btn")!
    .addEventListener("click", onBack);

  const presetSelect =
    container.querySelector<HTMLSelectElement>("#preset-select");
  if (presetSelect) {
    presetSelect.addEventListener("change", () => {
      const presetId = presetSelect.value;
      const preset = exercise.presets.find((item) => item.id === presetId);
      if (!preset) return;
      applyConfigToForm(container, preset.config);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorEl.classList.add("hidden");
    errorEl.textContent = "";

    const config = readConfigFromForm(container, exercise);
    if (!config) {
      errorEl.textContent = "Please select at least one key.";
      errorEl.classList.remove("hidden");
      return;
    }

    onStart(config);
  });

  return container;
}

function readConfigFromForm(
  container: HTMLElement,
  exercise: ExerciseTemplate
): ExerciseConfig | null {
  const direction = (
    container.querySelector<HTMLInputElement>('input[name="direction"]:checked')
      ?.value ?? exercise.defaultConfig.direction
  ) as ExerciseConfig["direction"];

  const checkedKeys = Array.from(
    container.querySelectorAll<HTMLInputElement>(".key-checkbox:checked")
  ).map((element) => element.value as NoteName);

  if (checkedKeys.length === 0) return null;

  const questionCount = Math.max(
    0,
    parseIntegerOrFallback(
      container.querySelector<HTMLInputElement>("#question-count")?.value,
      exercise.defaultConfig.questionCount
    )
  );

  const choiceCount = parseIntegerOrFallback(
    container.querySelector<HTMLSelectElement>("#choice-count")?.value,
    exercise.defaultConfig.choiceCount
  );

  const melodyLength = parseIntegerOrFallback(
    container.querySelector<HTMLInputElement>("#melody-length")?.value,
    exercise.defaultConfig.melodyLength
  );

  const tempoBpm = parseIntegerOrFallback(
    container.querySelector<HTMLInputElement>("#tempo")?.value,
    exercise.defaultConfig.tempoBpm
  );

  const playTonicBeforeQuestion =
    container.querySelector<HTMLInputElement>("#play-tonic")?.checked ?? false;

  const allowReplay =
    container.querySelector<HTMLInputElement>("#allow-replay")?.checked ?? true;

  return {
    direction,
    allowedKeys: checkedKeys,
    questionCount,
    melodyLength,
    playbackMode: exercise.defaultConfig.playbackMode,
    playTonicBeforeQuestion,
    allowReplay,
    tempoBpm,
    choiceCount,
    scoringMode: exercise.defaultConfig.scoringMode,
    inputType: exercise.defaultConfig.inputType,
  };
}

function applyConfigToForm(
  container: HTMLElement,
  config: ExerciseConfig
): void {
  const dirRadio = container.querySelector<HTMLInputElement>(
    `input[name="direction"][value="${config.direction}"]`
  );
  if (dirRadio) dirRadio.checked = true;

  container
    .querySelectorAll<HTMLInputElement>(".key-checkbox")
    .forEach((checkbox) => {
      checkbox.checked = config.allowedKeys.includes(checkbox.value as NoteName);
    });

  const questionCount = container.querySelector<HTMLInputElement>("#question-count");
  if (questionCount) questionCount.value = String(config.questionCount);

  const choiceCount = container.querySelector<HTMLSelectElement>("#choice-count");
  if (choiceCount) choiceCount.value = String(config.choiceCount);

  const melodyLength = container.querySelector<HTMLInputElement>("#melody-length");
  if (melodyLength) melodyLength.value = String(config.melodyLength);

  const tempo = container.querySelector<HTMLInputElement>("#tempo");
  if (tempo) tempo.value = String(config.tempoBpm);

  const playTonic = container.querySelector<HTMLInputElement>("#play-tonic");
  if (playTonic) playTonic.checked = config.playTonicBeforeQuestion;

  const replay = container.querySelector<HTMLInputElement>("#allow-replay");
  if (replay) replay.checked = config.allowReplay;
}
