# Chrome Web Store Release Checklist (Threads Clipper for Obsidian)

## 1) Product scope

- [ ] Release scope is core clipping only
- [ ] URI mode is the only save flow in this build
- [ ] No AI provider UX, code path, or permission in manifest
- [ ] No Local REST API dependency in the user flow

## 2) Package readiness

- [ ] `manifest_version` is 3
- [ ] Version is bumped for this submission
- [ ] Permissions are minimal for URI mode: `storage`, `activeTab`, `notifications`, `clipboardWrite`
- [ ] Host permissions are limited to Threads domains and media CDNs
- [ ] Icons exist for 16 / 32 / 48 / 128
- [ ] Name and description match the actual behavior

## 3) Privacy / disclosure

- [ ] Privacy policy is publicly accessible by URL
- [ ] Store data disclosure matches actual behavior
- [ ] State clearly that no plugin or API key is required
- [ ] State clearly that there is no analytics or remote backend

## 4) Store listing assets

- [ ] 128px icon ready
- [ ] At least 3 screenshots prepared
  - [ ] Threads post before clipping
  - [ ] Extension settings page
  - [ ] Saved note in Obsidian
- [ ] Single-purpose short description prepared
- [ ] Detailed description prepared

## 5) Functional QA

- [ ] Fresh install in a clean Chrome profile
- [ ] Save on Like works
- [ ] Save on Bookmark works
- [ ] Obsidian opens through URI successfully
- [ ] Clipboard flow works reliably
- [ ] Year/month folder option behaves correctly
- [ ] Success toast reopens note when vault name is configured

## 6) Packaging / upload

1. Run `./scripts/package-cws.sh`
2. Upload the generated zip to Chrome Web Store Developer Dashboard
3. Fill privacy and data-disclosure sections
4. Submit for review
