# Molarum — Grade 10 Offline Study Library

Molarum is an Android-capable Grade 10 revision library with an **offline-first** default. Students can select validated source-grounded units, complete one-question-at-a-time practice quizzes, read immediate explanations, keep optional learner records on their device, and export score history as PDF. An optional Supabase account layer adds explicit cross-device sync and validated shared content without replacing local use.

> **Current state:** Read [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md) for the canonical catalog, offline behavior, validation status, and managed-release boundaries. Older audit and release documents are historical snapshots.

> **Android APK status:** The complete source is available in this private repository, but no APK release asset has been uploaded yet. Use the project workspace’s managed **Publish** action to produce the Android package, then add that downloaded file to the repository’s **Releases** page. See [APK_RELEASE_GUIDE.md](./APK_RELEASE_GUIDE.md) for the exact release and installation path.

## Features

| Area | Current behavior |
|---|---|
| Library and quiz flow | Native Android-ready Library, subject, unit, quiz, and results screens. |
| Content import | JSON banks are validated before activation; rejected files leave the current bank unchanged. |
| Content status | Bundled items remain structurally validated and source-grounded; the legacy `ai_draft` field is retained only for schema compatibility. |
| Learner privacy | Records stay on-device by default. Signed-in users choose when to sync their own records or upload a private report. |
| Exports | User-triggered PDF score-history export and JSON/Markdown content-document exports. |
| Offline behavior | A 1,960-question source-grounded bank is bundled for Chemistry, Physics, Biology, Mathematics, Geography, Citizenship, Economics, Health & PE, and History; local imports can still replace it on a device. |
| Optional Supabase layer | Email accounts, private learner-record sync, validated question-bank publishing, and private source/report storage protected by Row Level Security. |

## Project Handoff

Use [docs/PROJECT_HANDOFF.md](./docs/PROJECT_HANDOFF.md) as the project map for navigation, local persistence, student-product boundaries, validation, and release. The reusable [Molarum question-bank workflow skill](./skills/molarum-question-bank-workflow/SKILL.md) documents the required source, draft, validation, merge, provenance, and release gates for future content expansion.

## Development

```bash
pnpm check
pnpm test
pnpm validate:bank /path/to/complete_question_bank.json
pnpm content:summary
```

## Optional Supabase Cloud Layer

The configured Supabase project uses an Expo-safe Project URL and **publishable** key only. It never uses a service-role key in the APK. The initial teacher email is `natijommar@gmail.com`; the role is assigned at Supabase signup. Before enabling production email confirmation, add the app’s callback scheme (`manus<project-timestamp>://cloud`) to **Supabase Dashboard → Authentication → URL Configuration**. The detailed schema, Row Level Security model, storage policies, and offline-conflict rules are in [`docs/SUPABASE_ARCHITECTURE.md`](./docs/SUPABASE_ARCHITECTURE.md).

## Historical Content Status

> This section is retained as a historical narrative. Use [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md) and `content/manifest.json` for current facts.

Molarum now bundles **1,960 structurally validated, source-grounded questions across 49 units**: six Chemistry, six Physics, six Biology, all seven Mathematics units, all eight Geography units, all eight Citizenship units, Economics Units 1–3, Health & PE Unit 1, and History Units 1–4. Existing packaged installs upgrade safely to the bundled catalog while imported banks remain intact. The external delivery package contains source copies, checksums, reports, accepted continuation units, preserved baseline archives, and merged delivery banks. See [`content/manifest.json`](./content/manifest.json), [`content/pending_subject_source_catalog.json`](./content/pending_subject_source_catalog.json), and [`content/review_issues.md`](./content/review_issues.md).

## Android Delivery

After validation and a saved checkpoint, use the project interface’s **Publish** action to produce the downloadable APK. The Android binary is produced by that managed flow, not manually inside the sandbox.
