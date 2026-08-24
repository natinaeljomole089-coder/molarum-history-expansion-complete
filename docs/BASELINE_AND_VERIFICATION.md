# Molarum Baseline and Verification Record — Historical Snapshot

> **Historical record:** This document describes a pre-redesign, pre-expansion baseline. Use `docs/CURRENT_STATE.md` and `docs/RELEASE_READINESS_AUDIT_2026-08-24.md` for current facts.

**Recorded:** 2026-08-22

## Baseline command results

| Check | Result | Classification |
|---|---|---|
| `pnpm test` | 12 tests passed; 1 authentication test skipped | Confirmed |
| Bundled bank validation | 1,640 source-grounded questions across 41 complete units were previously accepted | Confirmed from the validated bundle and test suite |
| Resolved Expo Android configuration | `android.permissions` is `[]` | Confirmed from `npx expo config --type public --json` |
| Managed web and Android exports | Completed before this follow-up scope | Confirmed |

## Current navigation map

| Route | Purpose | Baseline status |
|---|---|---|
| `/(tabs)` | Library home, local records, and tools tabs | Confirmed |
| `/subject/[subjectId]` | Subject shelf | Confirmed |
| `/unit/[unitKey]` | Unit detail and quiz start | Confirmed |
| `/quiz/[unitKey]` | Local revision quiz | Confirmed |
| `/results/[attemptId]` | Saved local result | Confirmed |
| `/question-bank` | Candidate import review and packaged restore | Confirmed |
| `/teacher-review` | Local review-state overlay | Confirmed |
| `/cloud` and `/oauth/callback` | Optional authentication/cloud path | Confirmed from source |

## Storage and canonical-state baseline

| Area | Existing behavior | Classification |
|---|---|---|
| Storage key | `molarum.local-study-library.v1` stores the active bank, origin, review states, learner profile, attempts, and one in-progress quiz in one JSON value | Confirmed from `lib/molarum/provider.tsx` |
| Active bank | Existing state uses `packaged`, `imported`, or derived `none`; labels are screen-derived | Confirmed from source |
| Bank identity | The active bank has a source catalog version but no stable bank ID written into every attempt or draft | Confirmed from `lib/molarum/types.ts` and provider |
| Import | Candidate validation occurs before activation, but the activated state is written through the same aggregate storage value | Confirmed from source |
| Interrupted write | There is no temporary version record plus active pointer recovery protocol | Confirmed from source |
| Quiz drafts | One resumable draft persists question IDs, index, answer, score, and elapsed time; it does not yet bind the draft to a stable bank ID | Confirmed from source |
| Records | Completed attempts are local revision records, but do not yet retain a bank ID/version | Confirmed from source |

## Permissions evidence

`app.config.ts` declares `android.permissions: []`. The app uses the system document picker and private app storage for import/export. No source code path requires audio, overlays, foreground services, boot, wake-lock, notifications, biometric, legacy storage, or media-library access for ordinary study workflows.

No generated native `android/app/src/main/AndroidManifest.xml` is checked into this managed Expo project, so a final installed-manifest diff requires the managed publishing build artifact. This is **not reproducible in the sandbox** without publishing.

## Runtime limitations and next verification

Cold/warm Android deep links, Android Back during native modals, process recreation, file-provider saving, share-sheet availability, TalkBack announcements, 200% system font scale, high-contrast rendering, reduced-motion behavior, and install/launch smoke testing require a physical Android device or managed preview session. These remain **not reproducible in the sandbox** and must not be represented as device-verified.
