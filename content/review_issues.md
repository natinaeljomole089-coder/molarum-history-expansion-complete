# Molarum Content Review Issues

## Current package status

Molarum now bundles a **920-question source-grounded bank** from owner-connected Google Drive materials. It contains six units each for Chemistry, Physics, and Biology, plus one validated Unit 1 for Mathematics, Geography, Citizenship, Economics, and Health & PE. Every completed unit passed Molarum’s structural validator: 40 questions per unit with 20 multiple choice, 4 true/false, 8 short answer, 8 numerical, and the required 14 easy, 18 medium, and 8 hard labels.

The original Drive bank had two blank answers in Physics Unit 3. Both were repaired from the owner-provided Grade 10 Physics textbook before the bank was bundled. The five new unit sources and Drive file IDs are recorded in `content/pending_subject_source_catalog.json`.

| Subject | Bundled units | Questions | Current status |
|---|---:|---:|---|
| Chemistry | 6 | 240 | Structurally validated; teacher review required. |
| Physics | 6 | 240 | Structurally validated; two source-verified answer repairs; teacher review required. |
| Biology | 6 | 240 | Structurally validated; teacher review required. |
| Mathematics | 1 | 40 | Structurally validated; teacher review required. |
| Geography | 1 | 40 | Structurally validated; teacher review required. |
| Citizenship | 1 | 40 | Structurally validated; teacher review required. |
| Economics | 1 | 40 | Structurally validated; teacher review required. |
| Health & PE | 1 | 40 | Structurally validated; teacher review required. |
| History | 0 | 0 | `unresolved_after_retries_or_capacity`: no owner-approved Grade 10 History source found in Drive. |

Every bundled item retains `reviewStatus: "ai_draft"`; the app must continue displaying **Teacher review recommended**. Structural validation verifies schema, source-note presence, answer presence, type and difficulty distributions, and duplicate prevention. It does **not** substitute for subject-teacher review of individual wording, numerical solutions, or local curriculum alignment.
