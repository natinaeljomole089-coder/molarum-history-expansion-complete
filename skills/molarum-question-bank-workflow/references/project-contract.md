# Molarum Project Contract

| Concern | Authoritative location |
|---|---|
| Active offline bank | `assets/question-banks/grade10-source-grounded-bank.json` |
| Schema enforcement | `lib/molarum/validator.ts` and `scripts/validate-question-bank.ts` |
| Quiz filter behavior | `lib/molarum/filters.ts` |
| Local progress, attempts, and resumable quizzes | `lib/molarum/provider.tsx` and `lib/molarum/types.ts` |
| Packaged-bank migration | `lib/molarum/bank-storage.ts` |
| Active content metadata | `content/manifest.json` |
| Source queue and unit provenance | `content/pending_subject_source_catalog.json` |
| Continuation decisions | `content/review_issues.md` |
| Candidate batches | `content/drafts/` |
| Regression checks | `tests/molarum.validator.test.ts`, `tests/molarum.resilience.test.ts` |
| External delivery package | `/home/ubuntu/grade10_question_bank_delivery/` |

## Non-negotiable protections

- Retain learner profile, attempts, and `inProgressQuiz` local persistence.
- Never replace an imported bank through a packaged-bank upgrade.
- Keep the active student UI free from provenance, governance, teacher-review, or technical-management language.
- Preserve prior validated-bank archives before merging a continuation unit.
- Keep the canonical question type and difficulty distribution exact for every completed unit.
