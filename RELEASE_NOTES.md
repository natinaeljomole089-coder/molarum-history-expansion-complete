# Release Notes — Android Preparation

## Scope completed

This update expands Molarum’s Android package from 920 to **1,640 owner-Drive source-grounded questions**. It adds six Mathematics units, six Geography units, and six Citizenship units, each with 40 questions, while retaining the existing portrait-first library, records, quiz, review, validation, PDF export, and blueprint controls.

## Content validation status

| Subject | Validated units | Status |
|---|---:|---|
| Chemistry | 6 | Structurally validated; `ai_draft` teacher review required. |
| Physics | 6 | Structurally validated; two source-verified answer repairs; `ai_draft` teacher review required. |
| Biology | 6 | Structurally validated; `ai_draft` teacher review required. |
| Mathematics | 7 | Structurally validated; `ai_draft` teacher review required. |
| Geography | 7 | Structurally validated; Unit 3 remains unresolved after schema validation; `ai_draft` teacher review required. |
| History | 0 | `unresolved_after_retries_or_capacity`; source book not found in connected Drive. |
| Citizenship | 7 | Structurally validated; Unit 6 remains unresolved after schema validation; `ai_draft` teacher review required. |
| Economics | 1 | Structurally validated; Units 2–8 remain unresolved after source-only retries; `ai_draft` teacher review required. |
| Health & PE | 1 | Structurally validated; Units 2–8 remain unresolved after source-only retries; `ai_draft` teacher review required. |

The bundled bank passed Molarum’s structural validator: every completed unit contains 40 questions with the required type and difficulty distributions. Its source notes and `ai_draft` review status are retained. This structural result does not replace a subject-teacher review of individual wording, calculations, and curriculum alignment.

## Android packaging

Create a project checkpoint, then use the project interface’s **Publish** control to generate the downloadable Android APK. Do not manually build the APK in the sandbox.
