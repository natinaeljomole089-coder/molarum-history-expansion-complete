# Managed Android Release Checklist

Use this checklist only after a validated project checkpoint exists. Do not claim an Android artifact exists until the managed workspace produces it.

## Before Publish

- [ ] Confirm `version` and the intended Android version-code policy.
- [ ] Confirm whether retaining `com.app.molarum` is required for upgrade continuity. Do not change the package ID without owner approval.
- [ ] Run `pnpm check`, `pnpm lint`, `pnpm test`, and `pnpm validate:bank assets/question-banks/grade10-source-grounded-bank.json`.
- [ ] Run `npx expo config --type public --json` and record app name, version, package ID, scheme, and permissions.
- [ ] Run web and Android JavaScript exports.
- [ ] Confirm that `content/manifest.json`, `content/review_issues.md`, and `docs/CURRENT_STATE.md` agree on catalog facts.

## Managed artifact

- [ ] Select **Publish** in the managed project workspace.
- [ ] Download the produced artifact and identify whether it is an APK for direct installation or an AAB for store delivery.
- [ ] Record filename, SHA-256 checksum, package ID, version, and build timestamp.
- [ ] Do not treat a JavaScript export as an APK or AAB.

## Device checks

- [ ] Test clean installation on an Android device.
- [ ] Test upgrade installation if an earlier build with the same package ID exists.
- [ ] Disable network, cold-launch the app, and start a quiz.
- [ ] Start a timed quiz, terminate/relaunch the app, and verify safe resume or explicit stale-session recovery.
- [ ] Check system bars, compact devices, and large system-font settings.
- [ ] Confirm local attempts persist and imported banks remain protected.

## Private GitHub release

- [ ] Create a semantic tag such as `v1.0.3` only after the artifact is verified.
- [ ] Upload the verified APK asset and a matching SHA-256 text file.
- [ ] State artifact type, package ID, version, checksum, installation steps, known limitations, and device-test scope in release notes.
- [ ] Keep the release private and share it only with authorized testers.
