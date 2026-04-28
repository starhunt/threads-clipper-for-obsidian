# Chrome Web Store Release Checklist (Threads to Obsidian)

## 1) Package readiness

- [ ] `manifest_version` is 3
- [ ] Version bumped for this submission (`1.3.2` or newer)
- [ ] No broad wildcard host permission (avoid `https://*/*`)
- [ ] Icons exist and load: 16 / 32 / 48 / 128
- [ ] Extension name/description match actual behavior

## 2) Policy readiness

- [ ] Privacy policy URL prepared and publicly accessible
  - Suggested: publish `PRIVACY_POLICY.md` on GitHub Pages or docs site
- [ ] Data disclosure in Chrome Web Store form matches actual behavior
  - Data processed: user-triggered post content + user settings
  - No sale of data
  - No ad/tracking SDK

## 3) Store listing assets

- [ ] Single-purpose description
- [ ] 128 icon (already in extension)
- [ ] Screenshots (recommended: popup, options page, Threads save result in Obsidian)
  - Recommended size: 1280x800 (consistent ratio for review upload)
- [ ] Promotional images (optional)

## 4) Functional QA before upload

- [ ] Fresh install in a new Chrome profile
- [ ] Save on Like works
- [ ] Save on Bookmark works
- [ ] Connection test to Obsidian works
- [ ] Error message appears when Obsidian API unavailable
- [ ] Optional AI mode works only when enabled + key provided

## 5) Upload process

1. Zip extension root files (excluding `.git`, docs not needed for runtime)
2. Upload zip in Chrome Web Store Developer Dashboard
3. Fill listing and privacy fields
4. Submit for review

## Notes for this release

- Removed broad optional host wildcard to reduce review risk.
- Restricted `web_accessible_resources.matches` from `<all_urls>` to Threads domains.
