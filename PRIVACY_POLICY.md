# Privacy Policy — Threads Clipper for Obsidian

Last updated: 2026-04-28

Threads Clipper for Obsidian is a Chrome extension that prepares Threads posts as notes and sends them into your local Obsidian app through the Obsidian URI scheme.

## What data the extension processes

The extension processes only the data needed to provide the clipping feature:

- Threads post content that you explicitly trigger by Like or Bookmark
- Post metadata such as author handle, URL, timestamp, hashtags, and media links
- Extension settings such as vault name and note path preferences
- Optional local usage counters such as total saved posts and today's saved posts

## Where data is stored

- Extension settings are stored in Chrome extension storage on your device
- Saved counters are stored in local extension storage on your device
- Notes are created inside your own Obsidian vault through the `obsidian://new` URI flow
- The extension does not operate any backend server for analytics or collection

## External network access

The extension sends requests only to:

1. Threads domains (`threads.net`, `threads.com`) where the extension runs
2. Threads media CDNs referenced by post content
3. The local Obsidian application via the `obsidian://` URI handler on your device

The extension does not send data to AI providers, local REST API servers, ad networks, analytics services, or remote developer-controlled servers.

## Data sharing

The extension does not sell, transfer, or use personal data for advertising, profiling, or analytics.

## Data retention and deletion

- You can remove extension data by uninstalling the extension or clearing extension storage in Chrome
- Saved notes remain in your Obsidian vault until you remove them there

## Contact

GitHub repository issues: https://github.com/starhunt/sns_to_obsidian/issues
