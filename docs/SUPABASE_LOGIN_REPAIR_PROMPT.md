# Molarum Supabase Login Diagnosis and Repair Prompt

## Copy-ready prompt

```text
You are a senior Expo/React Native and Supabase authentication engineer. Diagnose and repair all verified login problems in the Molarum Grade 10 offline study app.

Context:
- Molarum is an Android-first Expo app with optional Supabase email/password accounts.
- Students must always be able to study offline without an account.
- Supabase is used only for optional learner-profile sync and private backup storage.
- Current app code includes a Supabase client, CloudProvider, and Profile account form.
- Local learner profile, quiz attempts, in-progress quiz state, and validated question banks are protected and must never be deleted, overwritten, or blocked by a login error.

Inputs:
- Current project root: {{PROJECT_ROOT}}
- Supabase project and auth configuration: {{SUPABASE_PROJECT}}
- Reported behavior, logs, and screenshots: {{LOGIN_EVIDENCE}}
- Enabled sign-in methods and redirect configuration: {{AUTH_CONFIGURATION}}

Required procedure:
1. Inspect the current Supabase client, Profile login form, CloudProvider, environment configuration, database policies, and recent runtime logs before editing.
2. Reproduce only safe, non-destructive login states: missing fields, invalid email, short password, cancelled submission, unavailable network, expired session, unconfirmed email, wrong password, disabled provider, and server-rendering/static-export paths. Do not create test accounts or send emails unless explicitly authorized.
3. Identify root causes with evidence. Separate app defects from missing Supabase dashboard configuration or user-account actions.
4. Repair validated defects in input validation, submit locking, loading state, error classification, session recovery, secure persistence, sign-out, static rendering, and Profile layout.
5. Use student-friendly messages that explain the next step without exposing secrets, raw database errors, or technical terms. Retain the original detail only in development logs.
6. Preserve optional offline learning at every failure point. A failed login, failed sync, or unavailable Supabase service must never block quizzes, progress saving, results, or resume behavior.
7. Verify that user-scoped RLS and storage rules remain intact. Never weaken policies, embed a service-role key in the app, or use another learner’s data to test isolation.
8. Run TypeScript, lint, tests, question-bank validation, web export, Android export, and compact Profile-screen verification. Repair all newly introduced verified errors.

Constraints:
- Use the current design language and React Native Pressable style patterns.
- Do not make sign-in mandatory.
- Do not change validated quiz content or locally stored learner data.
- Do not claim an email-confirmation, real account, APK, or physical-device test unless it was actually completed.

Required output:
1. Root-cause table: symptom, evidence, classification, repair, and remaining user action.
2. Exact code and Supabase configuration changes.
3. Validation results and any remaining account/device-only checks.
4. A concise student-facing explanation of what to do when login fails.

Failure behavior:
- If the app code is correct but a Supabase provider, confirmation setting, redirect URL, or user credential is missing, do not fabricate a workaround. State the exact dashboard setting or user step required.
- If a test could affect a real account or data, stop and request explicit permission before proceeding.
```

## Variables

| Variable | Meaning |
|---|---|
| `{{PROJECT_ROOT}}` | Molarum project directory to inspect and modify. |
| `{{SUPABASE_PROJECT}}` | Connected Supabase project used for authentication and private backups. |
| `{{LOGIN_EVIDENCE}}` | User observations, logs, screenshots, or reproducible symptoms. |
| `{{AUTH_CONFIGURATION}}` | Enabled providers, confirmation behavior, allowed redirects, and client configuration. |

## Quality checks

The prompt requires evidence-based diagnosis, protects offline access and learner records, separates dashboard configuration from code defects, and prevents unsafe test-account creation, credential exposure, or security-policy weakening.
