# Source-Governance Coverage Record

## Current package status

Molarum now bundles a **1,720-question source-grounded bank** from owner-connected Google Drive materials. It contains six units each for Chemistry, Physics, and Biology; all seven Mathematics units; all eight Geography units; all eight Citizenship units; and Unit 1 for Economics and Health & PE. Each completed unit passed Molarum’s structural validator: 40 questions per unit with 20 multiple choice, 4 true/false, 8 short answer, 8 numerical, and the required 14 easy, 18 medium, and 8 hard labels.

Geography Unit 3 and Citizenship Unit 6 were regenerated from their approved local textbook boundaries after earlier drafts failed the fixed distribution. Table-dependent draft items were replaced with narrative-text items before acceptance. The accepted units passed source-boundary review, numerical checks, exact duplicate screening, high-lexical-similarity screening, and canonical validation. Their source paths, checksums, batch reports, and next continuation point are recorded in the external delivery package at `/home/ubuntu/grade10_question_bank_delivery/`.

| Subject | Bundled units | Questions | Current status |
|---|---:|---:|---|
| Chemistry | 6 | 240 | Structurally validated. |
| Physics | 6 | 240 | Structurally validated; two source-verified answer repairs were retained. |
| Biology | 6 | 240 | Structurally validated. |
| Mathematics | 7 | 280 | Structurally validated. |
| Geography | 8 | 320 | Structurally validated; Unit 3 added in continuation batch 1. |
| Citizenship | 8 | 320 | Structurally validated; Unit 6 added in continuation batch 1. |
| Economics | 1 | 40 | Structurally validated; Unit 2 is the documented next source-bounded batch. |
| Health & PE | 1 | 40 | Structurally validated; Units 2–8 remain queued after documented source-only retry limits. |
| History | 0 | 0 | `unresolved_after_retries_or_capacity`: no owner-approved Grade 10 History source was found in Drive. |

The persisted `reviewStatus: "ai_draft"` field remains only for fixed-schema compatibility and import validation. Molarum no longer presents a teacher-review screen, review-state publishing workflow, or learner-facing teacher-review label. Structural validation confirms schema, source-note presence, answer presence, type and difficulty distributions, and duplicate prevention; it does not prove every item’s pedagogical suitability beyond the documented source boundary.
