# Functional Requirements Document (FRD)

## 2.1 Document Purpose
This document defines the functional behavior of the Harmony Singing Trainer. It describes what the system must do from the user and business perspective, including workflows, modules, rules, and expected outputs.

## 2.2 Functional Overview
The system shall support three primary training areas:
- Understanding note relationships for harmony singing.
- Hearing and identifying a third above or below.
- Singing the correct harmony note or phrase in response to a melody.

## 2.3 User Journey and Workflow
Home page -> select an exercise -> configure settings or choose a preset -> start a training session -> receive per-question feedback -> review session summary.

## 2.3.1 Iteration Assumptions and Resolved Decisions
The following decisions are fixed for this implementation round so the team can proceed without additional product clarification:
- The system shall support a browser-first experience and does not require authentication.
- A session may be implemented entirely on the client for the MVP, as long as the API contract and module boundaries remain clear enough to support a future backend.
- If microphone permission is denied, microphone-based exercises shall not start and the user shall receive a clear actionable message.
- Endless mode shall be ended explicitly by the user through a finish action rather than by an automatic question limit.
- Replay actions shall not count as answer attempts and shall not affect scoring.
- The primary target platform for this round is modern desktop browsers; mobile support is desirable but not required for acceptance.

## 2.4 Functional Modules
### 2.4.1 Lesson Module
The system shall provide a lesson page that explains:
- What a third above is.
- What a third below is.
- Examples in a simple major key context such as C major.
- A note relationship table showing the melody note and its corresponding harmony note.

Functional requirements:
- The lesson page shall present beginner-friendly explanatory content.
- The page should include note examples and supporting visuals where appropriate.
- The page may include play buttons for listening to examples.

### 2.4.2 Exercise Catalog Module
The system shall provide a page listing available exercises.

Functional requirements:
- The exercise catalog shall display the title and short description of each exercise.
- The catalog shall indicate the expected input type, such as note selection or microphone input.
- The user shall be able to open an exercise from the catalog.

### 2.4.3 Exercise Settings Module
Before starting an exercise, the user shall be able to configure training parameters.

Functional requirements:
- The user shall be able to choose third above, third below, or mixed mode.
- The user shall be able to choose allowed keys.
- The user shall be able to choose the number of questions.
- The user shall be able to configure melody length where applicable.
- The user shall be able to enable or disable tonic playback before each question.
- The user shall be able to set a tempo value in BPM.
- The user shall be able to start from a predefined preset.

Business rules:
- A questionCount value of 0 shall represent endless mode.
- For single-note exercises, melodyLength shall equal 1.
- Exercises that require voice input shall request microphone permission before the session begins.

### 2.4.4 Match the Third Exercise
The user listens to a melody note and selects the correct third above or below.

Functional requirements:
- The system shall play a melody note.
- The system shall display 3 to 4 answer choices.
- The user shall select one answer.
- The system shall immediately indicate whether the answer is correct.
- If the answer is incorrect, the user shall be required to try again until the correct answer is given.
- The score shall count only the first attempt.
- The user shall be able to replay the sound without limit.
- The user shall advance only after answering correctly.

### 2.4.5 Sing the Third Exercise
The user listens to a melody note and sings the target harmony through a microphone.

Functional requirements:
- The system shall play a melody note.
- The system shall receive microphone input.
- The system shall perform basic pitch detection.
- The system shall compare the detected pitch against the target note.
- The system shall return feedback such as correct, slightly high, slightly low, wrong note, same as melody, or no input.
- If the answer is incorrect, the user shall be allowed to try again.
- The user shall advance only after singing the correct target.

Business rules:
- The system shall evaluate pitch using a configurable tolerance.
- If the detected pitch matches the melody note instead of the harmony target, the feedback shall indicate that the user returned to the melody.
- If the input confidence is too low, the system shall report no reliable input.

### 2.4.6 Phrase Harmony Exercise
The user listens to a short melody phrase and sings a harmony line across the phrase.

Functional requirements:
- The system shall play a melody phrase consisting of 3 to 5 notes in the initial version.
- The system shall receive and evaluate user vocal input.
- The system shall provide feedback after the attempt.
- The user shall be able to replay the phrase.
- The user shall be able to retry until the attempt is accepted.

Business rules:
- The initial version shall use simple rhythm patterns.
- The initial version should limit large melody jumps to keep difficulty manageable.

### 2.4.7 Session Management Module
The system shall manage training activity as sessions.

Functional requirements:
- The user shall be able to start a new session.
- The system shall generate and store the questions for that session.
- The system shall store user answers and per-question evaluations.
- The system shall track the current question index.
- The system shall support session completion.
- The system shall produce a summary at the end of the session.

### 2.4.8 Summary and Results Module
The system shall provide an end-of-session summary.

Functional requirements:
- The summary shall show the total number of questions.
- The summary shall show the number of first-attempt correct answers.
- The summary shall show accuracy percentage.
- The summary shall show total attempts.
- The summary shall show total session time.
- The summary should support breakdowns by key.
- The summary should support breakdowns by harmony direction.

## 2.5 Cross-Module Interaction Rules
The following rules apply across the system and are part of the accepted behavior for this round:
- The user shall work on one active session at a time in the interface.
- The user shall be able to leave and return to an in-progress session during normal browser use without easily losing progress.
- The system shall clearly distinguish informational playback actions from answer submission actions.
- For note-selection exercises, the system shall keep the current question active until the correct choice is submitted.
- For microphone-based exercises, the system shall allow repeated attempts until the answer is accepted according to the evaluation rules.
- If audio playback, microphone access, or pitch detection is unavailable, the system shall present a clear error state rather than fail silently.
- The summary shall use first-attempt correctness as the primary accuracy metric even when the user needed multiple tries to complete a question.

## 2.6 Acceptance Criteria for This Iteration
- Lesson content can be opened and includes an explanation of third above and third below with at least one simple note relationship example.
- The exercise catalog lists all in-scope exercises with title, short description, and expected input type.
- The settings flow supports direction, allowed keys, question count, and the other applicable options defined in this document.
- Match the Third can be completed end-to-end with playback, retry-until-correct behavior, and first-attempt scoring.
- Sing the Third can be completed end-to-end with microphone permission handling and pitch-based feedback categories.
- Phrase Harmony can be completed end-to-end using short phrases in the initial difficulty range.
- Session completion always produces a summary containing total questions, first-attempt correct count, accuracy, total attempts, and total session time.
