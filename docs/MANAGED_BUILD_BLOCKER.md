# Managed Android Build Blocker

## Current limitation

This environment can validate Expo configuration and generate JavaScript exports, but it is not the authoritative Android APK or AAB builder for Molarum. It cannot truthfully claim a package artifact, installation result, or physical-device result.

## Required owner action

Open the latest Molarum checkpoint in the project workspace and select **Publish**. Wait for the managed build to complete, then download the produced artifact.

## Checks after download

1. Identify whether the download is an APK or AAB.
2. Calculate and save a SHA-256 checksum.
3. Verify the package ID, version, and Android version code with an Android artifact inspector or installation metadata.
4. Perform the device checklist in `RELEASE_CHECKLIST.md`.
5. Ask for explicit approval before uploading any artifact to a GitHub Release.
