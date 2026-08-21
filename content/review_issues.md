# Molarum Content Review Issues

## Current package status

Molarum now bundles a **720-question source-grounded bank** retrieved from the owner-connected Google Drive. The bank contains six units each for Chemistry, Physics, and Biology. Its structure was validated locally on 2026-08-21: every completed unit has 40 questions with the required 20 multiple-choice, 4 true/false, 8 short-answer, and 8 numerical distribution; each also has the required 14 easy, 18 medium, and 8 hard distribution.

The original Drive bank had two blank answers in Physics Unit 3. Both were repaired using the owner-provided Grade 10 Physics textbook: the first-condition-of-equilibrium answer now uses the book-on-a-table example, and the strain answer now follows the textbook’s definition. The bank then passed the strict local validator without errors.

| Subject | Bundled units | Questions | Current status |
|---|---:|---:|---|
| Chemistry | 6 | 240 | Structurally validated; teacher review required. |
| Physics | 6 | 240 | Structurally validated; two source-verified answer repairs; teacher review required. |
| Biology | 6 | 240 | Structurally validated; teacher review required. |
| Mathematics | 0 | 0 | `unresolved_after_retries_or_capacity` |
| Geography | 0 | 0 | `unresolved_after_retries_or_capacity` |
| Citizenship | 0 | 0 | `unresolved_after_retries_or_capacity` |
| Economics | 0 | 0 | `unresolved_after_retries_or_capacity` |
| Health & PE | 0 | 0 | `unresolved_after_retries_or_capacity` |

Every bundled item retains `reviewStatus: "ai_draft"`; the app must continue displaying **Teacher review recommended**. Structural validation verifies the schema, source notes, answer presence, question distributions, and duplicate prevention. It does **not** replace subject-teacher review of every question, especially numerical solutions and local curriculum alignment.
