# Molarum Optional Supabase Architecture

## Purpose and operating mode

Supabase adds an **optional cloud layer** to Molarum. A learner can continue using the bundled question bank, local attempts, local profile, and local review cache without creating an account or having a network connection. When a learner chooses to sign in, their device uploads a compact copy of their score attempts and can retrieve their own records on another signed-in device.

> Cloud synchronization is additive. It must never block a quiz, remove local content, or imply that unsynced local data has been backed up.

## Authentication and roles

Molarum uses Supabase email/password authentication. A PostgreSQL trigger creates a profile and role record after account creation. The email `natijommar@gmail.com` receives the initial `teacher` role; all other new accounts receive the `learner` role. The mobile client uses the Supabase project URL and a **publishable** key only. No service-role or secret key is ever bundled into the APK.

| Role | Permitted cloud actions |
|---|---|
| Learner | Read the active shared question bank and review states; create, read, update, and delete only their own score attempts and reports. |
| Teacher | All learner permissions plus publish/replace question-bank versions, maintain cloud review states, and upload/download private source files. |
| Anonymous user | No database or file-storage access. Local-only app features continue to work without an account. |

## Tables and storage buckets

| Resource | Purpose | Access rule |
|---|---|---|
| `molarum_profiles` | Optional learner profile details. | Owner only. |
| `molarum_roles` | Server-managed `learner` or `teacher` role. | A user may read only their own role; client writes are prohibited. |
| `molarum_attempts` | Idempotent cloud mirror of local completed quizzes. | Owner only, keyed by user and local attempt ID. |
| `molarum_question_banks` | Versioned, structurally validated JSON bank payloads. | Teachers write; authenticated users read active version only. |
| `molarum_review_states` | Teacher-managed cloud question-status overlays. | Teachers write; authenticated users read. |
| `molarum-source-materials` | Private source PDFs and excerpts. | Teachers only. |
| `molarum-learner-reports` | Private generated PDF reports. | The user may access only files under their own UUID path. |

## Sync and conflict rules

The device remains the first write location. Signed-in attempts are upserted by `(user_id, local_attempt_id)` and an `updated_at` timestamp. A failed upload remains marked local/pending and is retried only through a user-triggered sync action; automatic background syncing is not assumed. Profile fields use the latest explicit user save. The active bank and teacher review states are download-only for learners; a teacher uses an explicit publish action.

## Security controls

All application tables have Row Level Security enabled. Role checks use a security-definer helper that reads the server-managed role table. The initial teacher role is assigned only inside the signup trigger and cannot be chosen by a user-controlled metadata field. The source bucket is private, while the reports bucket requires the first path segment to match `auth.uid()`. These rules are applied by the migration in `supabase/migrations/20260822_molarum_cloud_layer.sql`.

## Mobile configuration

The Android application needs exactly two public runtime values:

| Variable | Where to obtain it | Safe in APK? |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Connect → Mobile / Project URL. | Yes. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Settings → API Keys → Publishable key. | Yes, with RLS enabled. |

Never place a Supabase `service_role` or `sb_secret_…` key in `app.config.ts`, an Expo public variable, a mobile bundle, a Git repository, or a client-side screen.

## One Supabase Dashboard step

In **Authentication → URL Configuration** of the Supabase Dashboard, add the Android callback displayed by the application scheme, in the form `manus<project-timestamp>://cloud`, to the allowed redirect URLs. Molarum passes this callback during email signup and exchanges the returned authorization code for the mobile session. Keep email confirmation enabled for production; this prevents a new account from becoming a verified sync account until its mailbox is confirmed.
