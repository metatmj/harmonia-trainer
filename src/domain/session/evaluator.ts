import type {
  AnswerEvaluation,
  GeneratedQuestion,
  UserAnswer,
} from "../../types/index.js";

/**
 * Evaluates a submitted answer against the expected answer for a question.
 *
 * @param question - The question being answered.
 * @param answer - The answer submitted by the user.
 * @param isFirstAttempt - Whether this is the user's first attempt at the question.
 */
export function evaluateAnswer(
  question: GeneratedQuestion,
  answer: UserAnswer,
  isFirstAttempt: boolean
): AnswerEvaluation {
  const expected = question.expectedHarmony;

  if (answer.type === "multiple-choice") {
    const isCorrect = answer.choiceValue === expected[0];
    return {
      isCorrect,
      countedForScore: isFirstAttempt,
      expected,
      actual: answer.choiceValue,
      feedbackCode: isCorrect ? "correct" : "wrong",
      feedbackMessage: isCorrect ? "Correct!" : "Not quite. Try again.",
    };
  }

  if (answer.type === "note-button") {
    const isCorrect = answer.note === expected[0];
    return {
      isCorrect,
      countedForScore: isFirstAttempt,
      expected,
      actual: answer.note,
      feedbackCode: isCorrect ? "correct" : "wrong",
      feedbackMessage: isCorrect ? "Correct!" : "Not quite. Try again.",
    };
  }

  // voice answer
  if (answer.type === "voice") {
    if (question.expectedHarmony.length > 1 || question.melody.length > 1) {
      return {
        isCorrect: false,
        countedForScore: isFirstAttempt,
        expected,
        actual: null,
        feedbackCode: "wrong",
        feedbackMessage:
          "Phrase harmony voice evaluation is not available yet. Try a single-note exercise instead.",
      };
    }

    if (answer.confidence < 0.5 || answer.detectedNote === undefined) {
      return {
        isCorrect: false,
        countedForScore: isFirstAttempt,
        expected,
        actual: null,
        pitchJudgement: "no-input",
        feedbackCode: "no-input",
        feedbackMessage: "No reliable pitch detected. Try again.",
      };
    }

    const detectedNote = answer.detectedNote;

    // Same-as-melody judgement takes precedence (SRS 3.7.4)
    if (question.melody.length > 0 && detectedNote === question.melody[0]) {
      return {
        isCorrect: false,
        countedForScore: isFirstAttempt,
        expected,
        actual: detectedNote,
        pitchJudgement: "same-as-melody",
        feedbackCode: "same-as-melody",
        feedbackMessage:
          "That sounds like the melody note. Aim for the harmony note.",
      };
    }

    const isCorrect = detectedNote === expected[0];
    return {
      isCorrect,
      countedForScore: isFirstAttempt,
      expected,
      actual: detectedNote,
      pitchJudgement: isCorrect ? "correct" : "wrong",
      feedbackCode: isCorrect ? "correct" : "wrong",
      feedbackMessage: isCorrect ? "Correct!" : "Wrong note. Try again.",
    };
  }

  throw new Error(
    `Unknown answer type: ${(answer as { type: string }).type}. Expected 'multiple-choice', 'note-button', or 'voice'.`
  );
}
