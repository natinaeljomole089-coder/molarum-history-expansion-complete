# Source Governance

Molarum’s app now includes a source-grounded question bank obtained from the owner-connected Google Drive. The bundled file is `assets/question-banks/grade10-source-grounded-bank.json`; its metadata identifies the `owner-drive-grade10-textbooks-2026-08-22-full-expanded` catalog version. It provides six units each for Chemistry, Physics, and Biology; seven units for Mathematics; seven accepted units each for Geography and Citizenship; and Unit 1 for Economics and Health & PE, with 1,640 questions in total. Source IDs, accepted-unit provenance, and every unresolved unit are recorded in `content/pending_subject_source_catalog.json`; History remains unresolved because no approved source book was found.

The standalone validator rejects missing required fields, duplicate IDs and wording, missing answer keys, invalid answer-option relationships, incorrect type or difficulty distributions, empty source notes, and review statuses other than `ai_draft`. For the command-line validation flow, run:

```bash
pnpm validate:bank /path/to/complete_question_bank.json
```

The same rules execute before an Android user can activate an imported JSON bank. On failure, the current bank is kept intact and the app displays the rejection report. Local teachers may overlay Draft, Approved, or Hidden review states, but those do not transform the original provenance or remove the “Teacher review recommended” label. Every bundled question remains `ai_draft`; structural validation does not substitute for teacher review.
