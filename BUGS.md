# QA Defect Log

This log records the defects reproduced during the 2026-08-24 audit of the Molarum Grade 10 study library. The audit covered a clean-clone dependency install, TypeScript, lint, unit tests, question-bank validation, server bundling, static web export, Android JavaScript export, and browser smoke checks on the library, subject, unit, quiz, and resume routes.

| ID | Severity | Area | Reproduced behavior | Resolution | Retest |
|---|---|---|---|---|---|
| QA-001 | High | Web/APK build | A clean-clone `npx expo export --platform web` failed because Metro attempted to hash `react-native-css-interop/.cache/web.css` before the forced filesystem CSS output existed. | Switched NativeWind to virtual CSS modules in `metro.config.js`, which supports static export without requiring a generated cache file to pre-exist. | Clean web export passed and emitted all 12 static routes. Android export also passed. |
| QA-002 | Medium | Test harness | `pnpm test` failed in a clean clone because the optional Supabase test unconditionally expected local-only environment variables that are intentionally not committed. | Marked the connectivity test conditional with `it.skipIf(...)`; it still runs when both public Supabase variables are configured. | `pnpm test`: 13 passed, 2 skipped; the only skips are the optional Supabase check and the existing intentionally skipped auth test. |
| QA-003 | High | Quiz resume | After local hydration, a saved quiz could render from the initial state instead of the stored question index, response, and score because the route state was initialized before the provider finished loading. | Added a hydration gate and one-time session restoration keyed by unit and bank; route changes without a saved session now reset cleanly. | Browser flow restored Question 2 of 40 with 1 correct answer after returning through the library resume card. |
| QA-004 | Medium | Unit navigation | Units were sorted lexicographically, which would place Unit 10 before Unit 2 as the bank grows. | Added numeric unit ordering with a title fallback and a regression test. | The new resilience test passes; current History units render in numeric order. |
| QA-005 | Medium | Library progress | The dashboard counted every completed attempt as a separate completed unit, inflating progress after repeated practice. | Progress now counts unique unit keys per subject. | Typecheck, lint, tests, and browser home smoke check passed. |
| QA-006 | Medium | Resume controls | The unit screen advertised “Continue practice” while leaving difficulty and timed controls editable even though the quiz route resumes the stored settings. | Disabled those controls while a saved session exists and added an explicit saved-settings hint. | Typecheck, lint, web export, Android export, and browser quiz flow passed. |
| QA-007 | Low | Subject identity | Every subject detail header used the Chemistry/science icon, which was misleading for learners. | Centralized subject icon metadata and used the matching icon on both library and subject screens. | Browser History route displayed the History hourglass icon; other library icons remained visible. |
| QA-008 | Medium | Deep links | Subject and results routes consumed dynamic params without normalizing Expo’s possible array-valued parameter shape. | Normalized both route params before lookup. Results percentage and review counts also now handle malformed zero-question attempts safely. | Typecheck, lint, tests, and static web export passed. |

## Known non-blocking items

The repository still contains an intentionally skipped authentication logout test, which is documented in the test file and awaits the future authentication implementation. Lint reports a Node `MODULE_TYPELESS_PACKAGE_JSON` warning for the existing ESLint configuration, and Expo reports available patch-level package updates; neither currently causes a build or test failure.

## Acceptance result

All audited code and content checks passed after the fixes. The optional Supabase connectivity test is skipped when local credentials are absent, as expected for a private clean clone; it remains active in environments that provide the two documented public runtime variables.


## Final browser retest note

The active Unit 1 screen showed disabled difficulty controls, a disabled timed switch, the text “Saved as untimed practice,” and a hint that the session would resume at question 2. The Continue practice button remained available and correctly returned to the saved quiz.
