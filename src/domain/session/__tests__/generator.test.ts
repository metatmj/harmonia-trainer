import { describe, it, expect } from "vitest";
import { generateQuestions } from "../generator.js";
import type { ExerciseConfig } from "../../../types/index.js";

const baseConfig: ExerciseConfig = {
  direction: "above",
  allowedKeys: ["C"],
  questionCount: 5,
  melodyLength: 1,
  playbackMode: "auto",
  playTonicBeforeQuestion: false,
  allowReplay: true,
  tempoBpm: 80,
  choiceCount: 4,
  scoringMode: "first-attempt",
  inputType: "multiple-choice",
};

describe("generateQuestions – match-third", () => {
  it("generates the requested number of questions", () => {
    const qs = generateQuestions("match-third", { ...baseConfig, questionCount: 7 });
    expect(qs).toHaveLength(7);
  });

  it("defaults to 10 questions when questionCount is 0 (endless mode)", () => {
    const qs = generateQuestions("match-third", { ...baseConfig, questionCount: 0 });
    expect(qs).toHaveLength(10);
  });

  it("each question has a unique id", () => {
    const qs = generateQuestions("match-third", baseConfig);
    const ids = qs.map((q) => q.id);
    expect(new Set(ids).size).toBe(qs.length);
  });

  it("each question has exactly one melody note and one expected harmony note", () => {
    const qs = generateQuestions("match-third", baseConfig);
    for (const q of qs) {
      expect(q.melody).toHaveLength(1);
      expect(q.expectedHarmony).toHaveLength(1);
    }
  });

  it("each question includes choices equal to choiceCount", () => {
    const qs = generateQuestions("match-third", { ...baseConfig, choiceCount: 3 });
    for (const q of qs) {
      expect(q.choices).toHaveLength(3);
    }
  });

  it("the correct answer is always among the choices", () => {
    const qs = generateQuestions("match-third", baseConfig);
    for (const q of qs) {
      expect(q.choices).toContain(q.expectedHarmony[0]);
    }
  });

  it("choices contain no duplicates", () => {
    const qs = generateQuestions("match-third", baseConfig);
    for (const q of qs) {
      const unique = new Set(q.choices);
      expect(unique.size).toBe(q.choices!.length);
    }
  });

  it("direction is resolved to 'above' or 'below' (never 'mixed')", () => {
    const qs = generateQuestions("match-third", { ...baseConfig, direction: "mixed" });
    for (const q of qs) {
      expect(["above", "below"]).toContain(q.direction);
    }
  });
});

describe("generateQuestions – sing-third", () => {
  const singConfig: ExerciseConfig = {
    ...baseConfig,
    inputType: "voice",
    choiceCount: 1,
  };

  it("generates questions without choices", () => {
    const qs = generateQuestions("sing-third", singConfig);
    for (const q of qs) {
      expect(q.choices).toBeUndefined();
    }
  });

  it("each question has exercise type 'sing-third'", () => {
    const qs = generateQuestions("sing-third", singConfig);
    for (const q of qs) {
      expect(q.exerciseType).toBe("sing-third");
    }
  });
});

describe("generateQuestions – phrase-harmony", () => {
  const phraseConfig: ExerciseConfig = {
    ...baseConfig,
    inputType: "voice",
    melodyLength: 4,
    questionCount: 3,
  };

  it("melody length is clamped to 3–5 notes", () => {
    const qs = generateQuestions("phrase-harmony", phraseConfig);
    for (const q of qs) {
      expect(q.melody.length).toBeGreaterThanOrEqual(3);
      expect(q.melody.length).toBeLessThanOrEqual(5);
    }
  });

  it("harmony has the same length as the melody", () => {
    const qs = generateQuestions("phrase-harmony", phraseConfig);
    for (const q of qs) {
      expect(q.expectedHarmony).toHaveLength(q.melody.length);
    }
  });
});
