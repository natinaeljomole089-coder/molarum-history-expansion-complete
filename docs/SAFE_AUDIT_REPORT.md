# Molarum Safe Technical Audit Report

**Audit date:** 2026-08-22  
**Baseline checkpoint:** `59cd9170`  
**Project root:** `/home/ubuntu/molarum`  
**Audit boundary:** Existing source project only. No source-grounded question, source note, explanation, question ID, review metadata, active bank, local learner record, remote repository, APK, or publication action was changed by this audit.

## Resource log

No external package, repository, binary, Android SDK component, emulator image, asset, or test fixture was downloaded or installed. The full proposed-resource record, including existing tool versions and licenses, is in [`SAFE_AUDIT_RESOURCE_PLAN.md`](./SAFE_AUDIT_RESOURCE_PLAN.md).

| Resource | Version | Source or location | License | Purpose | Verification status |
|---|---:|---|---|---|---|
| Node.js | 22.13.0 | Existing sandbox toolchain | Node.js license | Runs project tooling | Existing and invoked successfully |
| pnpm | 9.12.0 | Existing sandbox toolchain | MIT | Existing package manager | Existing and invoked successfully |
| Expo CLI / SDK | CLI 54.0.19 / SDK 54.0.29 | Project-local `expo` dependency | MIT | Managed config resolution and bundle export | Existing and invoked successfully |
| TypeScript | 5.9.x | Project-local dependency | Apache-2.0 | Static type checking | Existing and passed |
| Vitest | 2.1.9 | Project-local dependency | MIT | Unit and integration-style tests | Existing and passed |

## Audit baseline

| Area | Confirmed state |
|---|---|
| Framework | Expo SDK 54, React Native 0.81.5, React 19.1.0, Expo Router 6, TypeScript 5.9, pnpm 9.12 |
| Application routes | Library, records, tools, subject, unit, quiz, result, question-bank, teacher-review, cloud, blueprint, and OAuth callback routes are present in `app/` |
| Offline storage | AsyncStorage holds local profile, attempts, review states, metadata, and in-progress quiz state; versioned active-bank records use a staged record and pointer-last protocol |
| Optional cloud | Cloud/auth is wrapped inside the local study provider, uses explicit user actions, and does not gate local quiz use |
| Android source | Managed Expo configuration only; no committed `android/` Gradle project, `AndroidManifest.xml`, `eas.json`, or native build profile was found |
| Git state at audit start | `59cd9170` was `HEAD`; the only uncommitted change was the audit task log entry created for this work |

## Diagnosis

### Confirmed findings

| Finding | Evidence | Impact |
|---|---|---|
| The packaged bank remains structurally valid with 1,640 questions across 41 units. | `pnpm validate:bank assets/question-banks/grade10-source-grounded-bank.json` | No content-schema regression found. |
| Atomic active-bank behavior is covered by deterministic tests for stable IDs, verified activation, and interrupted pointer writes. | `tests/molarum.bank-storage.test.ts` | Supports last-known-good recovery in the tested storage abstraction. |
| Import validation is non-mutating until explicit activation, and stale drafts are rejected when their bank ID differs. | Existing resilience tests and local provider/quiz implementation | Source-safe import and draft recovery paths are covered in code and tests. |
| Managed configuration resolves `android.permissions` to an empty list, package `com.app.molarum`, scheme `manusmolarum`, and min SDK 24. | `npx expo config --type public --json` | No configured Android runtime permission is requested. |
| Managed web and Android bundles export successfully. | `npx expo export --platform web` and `npx expo export --platform android` | JavaScript bundle generation succeeds; this is not an installable APK build. |

### High-confidence risks or maintenance observations

| Observation | Basis | Safe next step |
|---|---|---|
| Device-only workflows cannot be proven by static export. | No emulator or physical Android device is connected; no APK was built or installed. | Publish a managed build only after user confirmation, then test on a physical Android device. |
| The installed Android manifest cannot be diffed from source. | Managed Expo project has no committed native Android project; generating one would modify the workspace. | Inspect the manifest emitted by a user-approved managed build artifact. |
| Lint reports an existing Node module-type performance warning for `eslint.config.js`. | `pnpm lint` succeeds but prints a `MODULE_TYPELESS_PACKAGE_JSON` warning. | Treat as non-blocking; evaluate `package.json` module-type changes separately because they may affect project tooling. |

### Issues not reproduced or not reproducible in this environment

| Area | Status | Reason |
|---|---|---|
| First launch, offline launch, Android Back, and cold/warm deep links | Not reproduced | Requires installed Android build or device/emulator session. |
| Native document picker, invalid-file selection, and sharing-provider failure | Partially covered by code/tests; device workflow not reproduced | Requires Android system UI and provider apps. |
| Process kill/restart during a real AsyncStorage write | Not reproduced | The pointer-recovery behavior is covered by deterministic storage tests, not OS process termination. |
| TalkBack, 200% system text, high contrast, and reduced motion | Not reproduced | Requires device accessibility settings. |
| Cloud sign-in, private storage, and role workflows | Not run | Requires account/session interaction; local behavior remains available without it. |

## Exact audit-scope file changes

No runtime, source-content, dependency, or configuration file was changed during this audit.

| File | Change |
|---|---|
| `todo.md` | Added the four audit work items and marked them complete after verification. |
| `docs/SAFE_AUDIT_RESOURCE_PLAN.md` | Added the resource plan and no-install decision. |
| `docs/SAFE_AUDIT_REPORT.md` | Added this audit evidence and limitation record. |

The previous application-hardening checkpoint’s code-level change inventory is retained in [`RELEASE_VERIFICATION.md`](./RELEASE_VERIFICATION.md).

## Dependency and manifest diff

| Artifact | Baseline `59cd9170` | Audit result | Diff |
|---|---|---|---|
| `package.json` dependencies | Existing Expo/React Native/AsyncStorage/DocumentPicker/Print/Sharing/Vitest stack | Unchanged | None |
| Lockfile | Existing `pnpm-lock.yaml` | Unchanged | None |
| `app.config.ts` Android permissions | `[]` | Resolved config reports `[]` | No added or removed permission |
| Package | `com.app.molarum` | Resolved config reports `com.app.molarum` | None |
| Deep-link scheme | `manusmolarum` | Resolved config reports `manusmolarum` | None |
| Native `AndroidManifest.xml` | Not committed | Not generated during audit | No source diff available |

## Commands and results

| Command | Result |
|---|---|
| `pnpm validate:bank assets/question-banks/grade10-source-grounded-bank.json` | Passed; no validation errors |
| `pnpm lint` | Passed; non-blocking existing module-type warning |
| `pnpm check` | Passed |
| `pnpm test` | 15 passed, 1 existing auth test skipped |
| `npx expo export --platform web` | Passed; 18 static routes emitted |
| `npx expo export --platform android` | Passed; Android Hermes bundle emitted |
| `npx expo config --type public --json` | Resolved package, scheme, min SDK, and empty permission list |

## Build and device detail

The managed Android export produced a JavaScript/Hermes bundle in `dist`; it did **not** create or install an APK/development build. There is no APK identifier, emulator, Android device, installed manifest, or device-test record for this audit. Publishing, APK generation, device installation, remote upload, and repository push were intentionally not performed.

## Required user-side runtime checks

Before treating the app as device-verified, test a user-approved managed APK on a physical Android device for first/offline launch, subject/unit/quiz navigation, Android Back, cold/warm deep links, document picker import/rejection, interrupted import recovery, restore/clear confirmations, process restart during a quiz, PDF save/share fallback, TalkBack labels and announcements, 200% text, high contrast, and reduced motion.
