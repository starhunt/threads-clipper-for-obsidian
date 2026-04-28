# Architecture (Threads Clipper for Obsidian)

## Goal

Capture user-triggered Threads actions (Like / Bookmark), extract post data, render Markdown, and create a new note inside Obsidian through the built-in Obsidian URI scheme.

## Runtime layers

1. **Content script (`content/content.js`)**
   - Detects Like and Bookmark actions on Threads
   - Extracts post, media, and thread metadata from the DOM
   - Builds Markdown and opens `obsidian://new`
   - Copies note content to the clipboard for Obsidian to consume

2. **Background service worker (`background/service-worker.js`)**
   - Stores user settings
   - Tracks lightweight local usage counters
   - Emits save notifications after the URI flow is prepared

3. **Settings / popup UI (`options/*`, `popup/*`)**
   - Configures vault name and note path rules
   - Exposes trigger toggles and save stats
   - Documents the URI-based save flow clearly

## Data flow

Threads UI action
→ DOM extraction in content script
→ Markdown generation
→ Copy Markdown to clipboard
→ Open `obsidian://new`
→ Obsidian creates the note in the target vault/path
→ Success toast / notification

## Security / privacy boundaries

- No AI processing
- No remote developer backend
- No analytics / tracking
- No Local REST API dependency
- Network access limited to Threads domains and media CDN hosts

## Failure handling

- Clipboard write failure: show a clear error toast
- Invalid extension context: ask the user to reload the page
- Missing vault name: still create the note, but disable precise reopen behavior
