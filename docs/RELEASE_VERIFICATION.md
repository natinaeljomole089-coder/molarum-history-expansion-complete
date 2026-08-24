# Canonical Bank and Recovery Release Verification — Historical Snapshot

> **Historical record:** This document contains verification evidence for a retired route and earlier catalog state. Use `docs/CURRENT_STATE.md` and `docs/RELEASE_CHECKLIST.md` for current release guidance.

**Baseline checkpoint:** `d70c29a8`  
**Verification date:** 2026-08-22

## Implemented state and recovery changes

| Area | Implemented behavior | Evidence |
|---|---|---|
| Canonical bank state | Active content is represented as `packaged_validated`, `imported_draft`, or `none` through a single `BankDescriptor`. | `lib/molarum/types.ts`, `lib/molarum/provider.tsx` |
| Bank identity | Every new quiz draft and saved score stores `bankId`, origin, and source catalog version. | `types.ts`, provider, quiz/results/records flows |
| Atomic import/restore | Candidate banks are staged to a temporary versioned record, read back for verification, written to a final record, then selected by the active pointer. The pointer is changed last. | `lib/molarum/bank-storage.ts` |
| Interrupted replacement | A failed pointer write leaves the prior pointer and its last-known-good record active. | `tests/molarum.bank-storage.test.ts` |
| Draft compatibility | A draft can resume only if its bank ID matches the current active descriptor and every queued question still exists. Otherwise it is labelled incompatible and can be safely discarded. | `lib/molarum/quiz-session.ts`, `app/quiz/[unitKey].tsx` |
| Restore confirmation | Restore identifies the current state, current/replacement counts, local review-state count, preserved records, and explicit destructive action. | `app/question-bank.tsx` |
| Records/export | Results, records, copied summaries, and saved history exports retain bank version and packaged/imported-draft status. | `results`, `records`, `native-actions`, `report-html` |

## Changed files

| Group | Files |
|---|---|
| Canonical state | `lib/molarum/types.ts`, `provider.tsx`, `bank-storage.ts`, `quiz-session.ts` |
| Recovery-first UI | `app/(tabs)/index.tsx`, `question-bank.tsx`, `unit/[unitKey].tsx`, `quiz/[unitKey].tsx`, `results/[attemptId].tsx`, `app/oauth/callback.tsx`, `components/molarum/ui.tsx` |
| Records and export | `app/(tabs)/records.tsx`, `lib/molarum/native-actions.ts`, `lib/molarum/report-html.ts` |
| Tests and governance | `tests/molarum.bank-storage.test.ts`, `tests/molarum.resilience.test.ts`, `tests/molarum.validator.test.ts`, `docs/BASELINE_AND_VERIFICATION.md`, this file, `todo.md` |

## Test and build matrix

| Check | Type | Result |
|---|---|---|
| Packaged 1,640-question bank structural validation | Unit/data validation | Passed; no issues |
| Import metadata, duplicate, empty-queue, draft-compatibility, and export disclaimer tests | Unit | Passed |
| Staged record, verified pointer activation, and interrupted pointer recovery tests | Integration-style storage unit test | Passed |
| Existing validator and optional Supabase connection tests | Unit/integration | Passed |
| `pnpm lint` and `pnpm check` | Static | Passed; lint reports only the existing module-type warning |
| Managed web export | Bundle smoke check | Passed |
| Managed Android export | Bundle smoke check | Passed |
| Android device install, launch, deep-link, Back, file-provider, TalkBack, 200% text, contrast, and reduced-motion smoke tests | Device/manual accessibility QA | Not run in sandbox; requires a physical Android device or managed preview session |

## Permission evidence and diff

The source-level managed Expo configuration continues to resolve `android.permissions` to `[]`. The current workflow uses the system document picker, private app storage, and the system share sheet; it does not request audio, overlay, foreground-service, boot, wake-lock, notification, biometric, legacy storage, or media-library permissions.

| Permission artifact | Prior baseline | This release | Result |
|---|---|---|---|
| `app.config.ts` configured Android runtime permissions | `[]` | `[]` | No configured runtime-permission change |
| Generated `android/app/src/main/AndroidManifest.xml` in source tree | Absent | Absent | Installed-manifest comparison is a publish/device task, not claimed as verified |

## Remaining runtime limitations

The app did not undergo a physical Android install or accessibility smoke test in this sandbox. Specifically, external sharing behavior, user-selected file-provider destinations, Android Back in native dialogs, deep-link cold/warm starts, TalkBack announcements, 200% font scaling, high contrast, and reduced motion need device verification. No claim of device-level resolution is made for those cases.
