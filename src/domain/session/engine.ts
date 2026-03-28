import type {
  AnswerEvaluation,
  ExerciseConfig,
  ExerciseSession,
  ExerciseType,
  SessionSummary,
  UserAnswer,
} from "../../types/index.js";
import { generateQuestions } from "./generator.js";
import { evaluateAnswer } from "./evaluator.js";

const ENDLESS_BATCH_SIZE = 10;

/**
 * Generates a simple unique id without relying on Web Crypto API, which may
 * not be available in all test environments (e.g. older Node.js versions).
 */
function makeSessionId(): string {
  return `session-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/**
 * Client-side session engine.
 *
 * Maintains at most one active session at a time.  The API surface mirrors the
 * server API contract described in SRS §3.5 so the module boundary is
 * compatible with a future backend.
 */
export class SessionEngine {
  private sessions = new Map<string, ExerciseSession>();
  private activeSessionId: string | null = null;

  // ── POST /api/sessions ────────────────────────────────────────────────────

  /**
   * Creates a new session for the given exercise type and configuration.
   * Any previously active session is replaced (SRS §3.4.7 – one active session
   * at a time).
   */
  createSession(
    exerciseType: ExerciseType,
    config: ExerciseConfig
  ): ExerciseSession {
    this.abandonActiveSession();

    const id = makeSessionId();
    const questions = generateQuestions(exerciseType, config);

    const session: ExerciseSession = {
      id,
      exerciseType,
      config,
      status: "active",
      questions,
      answers: questions.map(() => []),
      evaluations: questions.map(() => []),
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
    };

    this.sessions.set(id, session);
    this.activeSessionId = id;
    return session;
  }

  // ── GET /api/sessions/:sessionId ──────────────────────────────────────────

  /** Returns the session with the given id, or null if not found. */
  getSession(sessionId: string): ExerciseSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  /** Returns the currently active session, or null if there is none. */
  getActiveSession(): ExerciseSession | null {
    if (this.activeSessionId === null) return null;
    const session = this.sessions.get(this.activeSessionId) ?? null;
    if (!session || session.status !== "active") {
      return null;
    }
    return session;
  }

  // ── POST /api/sessions/:sessionId/answer ──────────────────────────────────

  /**
   * Submits an answer for the current question in the session.
   *
   * Returns the evaluation result and the updated session.
   * If the answer is correct and there are more questions, advances the index.
   * If the answer is correct on the final question, the session auto-completes
   * (unless it is endless mode, in which case the user must finish explicitly).
   */
  submitAnswer(
    sessionId: string,
    answer: UserAnswer
  ): { evaluation: AnswerEvaluation; session: ExerciseSession } {
    const session = this.requireActiveSession(sessionId);

    if (session.status !== "active") {
      throw new Error(`Session ${sessionId} is not active (status: ${session.status})`);
    }

    const qi = session.currentQuestionIndex;
    if (qi >= session.questions.length) {
      throw new Error(`Session ${sessionId} has no more questions`);
    }

    const question = session.questions[qi];
    const isFirstAttempt = session.evaluations[qi].length === 0;
    const evaluation = evaluateAnswer(question, answer, isFirstAttempt);

    session.answers[qi].push(answer);
    session.evaluations[qi].push(evaluation);

    if (evaluation.isCorrect) {
      const isLastQuestion = qi === session.questions.length - 1;
      const isEndless = session.config.questionCount === 0;

      if (isLastQuestion) {
        if (isEndless) {
          this.appendEndlessBatch(session);
          session.currentQuestionIndex = qi + 1;
        } else {
          // Auto-complete on exhausting a finite question set
          this.buildSummaryInPlace(session);
        }
      } else {
        session.currentQuestionIndex = qi + 1;
      }
    }

    return { evaluation, session };
  }

  // ── POST /api/sessions/:sessionId/finish ──────────────────────────────────

  /**
   * Finalises the session and returns the summary.
   *
   * May be called at any time for endless mode, or when the user wants to stop
   * a finite session early.
   */
  finishSession(
    sessionId: string
  ): { summary: SessionSummary; session: ExerciseSession } {
    const session = this.requireActiveSession(sessionId);

    if (session.status === "completed") {
      return { summary: session.summary!, session };
    }

    this.buildSummaryInPlace(session);
    return { summary: session.summary!, session };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private requireActiveSession(sessionId: string): ExerciseSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    if (sessionId !== this.activeSessionId || session.status !== "active") {
      throw new Error(`Session ${sessionId} is not the active session`);
    }
    return session;
  }

  private abandonActiveSession(): void {
    if (this.activeSessionId === null) return;

    const activeSession = this.sessions.get(this.activeSessionId);
    if (!activeSession || activeSession.status !== "active") {
      this.activeSessionId = null;
      return;
    }

    activeSession.status = "abandoned";
    activeSession.endedAt = new Date().toISOString();
    this.activeSessionId = null;
  }

  private appendEndlessBatch(session: ExerciseSession): void {
    const nextQuestions = generateQuestions(session.exerciseType, {
      ...session.config,
      questionCount: ENDLESS_BATCH_SIZE,
    });

    session.questions.push(...nextQuestions);
    session.answers.push(...nextQuestions.map(() => []));
    session.evaluations.push(...nextQuestions.map(() => []));
  }

  private buildSummaryInPlace(session: ExerciseSession): void {
    const endedAt = new Date().toISOString();
    const totalTimeMs =
      new Date(endedAt).getTime() - new Date(session.startedAt).getTime();

    // A question is "completed" when it has at least one correct evaluation.
    const completedCount = session.evaluations.filter((evals) =>
      evals.some((e) => e.isCorrect)
    ).length;

    let firstAttemptCorrect = 0;
    let totalAttempts = 0;
    const byKey: Record<string, { total: number; firstAttemptCorrect: number }> =
      {};
    const byDirection: Record<
      "above" | "below",
      { total: number; firstAttemptCorrect: number }
    > = { above: { total: 0, firstAttemptCorrect: 0 }, below: { total: 0, firstAttemptCorrect: 0 } };

    for (let i = 0; i < session.questions.length; i++) {
      const evals = session.evaluations[i];
      if (evals.length === 0) continue; // unanswered question

      const question = session.questions[i];
      totalAttempts += evals.length;

      const firstWasCorrect = evals[0].isCorrect;
      if (firstWasCorrect) firstAttemptCorrect++;

      // By key
      const k = question.key;
      if (!byKey[k]) byKey[k] = { total: 0, firstAttemptCorrect: 0 };
      byKey[k].total++;
      if (firstWasCorrect) byKey[k].firstAttemptCorrect++;

      // By direction
      const dir = question.direction;
      byDirection[dir].total++;
      if (firstWasCorrect) byDirection[dir].firstAttemptCorrect++;
    }

    const accuracy =
      completedCount > 0
        ? Math.round((firstAttemptCorrect / completedCount) * 100)
        : 0;

    const summary: SessionSummary = {
      totalQuestions: completedCount,
      firstAttemptCorrect,
      accuracy,
      totalAttempts,
      totalTimeMs,
      byKey,
      byDirection,
    };

    session.status = "completed";
    session.endedAt = endedAt;
    session.summary = summary;
    if (this.activeSessionId === session.id) {
      this.activeSessionId = null;
    }
  }
}

/** Shared singleton instance for use across the application. */
export const sessionEngine = new SessionEngine();
