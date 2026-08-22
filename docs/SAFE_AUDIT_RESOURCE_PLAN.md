# Safe Audit Resource Plan

**Date:** 2026-08-22  
**Scope:** Read-only project audit and reproducible verification of the existing Molarum source project. No publication, APK upload, remote push, local-data deletion, active-bank reset, or question-content modification is authorized by this plan.

## Decision

The audited project already contains the tooling required for the planned source, storage, validation, and managed-bundle checks. Therefore, **no new dependency, package, repository, binary, emulator image, Android SDK component, asset, or test fixture will be downloaded or installed** for this audit.

| Resource | Version or source | License | Purpose | Compatibility and security note | Status |
|---|---|---|---|---|---|
| Project-local Expo CLI | Expo SDK 54.0.29 via `expo` | MIT (Expo repository) | Resolve managed configuration and create static web/Android bundles | Already pinned in the project; no new install required | Existing; verified usable |
| Project-local TypeScript | 5.9.x via `typescript` | Apache-2.0 | Static type check | Existing pinned development dependency | Existing; verified usable |
| Project-local Vitest | 2.1.9 | MIT | Unit and integration-style storage validation | Existing pinned development dependency | Existing; verified usable |
| Project-local ESLint / Expo lint | ESLint 9.39.x / eslint-config-expo 10.0.x | MIT | Static linting | Existing pinned development dependencies | Existing; verified usable |
| Existing managed build configuration | `app.config.ts` | Project source | Inspect Android package, intent filter, and configured permissions | No native Android source tree is committed; managed configuration is authoritative in this workspace | Existing; verified usable |

## Excluded resources

No Android emulator, APK decoder, UI automation framework, accessibility scanner, native Android SDK component, or external repository is proposed. These tools would not provide reliable physical-device confirmation in this sandbox and would add install and supply-chain surface without resolving the documented device-only checks.

## External documentation sources

No external documentation was downloaded or executed for this audit. The project-local Expo mobile guidance and installed project tooling are sufficient for the selected checks. If a future device-build investigation requires an additional resource, it must be added to this table with its official URL, version, license, compatibility assessment, and verification result **before** installation.
