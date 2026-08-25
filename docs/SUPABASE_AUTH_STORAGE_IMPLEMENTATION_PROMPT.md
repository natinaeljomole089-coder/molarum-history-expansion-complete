# Molarum Supabase Authentication and Storage Implementation Prompt

## Copy-ready prompt

```text
You are a senior Expo/React Native, TypeScript, and Supabase engineer. Implement optional, production-conscious Supabase authentication, user-scoped data synchronization, and protected storage for the Molarum Grade 10 offline study library.

Context:
- Molarum is an Android-first Expo mobile app with a premium dark student interface.
- Its current 1,960-question / 49-unit Grade 10 bank is bundled and must remain usable without an account or network connection.
- Existing local learner profile, completed quiz attempts, in-progress quiz draft, and imported-question-bank behavior are protected data.
- Never change validated question content, replace imported banks with a bundled bank, or make sign-in mandatory to study offline.

Inputs:
- Supabase project: {{SUPABASE_PROJECT}}
- Authentication methods enabled: {{AUTH_METHODS}}
- Storage bucket name: {{STORAGE_BUCKET}}
- App package and redirect scheme: {{APP_IDENTITY}}
- Existing project files: {{PROJECT_ROOT}}

Required implementation:
1. Inspect the existing local persistence, backend, routing, and Supabase configuration before editing. Reuse compatible working code; do not duplicate providers or auth clients.
2. Add an optional account entry point in Profile. It must clearly explain that offline study works without an account and that sign-in is only for backup and sync.
3. Support the enabled Supabase sign-in methods, secure session persistence on Android, sign-out, loading states, expired sessions, cancellation, and clear error messages. Do not expose service-role or storage secrets to the app.
4. Create a minimal user-scoped sync model for learner profile and quiz attempts. Use upsert-safe writes, server timestamps, deterministic conflict handling, and a visible last-sync status. Preserve local data if sync is unavailable or fails.
5. Create protected storage for user-owned study exports or backup files. Apply row-level security so each authenticated user can access only their own records and storage paths. Validate file name, type, and size on the client and server boundary. Never store the bundled question bank as a user upload.
6. Keep every offline flow functional when there is no connection, when Supabase is unavailable, or when the user is signed out. Queue or defer optional sync rather than blocking quiz navigation, answer submission, results, or resume behavior.
7. Add SQL migration(s), clear setup documentation, and regression tests. Include tests for unauthenticated access, authenticated user isolation, imported-bank protection, offline fallback, failed sync, and storage authorization.
8. Verify TypeScript, linting, tests, the question-bank validator, web export, Android export, and compact Android portrait screens. Repair verified defects before delivery.

Constraints:
- Use TypeScript with strict validation and minimal dependencies.
- Preserve the student-facing Library, Tools, and Profile navigation; do not reintroduce teacher, content-management, or technical-administration screens.
- Do not use placeholder credentials, hard-code secrets, or weaken Supabase row-level security.
- Do not claim a physical Android-device or APK test unless one was actually performed.
- Before any external database mutation or destructive action, state the intended change and preserve existing local data.

Deliverables:
1. A short architecture summary.
2. Exact files changed and database/storage policies added.
3. A validation report with passed checks and remaining device-only limitations.
4. A concise user guide covering sign-in, optional sync, storage use, offline behavior, and sign-out.

Failure behavior:
- If Supabase credentials, enabled auth providers, redirect URLs, or project access are missing, do not fabricate them. Identify the exact missing configuration and provide the smallest safe next step.
- If any sync or storage operation fails, preserve local progress, show an actionable non-technical message, and retain enough diagnostic detail for development logs.
```

## Variables

| Variable | Meaning |
|---|---|
| `{{SUPABASE_PROJECT}}` | The user-owned Supabase project and environment configuration. |
| `{{AUTH_METHODS}}` | The specific provider choices, such as email/password or magic link. |
| `{{STORAGE_BUCKET}}` | A private bucket reserved for user-owned backups or exports. |
| `{{APP_IDENTITY}}` | The Android package, Expo scheme, and approved redirect configuration. |
| `{{PROJECT_ROOT}}` | The Molarum project directory to inspect before implementation. |

## Quality checks

This prompt requires optional authentication, preserved offline study, user-scoped authorization, protected secrets, conflict-safe sync, storage validation, and full app/build verification. It explicitly prevents unsupported account requirements, bundled-bank replacement, and claims of unperformed device testing.
