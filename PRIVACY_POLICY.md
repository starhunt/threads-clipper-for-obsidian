# Privacy Policy — Threads to Obsidian

Last updated: 2026-03-23

Threads to Obsidian is a Chrome extension that saves Threads posts to your own Obsidian vault through the Obsidian Local REST API.

## What data the extension processes

The extension processes only the data needed to provide its features:

- Threads post content you explicitly trigger via Like/Bookmark
- Post metadata (author handle, URL, timestamp, hashtags/media links)
- Extension settings you enter (vault path settings, API endpoint settings, optional AI provider keys)
- Optional usage counters (local saved count/today count)

## Where data is stored

- Extension settings are stored in Chrome storage (`chrome.storage.sync` / `chrome.storage.local`).
- Notes are written to your own Obsidian vault via your local Obsidian Local REST API.
- The extension does **not** operate a backend server for collection or analytics.

## External network access

The extension may send requests to:

1. Local Obsidian Local REST API (`localhost` / `127.0.0.1`) to save notes and media.
2. Optional AI providers only if AI transformation is enabled by you and configured by you:
   - OpenAI
   - Google Gemini
   - Anthropic
   - xAI (Grok)
   - Z.AI

No requests are sent to AI providers unless you enable AI and provide credentials.

## API keys and secrets

- API keys are stored in your browser storage for extension functionality.
- The developer does not receive, collect, or transmit your API keys to a separate service.
- You are responsible for managing and revoking your own provider keys.

## Data sharing

The extension does not sell or share user data with third parties for advertising or profiling.

## Data retention and deletion

- You can remove extension data by uninstalling the extension and/or clearing extension storage in Chrome.
- Saved notes remain in your Obsidian vault until you delete them.

## Children’s privacy

This extension is not directed to children under 13.

## Contact

GitHub repository issues: https://github.com/starhunt/sns_to_obsidian/issues
