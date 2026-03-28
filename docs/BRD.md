# Business Requirements Document (BRD)

## 1.1 Document Purpose
This document defines the business context, rationale, objectives, scope, and success criteria for the Harmony Singing Trainer web application. The product is intended to help beginner users practice basic harmony singing independently through a structured web-based training experience focused on singing a third above and a third below a melody.

## 1.2 Business Background
Many aspiring singers and music learners want to sing harmony but do not know how to begin. Existing music learning tools often focus on general ear training, music theory, or instrumental training rather than practical harmony singing. Beginner learners also often lack access to a teacher, ensemble, or structured self-practice workflow.

The proposed product addresses this gap by providing an accessible web application that teaches and trains users to recognize, understand, and sing simple harmony lines. The initial scope focuses on the most approachable starting point for beginner harmony practice: third above and third below within a major key context.

## 1.3 Business Problem Statement
- Beginner users do not know how to start learning harmony singing.
- Harmony practice usually depends on a teacher, choir setting, or another singer.
- Most available tools do not directly focus on practical sing-along harmony training.
- Users may be able to identify notes intellectually, but not sing the target harmony accurately.

## 1.4 Business Goals and Objectives
The system shall support the following business objectives:
- Enable beginners to understand the concept of singing a third above and a third below.
- Allow users to practice harmony step by step without requiring a live instructor.
- Provide immediate feedback so users can improve through repetition.
- Establish a scalable foundation for future harmony and vocal training modules.

## 1.5 Product Vision
Create a clean, beginner-friendly, web-based harmony singing trainer that combines listening, recognition, and vocal response practice in a structured progression. The first release should make harmony singing approachable, measurable, and repeatable for self-learners.

## 1.6 Target Users
Primary users:
- Beginner singers who want to learn harmony.
- Casual singers who can sing melodies but cannot yet sing supporting vocal lines.
- Independent music learners seeking self-paced practice tools.

Secondary users:
- Vocal instructors who may use the product as a teaching aid.
- Music students seeking additional guided practice.

## 1.7 Scope
In scope for the initial release:
- Introductory lesson content explaining third above and third below.
- Listening and note-selection exercise for identifying the target harmony.
- Voice-based exercise for singing the target harmony note.
- Short phrase harmony exercise for singing a harmony line across a melody fragment.
- Immediate per-question feedback.
- End-of-session summary reporting.

Out of scope for the initial release:
- Advanced harmony types beyond thirds.
- Full long-term learner profile and historical analytics.
- Social, collaboration, or teacher-student management features.
- Minor keys, modulation, and advanced harmonic contexts.
- Multi-part harmony arrangements such as full SATB training.

## 1.7.1 Iteration Delivery Boundary
For this implementation round, the following scope decisions are fixed:
- The iteration shall deliver a usable MVP covering lesson content, exercise catalog, configurable session start, per-question feedback, and end-of-session summary.
- The iteration shall support the three exercise types already defined in scope: Match the Third, Sing the Third, and Phrase Harmony.
- The iteration shall focus on major-key training for third above and third below only.
- The iteration may use local in-browser storage for session continuity and does not require user accounts.
- The iteration does not require cloud sync, multi-device progress sharing, or teacher-facing management features.
- Any implementation detail not explicitly specified in later documents shall be chosen in favor of the simplest approach that preserves extensibility and beginner usability.

## 1.7.2 Must-Have Outcomes for This Round
The round shall be considered complete only when all of the following are true:
- A new user can open the app, understand the available exercises, and start a session without external instruction.
- The user can complete at least one full session in each in-scope exercise type.
- The system provides immediate correctness feedback for note-selection and vocal exercises.
- The system records first-attempt correctness and can present a summary at the end of the session.
- The product remains fully browser-based for this round.

## 1.8 Success Metrics
The initial product release will be considered successful if:
- New users can begin practicing without extensive explanation.
- Users can complete at least one full training session without confusion.
- Users can distinguish between third above and third below in guided exercises.
- The system provides clear and immediate feedback after each attempt.
- First-attempt accuracy can be measured reliably.

## 1.9 Business Risks
- Browser-based pitch detection accuracy may vary by device and microphone quality.
- If the user experience is too complex, beginner users may abandon the product.
- If exercise difficulty escalates too quickly, practice retention may decrease.
- Browser audio latency may negatively affect the training experience.

## 1.10 Assumptions and Constraints
Assumptions:
- Users will have access to speakers or headphones.
- Some users will also have access to a microphone.
- The first release will be delivered as a browser-based web application.
- Users are willing to practice in short, repeatable sessions.

Constraints:
- The product will be developed in a lean MVP format.
- The first version should prioritize speed of delivery and core learning value.
- The system should start with simple music logic and remain extensible.
