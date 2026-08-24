# Android Release Asset Guide

The repository contains the complete Molarum source snapshot. It does **not** contain an APK yet because Android packages must be created through the managed **Publish** flow in the project workspace rather than by building an APK in this environment.

## Add the APK after Publish

1. Open the latest project checkpoint in the workspace and select **Publish**.
2. Wait for the managed Android build to finish, then download the produced APK from the workspace.
3. Open the repository’s **Releases** page, choose **Draft a new release**, and upload the downloaded APK as a release asset.
4. Use a clear tag such as `v1.0.3`, add release notes, and publish the release when you are ready to share it with authorized testers.

The repository is private, so only invited collaborators can access its code and release assets.
