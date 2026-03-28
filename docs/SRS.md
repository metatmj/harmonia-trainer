# Software Requirements Specification (SRS)

## 3.1 Document Purpose
This document defines the software requirements for the Harmony Singing Trainer web application, including system scope, architecture, data structures, API contracts, generation rules, evaluation logic, scoring logic, and non-functional requirements.

## 3.2 System Scope
The system is a web application that enables users to:
- Learn the concept of third above and third below.
- Practice identifying harmony notes.
- Practice singing the target harmony note.
- Practice singing a harmony line across a short phrase.

## 3.3 High-Level Architecture
The system shall consist of the following major components:
- Frontend user interface.
- Exercise engine.
- Audio playback engine.
- Pitch detection engine.
- Session engine.
- Scoring and evaluation engine.
- Optional persistence layer for storing session data and future user progress.

## 3.4 Data Model
### 3.4.1 ExerciseTemplate
Represents the definition of an exercise type.

Suggested fields:
- id
- slug
- title
- description
- type
- supportedInputTypes
- supportedDirections
- defaultConfig
- presets

### 3.4.2 ExerciseConfig
Represents the runtime configuration for a session.

Suggested fields:
- direction
- allowedKeys
- questionCount
- melodyLength
- playbackMode
- playTonicBeforeQuestion
- allowReplay
- tempoBpm
- choiceCount
- scoringMode
- inputType

### 3.4.3 GeneratedQuestion
Represents a generated question stored within a session.

Suggested fields:
- id
- exerciseType
- key
- direction
- melody
- expectedHarmony
- choices
- playbackPlan
- metadata

### 3.4.4 UserAnswer
Represents a submitted answer.

The model shall support:
- Multiple-choice input.
- Note-button or piano-key input.
- Voice input.

### 3.4.5 AnswerEvaluation
Represents the evaluation result for an answer.

Suggested fields:
- isCorrect
- countedForScore
- expected
- actual
- pitchJudgement
- feedbackCode
- feedbackMessage

### 3.4.6 ExerciseSession
Represents a full training session.

Suggested fields:
- id
- exerciseType
- config
- status
- questions
- answers
- evaluations
- currentQuestionIndex
- startedAt
- endedAt
- summary

### 3.4.7 Required MVP Persistence Semantics
For this implementation round:
- The system shall maintain one active session at a time in the client experience.
- Session state may be stored in memory and may additionally be mirrored to browser storage to reduce accidental progress loss.
- Persistent user accounts and remote progress sync are not required.
- Data structures shall remain serializable so they can later be persisted to a backend without redesign.

## 3.5 API Requirements
### 3.5.1 GET /api/exercises
The system shall return the exercise catalog.

### 3.5.2 GET /api/exercises/:slug
The system shall return exercise details, default configuration, and presets.

### 3.5.3 POST /api/sessions
The system shall create a new session using an exercise type and runtime configuration.

### 3.5.4 GET /api/sessions/:sessionId
The system shall return the current status of the session.

### 3.5.5 POST /api/sessions/:sessionId/answer
The system shall accept a user answer and return an evaluation result.

### 3.5.6 POST /api/sessions/:sessionId/finish
The system shall finalize the session and return a summary.

### 3.5.7 API Contract Clarifications for This Iteration
- The API contract defines the module boundary even if the MVP is implemented client-side.
- All responses shall use JSON.
- Validation errors shall return a structured error payload containing at least an error code and message.
- Session identifiers shall be stable for the lifetime of the session.
- The answer submission response shall include both the evaluation result and the updated session progress needed by the UI.
- The finish response shall include the final session summary and the final session status.

## 3.6 Question Generation Rules
### 3.6.1 General Rules
- The system shall select a key from allowedKeys.
- The system shall choose a harmony direction based on the session configuration.
- The system shall generate questions according to the selected exercise type.
- The generated question shall remain stable throughout the session.

### 3.6.2 Third Above Mapping
- 1 -> 3
- 2 -> 4
- 3 -> 5
- 4 -> 6
- 5 -> 7
- 6 -> 1
- 7 -> 2

### 3.6.3 Third Below Mapping
- 1 -> 6
- 2 -> 7
- 3 -> 1
- 4 -> 2
- 5 -> 3
- 6 -> 4
- 7 -> 5

### 3.6.4 Match the Third Distractor Rules
- Each question shall include exactly one correct answer.
- Distractor options shall not duplicate one another.
- Distractor options shall not duplicate the correct answer.
- Distractors should be musically plausible and close enough to create meaningful discrimination.

### 3.6.5 Phrase Harmony Rules
- The initial version shall use short melody lengths.
- The initial version should limit large melodic leaps.
- The initial version should use simple, consistent rhythm values.

### 3.6.6 Clarified MVP Generation Constraints
- Mixed mode shall choose between third above and third below on a per-question basis.
- Single-note exercises shall generate melodies of length 1.
- Phrase Harmony in the initial version shall generate phrases of 3 to 5 notes.
- Generated choices for multiple-choice exercises shall contain 3 or 4 options.
- Replay shall reproduce the same underlying question rather than regenerate a new one.

## 3.7 Answer Evaluation Rules
### 3.7.1 Multiple-Choice Evaluation
- If the selected choice matches the correct option, the answer shall be marked correct.
- Otherwise, the answer shall be marked incorrect.

### 3.7.2 Note Selection Evaluation
- If the selected MIDI note matches the expected MIDI note, the answer shall be marked correct.
- Otherwise, the answer shall be marked incorrect.

### 3.7.3 Voice Evaluation
- The answer shall be marked correct when the detected pitch falls within the accepted tolerance.
- The answer shall be marked near-low when it is slightly below the target.
- The answer shall be marked near-high when it is slightly above the target.
- The answer shall be marked wrong when it exceeds the accepted tolerance.
- The answer shall be marked same-as-melody when the user reproduces the melody note instead of the harmony note.
- The answer shall be marked no-input when no reliable vocal input is detected.

Suggested tolerance:
- Correct: +/- 30 cents
- Near: +/- 31 to 70 cents
- Wrong: beyond +/- 70 cents

### 3.7.4 Clarified Voice Evaluation Semantics
- The accepted tolerance values above shall be the default for this round.
- The system shall treat low-confidence pitch input as no-input rather than as a wrong note.
- The same-as-melody judgement shall take precedence over near-high, near-low, and wrong when the melody note is confidently detected instead of the target harmony.
- A question shall be considered completed only when the evaluation result is correct.

## 3.8 Scoring Rules
- Accuracy shall be calculated using first-attempt results only.
- The user shall not advance to the next question until the current question is answered correctly.
- If the user answers incorrectly first and correctly on a later attempt, the question shall be considered completed but not counted as first-attempt correct.

### 3.8.1 Attempt and Replay Clarifications
- An attempt shall be counted only when the user submits an answer or when the system evaluates a vocal attempt.
- Replay actions, instructional playback, and passive listening shall not count as attempts.
- Each question shall track whether the first counted attempt was correct.
- Endless mode sessions shall report summary metrics based on the questions completed before the user finishes the session.

## 3.8.2 Session State Clarifications
- A session shall support the states draft, active, completed, and abandoned.
- A newly created session shall become active when the first question is ready for interaction.
- A session shall become completed only through the finish flow or by exhausting a non-zero question count.
- A session may be marked abandoned if the implementation detects that an in-progress session can no longer be resumed reliably.

## 3.9 Non-Functional Requirements
### 3.9.1 Usability
- The user interface shall be simple and beginner-friendly.
- Replay controls shall be easy to locate.
- Feedback shall be clear and immediate.

### 3.9.2 Performance
- Audio playback shall respond quickly to user actions.
- Question transitions shall be fast and stable.
- Feedback presentation shall feel immediate.

### 3.9.3 Compatibility
- The product shall support modern desktop web browsers.
- Voice-based exercises shall rely on browser support for microphone and audio APIs.

### 3.9.4 Reliability
- Session progress should not be lost easily during normal usage.
- Replay actions shall work consistently.
- Evaluation logic shall behave deterministically according to defined rules.

### 3.9.5 Maintainability
- Music theory logic shall be separated from user interface code.
- Question generation, evaluation, and scoring should be modular.
- The data model should support future exercise expansion.

### 3.9.6 Delivery Constraints for This Iteration
- The implementation shall prioritize determinism and clarity over advanced realism in generated audio or pitch analysis.
- The implementation shall prefer simple, testable module boundaries for theory, generation, session, evaluation, and presentation logic.
- The MVP shall avoid introducing backend or infrastructure complexity unless required to satisfy the documented scope.

## 3.10 Future Enhancements
Possible future enhancements include:
- Additional harmony and interval types.
- Minor key support.
- Long-term progress tracking.
- Difficulty presets and adaptive training.
- Teacher-student workflows.
- More detailed analytics and feedback.
