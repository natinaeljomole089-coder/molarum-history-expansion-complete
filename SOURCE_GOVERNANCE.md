# Source Governance

Use `docs/CURRENT_STATE.md` and `content/manifest.json` for current catalog facts. Molarum’s protected bundled bank is `assets/question-banks/grade10-source-grounded-bank.json`. The current catalog is structurally validated, contains 1,840 questions across 46 complete units, and uses the `owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-1` catalog version. History Unit 1 is bundled; History Units 2–6, Economics Units 4–8, and Health & PE Units 2–8 remain unresolved until individually source-bounded batches pass validation.

Accepted-unit provenance and unresolved coverage are recorded in `content/pending_subject_source_catalog.json`. The private external delivery package preserves approved source copies, checksums, validation reports, accepted units, baseline archives, and merged delivery banks. Do not publish private source locations, credentials, or tokens in public repository metadata or release notes.

The standalone validator rejects missing required fields, duplicate IDs and wording, missing answer keys, invalid answer-option relationships, incorrect type or difficulty distributions, empty source notes, and review statuses other than `ai_draft`. For the command-line validation flow, run:

```bash
pnpm validate:bank /path/to/complete_question_bank.json
```

The same rules execute before an Android user can activate an imported JSON bank. On failure, the current bank is kept intact and the app displays the rejection report. Every bundled question retains `ai_draft` only for fixed-schema compatibility. The app no longer exposes a teacher-review screen, review-state publishing workflow, or learner-facing review label; structural validation still does not prove pedagogical suitability beyond the documented source boundary.
