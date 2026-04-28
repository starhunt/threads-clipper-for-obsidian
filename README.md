# Threads Clipper for Obsidian

A Chrome extension that saves [Threads](https://www.threads.net) posts to [Obsidian](https://obsidian.md) when you **like** or **bookmark** them.

## Scope of this release

This release is intentionally focused on the simplest possible clipping workflow:

- Save on **Like**
- Save on **Bookmark**
- Save to Obsidian through **Obsidian URI**
- No plugin setup required
- Optional year/month folder organization

Not included in this release:

- AI transformation
- External AI providers
- Obsidian Local REST API dependency
- Local media file download into the vault
- Analytics or tracking

## Prerequisite

You only need Obsidian installed on your computer.

This release uses the built-in **Obsidian URI** scheme (`obsidian://new`) to create notes.

## Installation

### Chrome Web Store

Coming soon.

### Manual install

1. Download or clone this repository
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select this folder

## Usage

1. Open `threads.net` or `threads.com`
2. Like or bookmark a post
3. The extension copies the note content and opens Obsidian to create the note automatically

## What gets saved

- Author handle and display name
- Post URL
- Post timestamp
- Main post text
- Thread continuation posts (when detected)
- Quote / repost structure (best effort)
- Media links

## Notes about URI mode

- No community plugin is required
- The note body is passed through the clipboard to Obsidian
- Images remain as external links in this release
- If a vault name is configured, the success toast can reopen the note in Obsidian

## Default note format

```markdown
---
source: threads
type: single
author: "@username"
author_name: "Display Name"
post_url: "https://www.threads.net/@username/post/..."
saved_at: "2026. 04. 28. 15:00"
post_date: "2026. 04. 28. 14:55"
tags:
  - threads
---

# @username's post

## 📋 Post Info
...

## 📝 Content
> Original post text
```

## Privacy

- Settings are stored in Chrome storage
- No API key or local REST API setup is required in this release
- No analytics, telemetry, ads, or third-party tracking
- Network requests are limited to Threads domains and media CDNs used by Threads content

## Packaging

```bash
./scripts/package-cws.sh
```

Output:
- `release/threads-clipper-for-obsidian-cws-v<version>.zip`

## Architecture

See `spec/architecture.md`.

## License

MIT License
