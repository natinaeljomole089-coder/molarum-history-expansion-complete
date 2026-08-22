# Molarum — Grade 10 Offline Study Library

Molarum is an Android-capable Grade 10 revision library with an **offline-first** default. Students can select validated source-grounded units, complete one-question-at-a-time practice quizzes, read immediate explanations, keep optional learner records on their device, and export score history as PDF. An optional Supabase account layer adds explicit cross-device sync and teacher-managed content without replacing local use.

## Features

| Area | Current behavior |
|---|---|
| Library and quiz flow | Native Android-ready Library, subject, unit, quiz, and results screens. |
| Content import | JSON banks are validated before activation; rejected files leave the current bank unchanged. |
| Teacher review | Local Draft, Approved, and Hidden overlays; source item status remains `ai_draft`. |
| Learner privacy | Records stay on-device by default. Signed-in users choose when to sync their own records or upload a private report. |
| Exports | User-triggered PDF score-history export and JSON/Markdown content-document exports. |
| Offline behavior | A 720-question source-grounded bank is bundled with the app for Chemistry, Physics, and Biology; local imports can still replace it on a device. |
| Optional Supabase layer | Email accounts, private learner-record sync, teacher question-bank/review publishing, and private source/report storage protected by Row Level Security. |

## Development

```bash
pnpm check
pnpm test
pnpm validate:bank /path/to/complete_question_bank.json
```

## Optional Supabase Cloud Layer

The configured Supabase project uses an Expo-safe Project URL and **publishable** key only. It never uses a service-role key in the APK. The initial teacher email is `natijommar@gmail.com`; the role is assigned at Supabase signup. Before enabling production email confirmation, add the app’s callback scheme (`manus<project-timestamp>://cloud`) to **Supabase Dashboard → Authentication → URL Configuration**. The detailed schema, Row Level Security model, storage policies, and offline-conflict rules are in [`docs/SUPABASE_ARCHITECTURE.md`](./docs/SUPABASE_ARCHITECTURE.md).

## Content Status

Molarum now bundles 720 structurally validated, source-grounded questions across six Chemistry, six Physics, and six Biology units. Every item retains the `ai_draft` status and the in-app **Teacher review recommended** label. Mathematics, Geography, Citizenship, Economics, and Health & PE remain unresolved until their source-grounded banks are added. See [`content/manifest.json`](./content/manifest.json) and [`content/review_issues.md`](./content/review_issues.md).

## Android Delivery

After validation and a saved checkpoint, use the project interface’s **Publish** action to produce the downloadable APK. The Android binary is produced by that managed flow, not manually inside the sandbox.
