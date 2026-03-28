import type {
  AnswerEvaluation,
  GeneratedQuestion,
  UserAnswer,
} from "../../types/index.js";

const CORRECT_CENTS_TOLERANCE = 30;
const NEAR_CENTS_TOLERANCE = 70;

function centsDifference(actualFrequency: number, targetMidi: number): number {
  const targetFrequency = 440 * 2 ** ((targetMidi - 69) / 12);
  return 1200 * Math.log2(actualFrequency / targetFrequency);
}

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
      const detectedNotes = answer.detectedNotes ?? [];

      if (detectedNotes.length === 0) {
        return {
          isCorrect: false,
          countedForScore: isFirstAttempt,
          expected,
          actual: null,
          pitchJudgement: "no-input",
          feedbackCode: "no-input",
          feedbackMessage: "No reliable phrase input detected. Try again.",
        };
      }

      const matchesMelody =
        detectedNotes.length === question.melody.length &&
        detectedNotes.every((note, index) => note === question.melody[index]);
      if (matchesMelody) {
        return {
          isCorrect: false,
          countedForScore: isFirstAttempt,
          expected,
          actual: detectedNotes,
          pitchJudgement: "same-as-melody",
          feedbackCode: "same-as-melody",
          feedbackMessage:
            "That phrase matches the melody. Try singing the harmony line instead.",
        };
      }

      const isCorrect =
        detectedNotes.length === expected.length &&
        detectedNotes.every((note, index) => note === expected[index]);

      return {
        isCorrect,
        countedForScore: isFirstAttempt,
        expected,
        actual: detectedNotes,
        pitchJudgement: isCorrect ? "correct" : "wrong",
        feedbackCode: isCorrect ? "correct" : "wrong",
        feedbackMessage: isCorrect
          ? "Correct phrase!"
          : "That phrase does not match the harmony line. Try again.",
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
    const detectedFrequency = answer.detectedFrequency;
    const expectedHarmonyMidis = question.metadata?.["expectedHarmonyMidis"];
    const targetMidi =
      Array.isArray(expectedHarmonyMidis) &&
      typeof expectedHarmonyMidis[0] === "number"
        ? expectedHarmonyMidis[0]
        : null;

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

    if (detectedFrequency && targetMidi !== null) {
      const centsOff = centsDifference(detectedFrequency, targetMidi);
      if (Math.abs(centsOff) <= CORRECT_CENTS_TOLERANCE) {
        return {
          isCorrect: true,
          countedForScore: isFirstAttempt,
          expected,
          actual: detectedNote,
          pitchJudgement: "correct",
          feedbackCode: "correct",
          feedbackMessage: "Correct!",
        };
      }

      if (centsOff > CORRECT_CENTS_TOLERANCE && centsOff <= NEAR_CENTS_TOLERANCE) {
        return {
          isCorrect: false,
          countedForScore: isFirstAttempt,
          expected,
          actual: detectedNote,
          pitchJudgement: "near-high",
          feedbackCode: "near-high",
          feedbackMessage: "Close, but a little high. Try again.",
        };
      }

      if (centsOff < -CORRECT_CENTS_TOLERANCE && centsOff >= -NEAR_CENTS_TOLERANCE) {
        return {
          isCorrect: false,
          countedForScore: isFirstAttempt,
          expected,
          actual: detectedNote,
          pitchJudgement: "near-low",
          feedbackCode: "near-low",
          feedbackMessage: "Close, but a little low. Try again.",
        };
      }
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
