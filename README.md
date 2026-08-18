# Molarum — Grade 10 Offline Study Library

Molarum is a local-only, Android-capable Grade 10 revision library. Students can select validated source-grounded units, complete one-question-at-a-time practice quizzes, read immediate explanations, keep optional learner records on their device, and export score history as PDF. It is a revision tool only; it does not provide formal assessment content.

## Features

| Area | Current behavior |
|---|---|
| Library and quiz flow | Native Android-ready Library, subject, unit, quiz, and results screens. |
| Content import | JSON banks are validated before activation; rejected files leave the current bank unchanged. |
| Teacher review | Local Draft, Approved, and Hidden overlays; source item status remains `ai_draft`. |
| Learner privacy | Name, class, school, attempts, review state, and banks are stored only on the device. |
| Exports | User-triggered PDF score-history export and JSON/Markdown content-document exports. |
| Offline behavior | After a bank is imported, the app retains the local data for later use. It makes no claim that source content is offline-ready before a validated bank is present. |

## Development

```bash
pnpm check
pnpm test
pnpm validate:bank /path/to/complete_question_bank.json
```

## Content Status

All eight listed subjects currently have zero validated units because no owner-provided source package was available in this workspace. See [`content/manifest.json`](./content/manifest.json) and [`content/review_issues.md`](./content/review_issues.md).

## Android Delivery

After validation and a saved checkpoint, use the project interface’s **Publish** action to produce the downloadable APK. The Android binary is produced by that managed flow, not manually inside the sandbox.
