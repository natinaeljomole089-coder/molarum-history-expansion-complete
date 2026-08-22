# Release Notes — Android Preparation

## Scope completed

This continuation update expands Molarum’s Android package from 1,640 to **1,720 owner-Drive source-grounded questions**. It adds Geography Unit 3 and Citizenship Unit 6, each with 40 questions, while retaining the existing portrait-first library, records, quiz, validation, PDF export, and blueprint controls. The dedicated teacher-review screen, navigation entry points, cloud review-state publishing, and learner-facing teacher-review wording were retired.

## Content validation status

| Subject | Validated units | Status |
|---|---:|---|
| Chemistry | 6 | Structurally validated. |
| Physics | 6 | Structurally validated; two source-verified answer repairs. |
| Biology | 6 | Structurally validated. |
| Mathematics | 7 | Structurally validated. |
| Geography | 8 | Structurally validated; Unit 3 accepted in continuation batch 1. |
| History | 0 | `unresolved_after_retries_or_capacity`; source book not found in connected Drive. |
| Citizenship | 8 | Structurally validated; Unit 6 accepted in continuation batch 1. |
| Economics | 1 | Structurally validated; Unit 2 is the documented next source-bounded batch. |
| Health & PE | 1 | Structurally validated; Units 2–8 remain unresolved after source-only retries. |

The bundled bank passed Molarum’s structural validator: every completed unit contains 40 questions with the required type and difficulty distributions. Source notes and the legacy `ai_draft` schema field are retained; the app no longer presents a teacher-review workflow. The external delivery package records the source copies, hashes, validation reports, visual-source exclusions, and continuation queue.

## Android packaging

Create a project checkpoint, then use the project interface’s **Publish** control to generate the downloadable Android APK. Do not manually build the APK in the sandbox.
