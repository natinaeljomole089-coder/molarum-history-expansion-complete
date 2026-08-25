# Changelog

## 2026-08-24 — Android readiness and runtime hardening

Repaired the clean-clone static web export path by switching NativeWind to virtual CSS modules. Hardened quiz hydration and resume behavior, normalized dynamic route parameters, made result calculations defensive, aligned unit controls with saved-session semantics, corrected numeric unit ordering, counted unique-unit dashboard progress, and used subject-specific header icons.

The local repair also hardened persisted-state parsing against malformed records, prevented cross-unit or malformed quiz resumes, and made final quiz result persistence read the current answer count and timer. Added regression coverage for scoring, resume integrity, and multi-digit unit ordering. The optional Supabase connectivity test now skips when its private runtime configuration is absent and remains active when both documented public variables are configured.

Verification completed: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, strict packaged-bank validation, `npx expo export --platform web`, and `npx expo export --platform android`. The repository still does not contain a physical APK; managed Publish and Android device checks remain outstanding. See [`BUGS.md`](./BUGS.md) for the defect and retest record.
