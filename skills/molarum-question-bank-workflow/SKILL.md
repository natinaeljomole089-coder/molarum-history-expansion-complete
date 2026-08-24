---
name: molarum-question-bank-workflow
description: Safely expand, repair, audit, or deliver Molarum’s offline Grade 10 question bank. Use when sourcing textbooks, generating source-grounded questions, validating and merging continuation units, updating packaged-bank migration, or preparing Molarum content provenance and release materials.
---

# Molarum Question-Bank Workflow

Use this workflow only for the Molarum Grade 10 offline library. Preserve the active valid bank until a candidate batch has passed every required gate.

## Read first

Read `references/project-contract.md`, then inspect the live project files named there. Treat the active bank and existing learner data as protected. Never delete or rewrite them merely to add a continuation batch.

## Source gate

1. Prefer an owner-approved textbook from connected Drive. Use the Google Workspace CLI for Drive access; do not open private Drive links in a browser.
2. If a source is public, verify its textbook title, publisher, grade, and unit structure. Do not bypass login, subscription, or download restrictions.
3. Copy approved source material to a local review archive. Extract text with `pdftotext -layout` and record exact unit line boundaries plus source checksum.
4. Update `content/pending_subject_source_catalog.json` only after an approved source and explicit unit boundary exist.
5. Do not invent questions for a source gap. Keep the affected unit unresolved and state what source is needed.

## Candidate authoring gate

Create one isolated draft file per unit under `content/drafts/`. Follow the exact Molarum schema and completion contract:

| Requirement | Per complete unit |
|---|---:|
| Questions | 40 |
| Multiple choice | 20 |
| True/false | 4 |
| Short answer | 8 |
| Numerical/date items | 8 |
| Easy / medium / hard | 14 / 18 / 8 |

Every item requires an unambiguous answer, one-sentence teaching explanation, and a non-empty `sourceNote` anchored to a source section or extracted line range. Use `reviewStatus: "ai_draft"`. For history, date questions may satisfy the numerical type only when the date is explicit in the approved source.

Write questions from explicit source facts, relationships, definitions, examples, dates, tables, or calculations. Avoid trick questions, unsupported inference, ambiguous chronology, visual-only claims, and material that may have changed after the textbook was published.

## Validation and duplicate gate

1. Run `pnpm validate:bank content/drafts/<draft>.json`. Repair every issue before proceeding.
2. Screen the draft against the active bank for duplicate IDs, exact wording, and high semantic overlap. Replace or drop any duplicate candidate.
3. Retain the validation output, source boundary, and duplicate-screening conclusion in the delivery report.
4. Do not merge if the candidate has less than the complete contract distribution, unanswered items, unsupported claims, or unresolved overlap.

## Safe merge gate

1. Archive the current valid active bank before modifying it.
2. Merge only accepted draft questions; preserve all current questions and IDs.
3. Update `sourceCatalogVersion`, question count, unit count, `content/manifest.json`, `content/pending_subject_source_catalog.json`, and the external delivery package.
4. Update `lib/molarum/bank-storage.ts` so prior packaged catalog versions upgrade safely. Update `lib/molarum/provider.tsx` so the new catalog version is treated as current. Imported banks must remain untouched.
5. Update regression counts and staged-upgrade expectations in `tests/molarum.validator.test.ts` and `tests/molarum.resilience.test.ts`.

## Final acceptance gate

Run all of the following before saving a checkpoint:

```bash
pnpm check
pnpm lint
pnpm test
pnpm validate:bank assets/question-banks/grade10-source-grounded-bank.json
npx expo export --platform web
npx expo export --platform android
```

Verify that Library and relevant subject screens show dynamic question and unit totals. Check the new unit launcher and at least one quiz route at a compact Android portrait viewport. Update provenance, delivery manifests, review notes, and `todo.md`; then save a checkpoint.

## Release and repository handoff

Push validated source and documentation changes to the private GitHub repository. Never manually build or publish an APK in the sandbox. The user must select **Publish** in the managed project workspace; after the Android package is produced, they can upload it as a private GitHub Release asset. See `APK_RELEASE_GUIDE.md`.
