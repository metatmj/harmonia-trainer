import { describe, it, expect } from "vitest";
import { evaluateAnswer } from "../evaluator.js";
import type { GeneratedQuestion } from "../../../types/index.js";

const baseQuestion: GeneratedQuestion = {
  id: "q-test-1",
  exerciseType: "match-third",
  key: "C",
  direction: "above",
  melody: ["C"],
  expectedHarmony: ["E"],
  choices: ["E", "D", "F", "G"],
  metadata: {
    melodyMidis: [60],
    expectedHarmonyMidis: [64],
  },
};

describe("evaluateAnswer - multiple-choice", () => {
  it("marks correct when choice matches expected harmony", () => {
    const result = evaluateAnswer(
      baseQuestion,
      { type: "multiple-choice", choiceIndex: 0, choiceValue: "E" },
      true
    );
    expect(result.isCorrect).toBe(true);
    expect(result.feedbackCode).toBe("correct");
    expect(result.actual).toBe("E");
  });

  it("marks incorrect when choice does not match", () => {
    const result = evaluateAnswer(
      baseQuestion,
      { type: "multiple-choice", choiceIndex: 1, choiceValue: "D" },
      true
    );
    expect(result.isCorrect).toBe(false);
    expect(result.feedbackCode).toBe("wrong");
  });

  it("countedForScore is true for first attempt", () => {
    const result = evaluateAnswer(
      baseQuestion,
      { type: "multiple-choice", choiceIndex: 0, choiceValue: "E" },
      true
    );
    expect(result.countedForScore).toBe(true);
  });

  it("countedForScore is false for subsequent attempts", () => {
    const result = evaluateAnswer(
      baseQuestion,
      { type: "multiple-choice", choiceIndex: 0, choiceValue: "E" },
      false
    );
    expect(result.countedForScore).toBe(false);
  });

  it("includes expected harmony in evaluation", () => {
    const result = evaluateAnswer(
      baseQuestion,
      { type: "multiple-choice", choiceIndex: 0, choiceValue: "E" },
      true
    );
    expect(result.expected).toEqual(["E"]);
  });
});

describe("evaluateAnswer - note-button", () => {
  it("marks correct when note matches expected harmony", () => {
    const result = evaluateAnswer(
      baseQuestion,
      { type: "note-button", midi: 64, note: "E" },
      true
    );
    expect(result.isCorrect).toBe(true);
    expect(result.feedbackCode).toBe("correct");
  });

  it("marks incorrect when note does not match", () => {
    const result = evaluateAnswer(
      baseQuestion,
      { type: "note-button", midi: 62, note: "D" },
      true
    );
    expect(result.isCorrect).toBe(false);
  });
});

describe("evaluateAnswer - voice", () => {
  const singQuestion: GeneratedQuestion = {
    ...baseQuestion,
    exerciseType: "sing-third",
    choices: undefined,
  };

  it("returns no-input when confidence is below 0.5", () => {
    const result = evaluateAnswer(
      singQuestion,
      { type: "voice", confidence: 0.3, detectedNote: "E" },
      true
    );
    expect(result.isCorrect).toBe(false);
    expect(result.feedbackCode).toBe("no-input");
  });

  it("returns no-input when detectedNote is undefined", () => {
    const result = evaluateAnswer(
      singQuestion,
      { type: "voice", confidence: 0.9 },
      true
    );
    expect(result.feedbackCode).toBe("no-input");
  });

  it("returns same-as-melody when melody note is sung instead of harmony", () => {
    const result = evaluateAnswer(
      singQuestion,
      { type: "voice", confidence: 0.9, detectedNote: "C" },
      true
    );
    expect(result.feedbackCode).toBe("same-as-melody");
    expect(result.isCorrect).toBe(false);
  });

  it("marks correct when detected note matches expected harmony", () => {
    const result = evaluateAnswer(
      singQuestion,
      {
        type: "voice",
        confidence: 0.9,
        detectedNote: "E",
        detectedFrequency: 329.63,
      },
      true
    );
    expect(result.isCorrect).toBe(true);
    expect(result.feedbackCode).toBe("correct");
  });

  it("returns near-high when the detected pitch is slightly above target", () => {
    const result = evaluateAnswer(
      singQuestion,
      {
        type: "voice",
        confidence: 0.9,
        detectedNote: "F",
        detectedFrequency: 337.35,
      },
      true
    );

    expect(result.isCorrect).toBe(false);
    expect(result.feedbackCode).toBe("near-high");
  });

  it("returns near-low when the detected pitch is slightly below target", () => {
    const result = evaluateAnswer(
      singQuestion,
      {
        type: "voice",
        confidence: 0.9,
        detectedNote: "D#",
        detectedFrequency: 322.1,
      },
      true
    );

    expect(result.isCorrect).toBe(false);
    expect(result.feedbackCode).toBe("near-low");
  });

  it("marks wrong when detected note does not match harmony or melody", () => {
    const result = evaluateAnswer(
      singQuestion,
      { type: "voice", confidence: 0.9, detectedNote: "G" },
      true
    );
    expect(result.isCorrect).toBe(false);
    expect(result.feedbackCode).toBe("wrong");
  });

  it("marks a matching phrase-harmony sequence as correct", () => {
    const phraseQuestion: GeneratedQuestion = {
      ...singQuestion,
      exerciseType: "phrase-harmony",
      melody: ["C", "D", "E"],
      expectedHarmony: ["E", "F", "G"],
    };

    const result = evaluateAnswer(
      phraseQuestion,
      { type: "voice", confidence: 0.9, detectedNotes: ["E", "F", "G"] },
      true
    );

    expect(result.isCorrect).toBe(true);
    expect(result.actual).toEqual(["E", "F", "G"]);
    expect(result.feedbackCode).toBe("correct");
  });

  it("returns same-as-melody when the captured phrase matches the melody", () => {
    const phraseQuestion: GeneratedQuestion = {
      ...singQuestion,
      exerciseType: "phrase-harmony",
      melody: ["C", "D", "E"],
      expectedHarmony: ["E", "F", "G"],
    };

    const result = evaluateAnswer(
      phraseQuestion,
      { type: "voice", confidence: 0.9, detectedNotes: ["C", "D", "E"] },
      true
    );

    expect(result.isCorrect).toBe(false);
    expect(result.feedbackCode).toBe("same-as-melody");
  });

  it("returns no-input when a phrase submission has no captured notes", () => {
    const phraseQuestion: GeneratedQuestion = {
      ...singQuestion,
      exerciseType: "phrase-harmony",
      melody: ["C", "D", "E"],
      expectedHarmony: ["E", "F", "G"],
    };

    const result = evaluateAnswer(
      phraseQuestion,
      { type: "voice", confidence: 0.9, detectedNotes: [] },
      true
    );

    expect(result.isCorrect).toBe(false);
    expect(result.feedbackCode).toBe("no-input");
  });
});
