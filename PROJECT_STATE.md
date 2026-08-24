# Project State

## Current baseline

Molarum is an Expo Router Grade 10 offline study library with a validated packaged bank of 1,960 questions across the currently available subjects and History Units 1–4. Learner profile data, attempts, and resumable quizzes remain local-first and are preserved across packaged-bank upgrades.

## Latest quality baseline

The 2026-08-24 QA repair pass completed successfully. TypeScript checking, lint, Vitest, strict question-bank validation, server bundling, static web export, and Android JavaScript export all pass. The browser smoke pass verified the library home, History subject, History Unit 1, first-question feedback, next-question transition, and resume-card restoration at a compact desktop/mobile-like viewport.

| Check | Result |
|---|---|
| `pnpm check` | Passed |
| `pnpm lint` | Passed with existing Node module-type warning |
| `pnpm test` | Passed: 13 tests; 2 intentional/optional skips |
| `pnpm validate:bank assets/question-banks/grade10-source-grounded-bank.json` | Passed |
| `pnpm build` | Passed |
| `npx expo export --platform web` | Passed; 12 static routes emitted |
| `npx expo export --platform android` | Passed; Android JavaScript bundle emitted |
| Browser smoke test | Passed for library, subject, unit, quiz, feedback, and resume flow |

## Release note

The repository contains source and export validation only. A signed APK must still be produced through the managed project Publish flow, as described in [`APK_RELEASE_GUIDE.md`](./APK_RELEASE_GUIDE.md); no APK was manually built or published in the sandbox.
