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
};

describe("evaluateAnswer – multiple-choice", () => {
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

describe("evaluateAnswer – note-button", () => {
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

describe("evaluateAnswer – voice", () => {
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
      { type: "voice", confidence: 0.9, detectedNote: "E" },
      true
    );
    expect(result.isCorrect).toBe(true);
    expect(result.feedbackCode).toBe("correct");
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

  it("rejects phrase-harmony voice evaluation until phrase scoring exists", () => {
    const phraseQuestion: GeneratedQuestion = {
      ...singQuestion,
      exerciseType: "phrase-harmony",
      melody: ["C", "D", "E"],
      expectedHarmony: ["E", "F", "G"],
    };

    const result = evaluateAnswer(
      phraseQuestion,
      { type: "voice", confidence: 0.9, detectedNote: "E" },
      true
    );

    expect(result.isCorrect).toBe(false);
    expect(result.actual).toBeNull();
    expect(result.feedbackMessage).toContain("not available yet");
  });
});
