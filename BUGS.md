# Molarum Defect Log

**QA pass date:** 2026-08-24
**Starting revision:** `ffc8d6d`

This log records defects reproduced or identified during the clean-clone, static, and browser-oriented audit of the Molarum Grade 10 study library.

| ID | Severity | Area | Problem | Resolution | Retest |
|---|---|---|---|---|---|
| QA-001 | High | Web/APK build | Metro attempted to hash NativeWind’s generated `react-native-css-interop/.cache/web.css` during a clean web export. | Switched NativeWind to virtual CSS modules in `metro.config.js`. | Web and Android JavaScript exports passed; all 12 static web routes emitted. |
| QA-002 | Medium | Test harness | The optional Supabase connectivity test failed the entire local suite when public cloud variables were absent. | Made the endpoint probe conditional with `it.skipIf(...)`; it still runs when both public variables are configured. | `pnpm test`: 13 passed, 2 skipped. |
| QA-003 | High | Quiz resume | A route could render from initial state before local hydration, losing the stored question index, response, and score on a cold/deep-linked open. | Added keyed one-time session initialization and a hydration gate. | Browser smoke flow restored the saved question and score through the Library resume card. |
| QA-004 | Medium | Unit navigation | Lexicographic unit sorting would place Unit 10 before Unit 2 as the bank grows. | Added numeric unit ordering with a title fallback and regression coverage. | Resilience test passes; current units render in numeric order. |
| QA-005 | Medium | Library progress | Counting every attempt as a completed unit inflated dashboard progress after repeated practice. | Progress now counts unique unit keys per subject. | Typecheck, lint, tests, and browser home smoke check passed. |
| QA-006 | Medium | Resume controls | The unit screen advertised “Continue practice” while leaving difficulty and timed controls editable even though the quiz resumes the stored settings. | Disabled conflicting controls and added an explicit saved-settings hint. | Typecheck, lint, web export, Android export, and browser flow passed. |
| QA-007 | Low | Subject identity | Every subject detail header used the Chemistry/science icon. | Centralized subject icon metadata and used the matching icon on Library and subject screens. | History route displayed the History hourglass icon. |
| QA-008 | Medium | Deep links/results | Dynamic route params could be array-valued, and malformed zero-question attempts could yield invalid percentages or review counts. | Normalized route params and made result calculations defensive. | Typecheck, lint, tests, and static web export passed. |
| M-001 | High | Local persistence | A malformed saved attempt or in-progress quiz could throw during hydration; falling back to the empty state risked overwriting recoverable local progress. | Added defensive persisted-state parsing that filters invalid attempts and resumes while retaining valid records and the packaged bank. | Typecheck, tests, and Android JavaScript export passed. |
| M-002 | Medium | Quiz resume integrity | A crafted or stale in-progress queue could contain IDs from another unit and resume the wrong questions. | Resume validation now requires unique IDs, valid counters, and exact subject/unit membership. | Resilience regression coverage passes. |
| M-003 | High | Quiz results | Final completion could read a stale React state value for the correct-answer count or timer during a rapid state transition. | Final result persistence now reads authoritative refs, with a pure score helper and regression coverage. | Resilience regression coverage and Android export pass. |

## Validation result

`pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, strict packaged-bank validation, `npx expo export --platform web`, and `npx expo export --platform android` all pass. Lint retains an existing Node `MODULE_TYPELESS_PACKAGE_JSON` warning for the ESLint configuration; it does not fail the check.

## Remaining device-only items

The repository contains no APK or AAB. Physical installation, cold offline launch, native process termination, Android system bars, large-font layout, native deep links, document picker, PDF sharing, and optional Supabase sign-in recovery still require the managed project workspace’s **Publish** artifact and a physical or emulated Android environment. No claim of physical APK QA is made here.

The optional Supabase endpoint test is skipped in this sandbox because no public project URL or publishable key is configured. This is expected for the offline-first local test environment, not evidence that a configured cloud project is healthy.
