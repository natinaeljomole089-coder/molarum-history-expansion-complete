# Molarum Release-Readiness Audit

**Audit date:** 2026-08-24  
**Baseline commit:** `755cc15` on `main`  
**Working-tree state at capture:** Only the newly added audit entries in `todo.md` were uncommitted; no runtime code, protected question data, or release configuration was changed during this baseline review.

## Baseline snapshot

| Area | Observed state |
|---|---|
| Package manager | pnpm 9.12.0 |
| Runtime | Expo SDK 54.0.29, React Native 0.81.5, React 19.1.0 |
| Package identity | `app-template` |
| App identity | Molarum, slug `molarum`, version `1.0.0`, portrait orientation |
| Android package | `com.app.molarum` |
| Deep-link scheme | `manusmolarum` with a wildcard-host custom-scheme intent filter |
| Android permissions | Explicitly empty list in resolved public Expo configuration |
| Student routes | Library, Tools, Profile, subject, unit, quiz, and results only |
| Bundled bank | 1,840 questions across 46 complete units; current catalog `owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-1` |
| Current History coverage | Unit 1 is bundled; Units 2–6 remain explicitly unresolved pending source-bounded continuation work |

## Confirmed working behavior

The application’s student route tree contains only the intended Library, Tools, Profile, subject, unit, quiz, and result journeys. The root uses safe-area and gesture providers, the dark status bar is configured, and the provider starts from a validated bundled bank when local state is absent or malformed.

The local study provider retains learner profile, attempts, a single resumable quiz, bank descriptors, and staged pointer-last bank activation. Packaged prior catalog versions upgrade while imported banks are left intact. The quiz screen persists progress, presents a saved-session recovery path, stores results, and provides an explicit discard confirmation.

The canonical validator accepted the active bank with the required per-unit type split and 14/18/8 difficulty balance. TypeScript, lint, tests, bank validation, public Expo configuration resolution, web export, and Android JavaScript export all passed during the baseline run. The test suite reported 12 passing tests and one optional connection test skipped.

## Confirmed defects or maintenance risks

| Finding | Evidence | Classification |
|---|---|---|
| Generic npm identity remains `app-template`. | `package.json` baseline inspection. | Recommended repository-identity improvement. |
| Android package ID is generic (`com.app.molarum`). | Resolved Expo configuration. | Requires owner confirmation before any change because it can break upgrade continuity, deep links, and existing installations. |
| Custom-scheme intent filter uses `autoVerify: true` and `host: "*"`. | `app.config.ts`. | Recommended configuration review; Android App Links verification is not meaningful for a custom scheme, and a wildcard host is broader than demonstrated product needs. |
| No managed build profile exists. | No `eas.json` in the repository. | Recommended release-pipeline documentation/configuration work, contingent on managed workspace support. |
| Duplicate-answer race is not explicitly guarded at function entry. | Quiz `submit()` increments correct count before a render disables controls. | Recommended resilience test and, if reproduced, a small runtime guard. |
| Local import/export and optional cloud APIs exist in providers or legacy documentation, but no active student route exposes technical-management UI. | Active route audit and provider review. | Documentation and scope-alignment risk; do not reintroduce retired student management screens without a specific product decision. |
| Tracked Python bytecode exists. | `scripts/__pycache__/*.pyc` is tracked. | Required repository-hygiene cleanup. |

## Documentation drift

`SOURCE_GOVERNANCE.md` describes a 1,720-question catalog, Economics Unit 2 as next, and History as unavailable. `content/review_issues.md` describes a 1,800-question catalog and History with no bundled unit. `RELEASE_NOTES.md`, `docs/BASELINE_AND_VERIFICATION.md`, `docs/RELEASE_VERIFICATION.md`, and `docs/SAFE_AUDIT_REPORT.md` include historical counts, deleted routes, or retired Records/import/export/cloud surfaces without consistently labeling their baseline date and commit.

The current `content/manifest.json` and `docs/PROJECT_HANDOFF.md` are the closest current-state references. A designated current-state document should link to historical audit snapshots rather than allow their facts to be read as current implementation claims.

## Release blockers

No Android APK or AAB has been generated, downloaded, installed, checksummed, or uploaded to a GitHub Release. The managed workspace’s **Publish** action is the only supported Android package path in this environment.

Before a release can be recommended, the maintainer must decide whether to retain `com.app.molarum`, select an intentional package ID, or preserve upgrade continuity. A release version and Android version-code policy is also absent. A managed-build profile may be useful only after confirming it is compatible with the workspace.

## Device-only checks that remain unverified

The following cannot be proven by static exports or the sandbox: clean APK installation, upgrade installation, cold offline launch on hardware, persistence after real process termination, Android system-bar behavior across OEMs, large-font behavior, document-picker cancellation and provider variance, PDF/share fallback behavior, deep-link handling on a device, and optional Supabase behavior under real network failures.

## Proposed changes

| Priority | Proposed change | Rationale |
|---|---|---|
| Required | Remove tracked `__pycache__` files and ignore Python bytecode. | Prevent generated repository noise. |
| Required | Reconcile current counts, catalog version, History status, and removed-route claims across release/governance documents. | Prevent release and content-governance drift. |
| Required | Add a release checklist and an explicit blocker report for managed Publish, artifact verification, and GitHub Release attachment. | Avoid unsupported APK claims. |
| Recommended | Rename the npm package from `app-template` to a Molarum-specific private package name. | Establish deliberate repository identity without affecting Expo routing. |
| Recommended | Add a generated machine-readable bank-summary report and test it against the canonical bank. | Prevent future count, type, difficulty, and unresolved-coverage drift. |
| Recommended | Add a one-shot submission guard plus regression coverage if the duplicate-answer race is reproduced. | Protect score integrity under rapid taps. |
| Recommended | Replace the custom-scheme wildcard intent filter with only demonstrably needed deep-link configuration after product confirmation. | Reduce unnecessary Android surface area. |
| Optional | Add a compatible `eas.json` with named internal-APK and production-AAB profiles only if the managed workspace confirms support. | Make the release pipeline explicit without pretending the sandbox can build the artifact. |
| Optional | Add a minimal contribution policy, security contact, and private-repository issue templates. | Improve solo-maintainer handoff without product scope expansion. |

## Approval boundary

This report does not approve or perform a package-ID change, APK generation, GitHub push, GitHub Release publication, or changes to protected question content.

## Prepared local changes — awaiting approval

The following changes were prepared locally and remain uncommitted and unpushed. They do not alter app routes, learner-data behavior, protected question content, Android package ID, app version, permissions, or deep-link configuration.

| Area | Prepared change |
|---|---|
| Repository identity | Renamed the private npm package from `app-template` to `molarum-grade10-study-library`; the frozen lockfile remains valid. |
| Content drift prevention | Added `scripts/generate-content-summary.mjs`, a `pnpm content:summary` command, committed `content/content-summary.json`, and a regression test that compares the summary with the canonical bank. |
| Current-state documentation | Added `docs/CURRENT_STATE.md`, `docs/RELEASE_CHECKLIST.md`, and `docs/MANAGED_BUILD_BLOCKER.md`; linked the current-state document from README. |
| Historical documentation | Marked earlier release and audit records as historical snapshots and updated governance/review records to the current 1,840-question / 46-unit catalog with History Unit 1 bundled. |
| Repository hygiene | Added Python cache ignore rules and staged removal of two tracked Python bytecode files. |
| Audit evidence | Added this audit report and preserved the explicit distinction between exports, managed artifacts, and device testing. |

## Prepared-change validation

After preparation, the frozen install, content-summary generation, TypeScript, lint, Vitest, strict bank validation, public Expo configuration resolution, web export, Android JavaScript export, and whitespace check passed. The active protected bank remains 1,840 questions across 46 complete units, with no validation errors.

The prepared configuration still resolves to Molarum version `1.0.0`, package `com.app.molarum`, scheme `manusmolarum`, and an explicitly empty Android permission list. No APK, AAB, package-ID change, EAS profile, GitHub push, or GitHub Release was created.

> **Approval requested:** Approve the prepared local documentation, repository-hygiene, package-name, and summary-test changes if you want them committed and pushed to the private repository. The Android package ID and deep-link configuration remain intentionally unchanged pending a separate explicit decision.
