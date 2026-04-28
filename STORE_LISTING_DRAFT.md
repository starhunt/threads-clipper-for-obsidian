# Chrome Web Store Listing Draft — Threads Clipper for Obsidian

## Extension name

Threads Clipper for Obsidian

## Category

Productivity

## Short description

Send liked or bookmarked Threads posts straight to Obsidian with no plugin setup.

## Detailed description

Threads Clipper for Obsidian saves Threads posts into Obsidian the moment you like or bookmark them.

Built for Obsidian users who collect ideas, references, and thread-based writing, this release keeps the workflow intentionally simple:

- Save on Like
- Save on Bookmark
- Create notes through Obsidian URI
- No plugin setup required
- Organize notes into year/month folders automatically

### What it saves

- Author handle and display name
- Post URL
- Post timestamp
- Main post text
- Thread continuation posts when detected
- Quote / repost structure when detectable
- Media links

### What this release does not do

- No AI transformation
- No Local REST API plugin dependency
- No remote backend
- No analytics or tracking
- No third-party data sharing

### Requirements

You need:
1. Obsidian installed
2. Obsidian URI support available on the device
3. Obsidian running for the smoothest note creation flow

## Suggested screenshots

1. Threads post before clicking Like / Save
2. Extension settings page
3. Saved note shown inside Obsidian

## Privacy disclosure notes

### User data processed

- Website content: Threads post content explicitly triggered by the user
- User activity: Like / bookmark action as the save trigger
- User-provided settings: vault name and note path settings

### Not collected / not sold

- No sale of personal data
- No ad targeting
- No analytics SDK
- No remote developer-owned storage

## Reviewer notes

This extension is single-purpose and local-first.

- It runs only on Threads domains.
- It creates notes through the local `obsidian://` URI handler on the user's device.
- No plugin or API key is required in this release.
- No data is sent to external AI services or remote application servers.
