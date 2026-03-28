import { describe, it, expect, beforeEach } from "vitest";
import { SessionEngine } from "../engine.js";
import type { ExerciseConfig } from "../../../types/index.js";

const config: ExerciseConfig = {
  direction: "above",
  allowedKeys: ["C"],
  questionCount: 3,
  melodyLength: 1,
  playbackMode: "auto",
  playTonicBeforeQuestion: false,
  allowReplay: true,
  tempoBpm: 80,
  choiceCount: 4,
  scoringMode: "first-attempt",
  inputType: "multiple-choice",
};

describe("SessionEngine", () => {
  let engine: SessionEngine;

  beforeEach(() => {
    engine = new SessionEngine();
  });

  // ── createSession ──────────────────────────────────────────────────────────

  describe("createSession", () => {
    it("returns a session with status 'active'", () => {
      const session = engine.createSession("match-third", config);
      expect(session.status).toBe("active");
    });

    it("generates the requested number of questions", () => {
      const session = engine.createSession("match-third", config);
      expect(session.questions).toHaveLength(3);
    });

    it("starts at question index 0", () => {
      const session = engine.createSession("match-third", config);
      expect(session.currentQuestionIndex).toBe(0);
    });

    it("assigns a unique stable id", () => {
      const s1 = engine.createSession("match-third", config);
      const s2 = engine.createSession("match-third", config);
      expect(s1.id).not.toBe(s2.id);
    });

    it("records a startedAt timestamp", () => {
      const session = engine.createSession("match-third", config);
      expect(typeof session.startedAt).toBe("string");
      expect(() => new Date(session.startedAt)).not.toThrow();
    });

    it("replaces the previously active session (one active at a time)", () => {
      const first = engine.createSession("match-third", config);
      const second = engine.createSession("match-third", config);
      expect(engine.getSession(first.id)?.status).toBe("abandoned");
      expect(engine.getActiveSession()?.id).toBe(second.id);
    });
  });

  // ── getSession / getActiveSession ─────────────────────────────────────────

  describe("getSession", () => {
    it("retrieves a session by id", () => {
      const session = engine.createSession("match-third", config);
      expect(engine.getSession(session.id)).toBe(session);
    });

    it("returns null for an unknown id", () => {
      expect(engine.getSession("not-a-real-id")).toBeNull();
    });
  });

  describe("getActiveSession", () => {
    it("returns null before any session is created", () => {
      expect(engine.getActiveSession()).toBeNull();
    });

    it("returns the most recently created session", () => {
      const session = engine.createSession("match-third", config);
      expect(engine.getActiveSession()?.id).toBe(session.id);
    });

    it("returns null after the active session is completed", () => {
      const session = engine.createSession("match-third", {
        ...config,
        questionCount: 1,
      });

      engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: session.questions[0].expectedHarmony[0],
      });

      expect(engine.getActiveSession()).toBeNull();
    });
  });

  // ── submitAnswer ──────────────────────────────────────────────────────────

  describe("submitAnswer", () => {
    it("returns an evaluation for the submitted answer", () => {
      const session = engine.createSession("match-third", config);
      const correctNote = session.questions[0].expectedHarmony[0];
      const { evaluation } = engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: correctNote,
      });
      expect(evaluation.isCorrect).toBe(true);
    });

    it("advances the question index after a correct answer", () => {
      const session = engine.createSession("match-third", config);
      const correctNote = session.questions[0].expectedHarmony[0];
      const { session: updated } = engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: correctNote,
      });
      expect(updated.currentQuestionIndex).toBe(1);
    });

    it("does not advance after an incorrect answer", () => {
      const session = engine.createSession("match-third", config);
      const wrongNote = session.questions[0].choices!.find(
        (c) => c !== session.questions[0].expectedHarmony[0]
      )!;
      const { session: updated } = engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: wrongNote,
      });
      expect(updated.currentQuestionIndex).toBe(0);
    });

    it("stores the answer in session.answers[qi]", () => {
      const session = engine.createSession("match-third", config);
      const correctNote = session.questions[0].expectedHarmony[0];
      engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: correctNote,
      });
      expect(session.answers[0]).toHaveLength(1);
    });

    it("first attempt is countedForScore; subsequent attempts are not", () => {
      const session = engine.createSession("match-third", config);
      const wrongNote = session.questions[0].choices!.find(
        (c) => c !== session.questions[0].expectedHarmony[0]
      )!;
      const correctNote = session.questions[0].expectedHarmony[0];

      const { evaluation: first } = engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: wrongNote,
      });
      const { evaluation: second } = engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: correctNote,
      });

      expect(first.countedForScore).toBe(true);
      expect(second.countedForScore).toBe(false);
    });

    it("auto-completes the session when the last question is answered correctly", () => {
      const session = engine.createSession("match-third", {
        ...config,
        questionCount: 1,
      });
      const correctNote = session.questions[0].expectedHarmony[0];
      const { session: updated } = engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: correctNote,
      });
      expect(updated.status).toBe("completed");
      expect(updated.summary).toBeDefined();
    });

    it("throws for an unknown session id", () => {
      expect(() =>
        engine.submitAnswer("ghost-id", {
          type: "multiple-choice",
          choiceIndex: 0,
          choiceValue: "C",
        })
      ).toThrow();
    });

    it("throws when submitting to a replaced session", () => {
      const first = engine.createSession("match-third", config);
      engine.createSession("match-third", config);

      expect(() =>
        engine.submitAnswer(first.id, {
          type: "multiple-choice",
          choiceIndex: 0,
          choiceValue: first.questions[0].expectedHarmony[0],
        })
      ).toThrow(/not the active session/);
    });

    it("extends endless sessions instead of running out of questions", () => {
      const session = engine.createSession("match-third", {
        ...config,
        questionCount: 0,
      });
      const initialLength = session.questions.length;

      for (let i = 0; i < initialLength; i++) {
        const current = session.questions[session.currentQuestionIndex];
        engine.submitAnswer(session.id, {
          type: "multiple-choice",
          choiceIndex: 0,
          choiceValue: current.expectedHarmony[0],
        });
      }

      expect(session.status).toBe("active");
      expect(session.questions.length).toBeGreaterThan(initialLength);
      expect(session.currentQuestionIndex).toBe(initialLength);

      const next = session.questions[session.currentQuestionIndex];
      expect(next).toBeDefined();

      expect(() =>
        engine.submitAnswer(session.id, {
          type: "multiple-choice",
          choiceIndex: 0,
          choiceValue: next.expectedHarmony[0],
        })
      ).not.toThrow();
    });
  });

  // ── finishSession ─────────────────────────────────────────────────────────

  describe("finishSession", () => {
    it("marks the session as completed", () => {
      const session = engine.createSession("match-third", config);
      const { session: finished } = engine.finishSession(session.id);
      expect(finished.status).toBe("completed");
    });

    it("sets endedAt timestamp", () => {
      const session = engine.createSession("match-third", config);
      const { session: finished } = engine.finishSession(session.id);
      expect(typeof finished.endedAt).toBe("string");
    });

    it("returns summary with correct structure", () => {
      const session = engine.createSession("match-third", config);
      const correctNote0 = session.questions[0].expectedHarmony[0];
      const wrongNote0 = session.questions[0].choices!.find(
        (c) => c !== correctNote0
      )!;

      // Q0: wrong then correct (not first-attempt correct)
      engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: wrongNote0,
      });
      engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: correctNote0,
      });

      // Q1: correct first time
      const correctNote1 = session.questions[1].expectedHarmony[0];
      engine.submitAnswer(session.id, {
        type: "multiple-choice",
        choiceIndex: 0,
        choiceValue: correctNote1,
      });

      const { summary } = engine.finishSession(session.id);

      expect(summary.totalQuestions).toBe(2);
      expect(summary.firstAttemptCorrect).toBe(1);
      expect(summary.accuracy).toBe(50);
      expect(summary.totalAttempts).toBe(3); // wrong + correct (Q0) + correct (Q1)
      expect(typeof summary.totalTimeMs).toBe("number");
      expect(summary.byKey).toBeDefined();
      expect(summary.byDirection).toBeDefined();
    });

    it("returns 100% accuracy when all questions answered correctly on first attempt", () => {
      const session = engine.createSession("match-third", {
        ...config,
        questionCount: 2,
      });
      for (let i = 0; i < 2; i++) {
        engine.submitAnswer(session.id, {
          type: "multiple-choice",
          choiceIndex: 0,
          choiceValue: session.questions[i].expectedHarmony[0],
        });
      }
      const { summary } = engine.finishSession(session.id);
      expect(summary.accuracy).toBe(100);
    });

    it("returns 0% accuracy when no questions have been answered", () => {
      const session = engine.createSession("match-third", config);
      const { summary } = engine.finishSession(session.id);
      expect(summary.accuracy).toBe(0);
      expect(summary.totalQuestions).toBe(0);
    });

    it("throws for an unknown session id", () => {
      expect(() => engine.finishSession("ghost-id")).toThrow();
    });
  });
});
