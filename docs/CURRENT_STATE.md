# Molarum Current State

**Status date:** 2026-08-27

**Canonical product state:** Use this document for the current repository, content, release, and verification state. Older audits and release notes are historical snapshots only.

## Product

Molarum is an offline-first Grade 10 study library. The student app exposes Library, Tools, Profile, subject browsing, unit launchers, one-question-at-a-time quizzes, results, local progress, and resumable local practice. Technical management, Records, teacher-review, Project Blueprint, account/cloud, and source-management screens are not student-facing routes.

## Verified catalog

| Metric | Current value |
|---|---:|
| Bundled questions | 2,000 |
| Complete units | 50 |
| Catalog version | `owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-5` |
| History | Units 1–5 bundled; Unit 6 remains unresolved pending source-bounded continuation work |
| Economics | Units 1–3 bundled; Units 4–8 unresolved |
| Health & PE | Unit 1 bundled; Units 2–8 unresolved |
| Structural review status | `ai_draft`; structural validation is not teacher approval |

`content/manifest.json` is the protected machine-readable catalog record. `content/pending_subject_source_catalog.json` records accepted source boundaries and unresolved coverage. `content/review_issues.md` is the human-readable coverage record.

## Local-first behavior

The app starts from the validated packaged bank and preserves learner profile, attempts, and one resumable in-progress quiz on-device. Bank activation uses a staged record with a pointer-last swap. Earlier packaged catalogs upgrade to the current packaged bank; imported banks remain untouched.

## Release status

The repository contains source code, not an Android artifact. No APK or AAB has been generated, installed, checksummed, or published as a GitHub Release. The project workspace’s managed **Publish** action is the supported artifact path. Read `docs/RELEASE_CHECKLIST.md`, `docs/MANAGED_BUILD_BLOCKER.md`, and `APK_RELEASE_GUIDE.md` before a release.

## Validation status

At the 2026-08-24 repair pass, `pnpm check`, `pnpm lint`, `pnpm test` (13 passed, 2 expected skips), `pnpm build`, strict bank validation, web export, and Android JavaScript export passed. The optional Supabase endpoint probe was skipped because no public cloud variables were configured. A 2026-08-27 read-only audit at revision `ba4de0179baf5fd3994367f4b31d2cef5e46b834` independently confirmed the canonical bank count, unit distributions, duplicate checks, source-note presence, answer presence, and protected-path presence; it did not execute target project code. Physical-device installation, cold offline launch, native process termination, system bars, large fonts, deep links, document picker, PDF share, and optional cloud recovery remain device-only checks.
