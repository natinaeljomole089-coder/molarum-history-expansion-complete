# Molarum Project Handoff

## Purpose

Molarum is an offline-first Grade 10 revision library for Android. It bundles validated questions, keeps learner progress on-device, supports resumable practice, and presents a premium dark student experience. The current catalog is **1,960 questions across 49 units**.

## Where to start

| Task | Start here |
|---|---|
| App navigation and visual system | `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `design.md`, `theme.config.js` |
| Library, Tools, and Profile tabs | `app/(tabs)/index.tsx`, `app/(tabs)/tools.tsx`, `app/(tabs)/profile.tsx` |
| Subject, unit, quiz, and result journeys | `app/subject/[subjectId].tsx`, `app/unit/[unitKey].tsx`, `app/quiz/[unitKey].tsx`, `app/results/[attemptId].tsx` |
| Offline data and resume behavior | `lib/molarum/provider.tsx`, `lib/molarum/types.ts`, `lib/molarum/bank-storage.ts` |
| Question-bank schema and validation | `lib/molarum/validator.ts`, `scripts/validate-question-bank.ts`, `tests/` |
| Content and provenance | `assets/question-banks/`, `content/`, `../grade10_question_bank_delivery/` |
| Android release procedure | `APK_RELEASE_GUIDE.md` |
| Source-grounded content workflow | `skills/molarum-question-bank-workflow/SKILL.md` |

## Student-product boundaries

The student app exposes **Library**, **Tools**, and **Profile** only. Retired Records, Project Blueprint, teacher-review, cloud/account, question-bank management, and technical governance screens must not be reintroduced into the student UI. Keep student copy clear and avoid source-management terminology.

## Safe content continuation

Questions must come only from an approved Grade 10 textbook boundary. Build one complete 40-question unit at a time, validate it in isolation, screen it for duplicates, preserve the prior active bank, then update migration and provenance. The reusable workflow skill is the canonical operating guide.

> **History status:** The owner-approved History textbook is available. History Units 1–4 are bundled; Units 5–6 remain source-bounded continuation work rather than unsupported placeholder content.

## Validation commands

```bash
pnpm check
pnpm lint
pnpm test
pnpm validate:bank assets/question-banks/grade10-source-grounded-bank.json
npx expo export --platform web
npx expo export --platform android
```

## GitHub and APK delivery

The private GitHub repository is the source handoff location. An Android binary is created only through the managed **Publish** action in the project workspace. After that build is downloaded, it can be attached to a private GitHub Release. Read `APK_RELEASE_GUIDE.md` before preparing a release asset.
