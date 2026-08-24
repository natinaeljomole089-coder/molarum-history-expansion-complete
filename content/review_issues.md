# Source-Governance Coverage Record

## Current package status

Molarum now bundles a **1,920-question source-grounded bank across 48 complete units** from owner-approved materials. It contains six units each for Chemistry, Physics, and Biology; all seven Mathematics units; all eight Geography units; all eight Citizenship units; Units 1–3 for Economics; Unit 1 for Health & PE; and Units 1–3 for History. Each completed unit passed Molarum’s structural validator: 40 questions per unit with 20 multiple choice, 4 true/false, 8 short answer, 8 numerical, and the required 14 easy, 18 medium, and 8 hard labels.

Geography Unit 3 and Citizenship Unit 6 were regenerated from their approved local textbook boundaries after earlier drafts failed the fixed distribution. Table-dependent draft items were replaced with narrative-text items before acceptance. The accepted units passed source-boundary review, numerical checks, exact duplicate screening, high-lexical-similarity screening, and canonical validation. Their source paths, checksums, batch reports, and next continuation point are recorded in the external delivery package at `/home/ubuntu/grade10_question_bank_delivery/`.

| Subject | Bundled units | Questions | Current status |
|---|---:|---:|---|
| Chemistry | 6 | 240 | Structurally validated. |
| Physics | 6 | 240 | Structurally validated; two source-verified answer repairs were retained. |
| Biology | 6 | 240 | Structurally validated. |
| Mathematics | 7 | 280 | Structurally validated. |
| Geography | 8 | 320 | Structurally validated; Unit 3 added in continuation batch 1. |
| Citizenship | 8 | 320 | Structurally validated; Unit 6 added in continuation batch 1. |
| Economics | 3 | 120 | Structurally validated; Units 2 and 3 were added from approved local text boundaries at lines 1396–3186 and 3187–4320. |
| Health & PE | 1 | 40 | Structurally validated; Units 2–8 remain queued after documented source-only retry limits. |
| History | 3 | 120 | Structurally validated; Units 1–3 were added from the owner-approved textbook. Units 4–6 remain source-bounded continuation work. |

The Economics Units 2 and 3 batches were manually authored from explicit source definitions, schedules, equations, and worked values. History Unit 1 was authored from explicit definitions, events, named actors, relationships, and dates from its owner-approved source boundary. Each accepted continuation passed canonical validation and duplicate screening before merge. Preserved baseline archives, source copies, checksums, delivery units, and merged delivery banks are recorded in the private external delivery package.

History Units 4–6, Economics Units 4–8, and Health & PE Units 2–8 remain unresolved until a specific owner-approved text boundary is prepared and a complete source-bounded batch passes validation for each unit.

The persisted `reviewStatus: "ai_draft"` field remains only for fixed-schema compatibility and import validation. Molarum no longer presents a teacher-review screen, review-state publishing workflow, or learner-facing teacher-review label. Structural validation confirms schema, source-note presence, answer presence, type and difficulty distributions, and duplicate prevention; it does not prove every item’s pedagogical suitability beyond the documented source boundary.
