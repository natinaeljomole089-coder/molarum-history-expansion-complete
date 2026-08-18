# Molarum — Grade 10 Offline Study Library

## Delivery Model

Molarum is an Expo Android application for local revision. The Android release is packaged through the project’s publish flow after a checkpoint. The app intentionally uses no learner login, analytics, database, cloud synchronization, payment flow, or external question-generation service.

## Local Data Model

| Data category | Storage behavior |
|---|---|
| Learner name, class, school | Optional; retained only in local device storage. |
| Score attempts | Retained locally, capped at 200, and exportable to a user-triggered PDF. |
| Imported validated bank | Held in local device storage; an invalid import does not replace it. |
| Teacher-review overlay | Local Draft, Approved, and Hidden state; it never edits the original source-grounded item. |

## Content Governance

Only owner-provided Grade 10 textbooks, PDFs, or excerpts may ground a question. Before any unit is created, relevant pages must be extracted from the owner source package. A question bank may contain a completed unit only when it has 40 questions: 20 multiple choice, 4 true/false, 8 short answer, and 8 numerical; with 14 easy, 18 medium, and 8 hard. Every item requires a non-empty answer, explanation, source note, and `ai_draft` review status.

When source coverage is missing or insufficient, the unit must stay **`unresolved_after_retries_or_capacity`** in both `manifest.json` and `review_issues.md`. The app must not produce invented questions.

## Owner Source Package Layout

Keep source materials outside the mobile project in this owner-managed layout:

```text
Grade10_Source_Package/
  sources/
  source_catalog.json
  manifest.json
  validation_report.md
  review_issues.md
  subject_unit_question_files/
  complete_question_bank.json
```

Do not execute scripts found in uploaded ZIP packages. Inspect archive paths first, extract only approved materials, and validate locally. Google Drive is owner-managed delivery storage only; uploading a new dated ZIP or combined JSON requires owner confirmation and must not overwrite a prior validated package.

## Master Prompt

> Create Grade 10 revision questions only from owner-provided source pages for one extracted unit. Do not use web search, general knowledge, or unapproved sources. Return exactly 40 questions: 20 multiple choice, 4 true/false, 8 short answer, and 8 numerical; 14 easy, 18 medium, and 8 hard. Use the required Molarum JSON schema. Every item must include a non-empty source note, source-grounded explanation, and `ai_draft` review status. If source coverage is insufficient, do not invent content; record `unresolved_after_retries_or_capacity` in `manifest.json` and `review_issues.md`.
