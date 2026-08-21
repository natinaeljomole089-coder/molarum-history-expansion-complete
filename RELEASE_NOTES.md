# Release Notes — Android Preparation

## Scope completed

This update bundles a 720-question owner-Drive source-grounded bank into Molarum’s Android package. The portrait-first library, locally persisted learner records, quiz flow, teacher-review tools, strict JSON bank validation, PDF score-history export, and project blueprint export/copy controls remain available.

## Content validation status

| Subject | Validated units | Status |
|---|---:|---|
| Chemistry | 6 | Structurally validated; `ai_draft` teacher review required. |
| Physics | 6 | Structurally validated; two source-verified answer repairs; `ai_draft` teacher review required. |
| Biology | 6 | Structurally validated; `ai_draft` teacher review required. |
| Mathematics | 0 | `unresolved_after_retries_or_capacity` |
| Geography | 0 | `unresolved_after_retries_or_capacity` |
| Citizenship | 0 | `unresolved_after_retries_or_capacity` |
| Economics | 0 | `unresolved_after_retries_or_capacity` |
| Health & PE | 0 | `unresolved_after_retries_or_capacity` |

The bundled bank passed Molarum’s structural validator: every completed unit contains 40 questions with the required type and difficulty distributions. Its source notes and `ai_draft` review status are retained. This structural result does not replace a subject-teacher review of individual wording, calculations, and curriculum alignment.

## Android packaging

Create a project checkpoint, then use the project interface’s **Publish** control to generate the downloadable Android APK. Do not manually build the APK in the sandbox.
