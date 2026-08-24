# Changelog

## 2026-08-24 — QA repair pass

Repaired the clean-clone static web export path by switching NativeWind to virtual CSS modules. Hardened quiz hydration and resume behavior, normalized dynamic route parameters, made result calculations defensive, and aligned the unit screen’s controls with saved-session semantics. Corrected numeric unit ordering, unique-unit dashboard progress, and subject-specific header icons. Added regression coverage for multi-digit unit ordering and made the optional Supabase connectivity test skip when its private runtime configuration is absent. See [`BUGS.md`](./BUGS.md) for the complete defect and retest record.
