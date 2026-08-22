# Source Governance

Molarum’s app includes a source-grounded question bank obtained from the owner-connected Google Drive. The bundled file is `assets/question-banks/grade10-source-grounded-bank.json`; its metadata identifies the `owner-drive-grade10-textbooks-2026-08-22-full-expanded-continuation-1` catalog version. It provides six units each for Chemistry, Physics, and Biology; seven units for Mathematics; all eight units each for Geography and Citizenship; and Unit 1 for Economics and Health & PE, with 1,720 questions in total. Source IDs, accepted-unit provenance, unresolved coverage, and the next Economics Unit 2 continuation point are recorded in `content/pending_subject_source_catalog.json`. The external package at `/home/ubuntu/grade10_question_bank_delivery/` preserves source copies, checksums, validation reports, accepted units, the pre-merge baseline, and the merged delivery bank. History remains unresolved because no approved source book was found.

The standalone validator rejects missing required fields, duplicate IDs and wording, missing answer keys, invalid answer-option relationships, incorrect type or difficulty distributions, empty source notes, and review statuses other than `ai_draft`. For the command-line validation flow, run:

```bash
pnpm validate:bank /path/to/complete_question_bank.json
```

The same rules execute before an Android user can activate an imported JSON bank. On failure, the current bank is kept intact and the app displays the rejection report. Every bundled question retains `ai_draft` only for fixed-schema compatibility. The app no longer exposes a teacher-review screen, review-state publishing workflow, or learner-facing review label; structural validation still does not prove pedagogical suitability beyond the documented source boundary.
