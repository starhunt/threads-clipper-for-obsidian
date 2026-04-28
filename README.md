# Threads to Obsidian

**[한국어](README.ko.md)**

A Chrome extension that automatically saves [Threads](https://www.threads.net) posts to [Obsidian](https://obsidian.md) as structured Markdown notes.

## Features

- **Auto-save on Like/Bookmark** — posts are captured the moment you like or bookmark them
- **Markdown conversion** — posts become Obsidian-compatible Markdown with YAML frontmatter
- **Image download** — attached images saved locally to your vault (optional)
- **AI transformation** — summarize, analyze, and restructure posts using AI (optional)
- **Dynamic folder paths** — auto-organize notes by year/month
- **Topic & tag extraction** — automatic subject and hashtag detection
- **Multi-post support** — single posts, threads, reposts, quotes, and carousels

## Prerequisites

> **This extension requires the Obsidian Local REST API plugin. Without it, the extension cannot communicate with your vault.**

### Step 1: Install the Obsidian Local REST API Plugin

1. Open Obsidian
2. Go to **Settings** > **Community Plugins**
3. If not already done, turn off **Restricted Mode** to enable community plugins
4. Click **Browse** and search for **"Local REST API"**
5. Click **Install**, then **Enable**

### Step 2: Configure the Plugin

1. In Obsidian, go to **Settings** > **Community Plugins** > **Local REST API**
2. Note the **port number** (default: `27123`)
3. (Recommended) Set an **API Key** for authentication
4. Ensure the **HTTPS** option matches your preference:
   - `HTTP` (default) — works out of the box for local use
   - `HTTPS` — if enabled, you may need to accept the self-signed certificate by visiting `https://localhost:27123` in your browser once

### Step 3: Verify the API is Running

Open your browser and visit:

```
http://localhost:27123
```

If you see a JSON response or the API documentation page, the plugin is running correctly. If you set an API Key, the browser may prompt for authentication.

> **Important**: Obsidian must be open and the Local REST API plugin must be enabled for the extension to save notes.

## Installation

### Chrome Web Store

*(Coming soon)*

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer Mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select this folder
5. The extension icon will appear in your toolbar

## Setup

1. Click the extension icon > **Settings**
2. Enter the Local REST API connection info:
   - Protocol: `HTTP` or `HTTPS`
   - Host: `localhost` (default)
   - Port: `27123` (default)
   - API Key (if configured in the plugin)
3. Click **Connection Test** to verify
4. Configure save paths and options
5. (Optional) Enable AI transformation and configure an AI provider

## Usage

1. Visit [threads.net](https://www.threads.net)
2. **Like** or **Bookmark** any post you want to save
3. The post is automatically saved to your Obsidian vault

> **Note**: Only the initial activation triggers a save. Unliking or unbookmarking does **not** save the post.

## AI Transformation (Optional)

When enabled, AI analyzes posts and generates structured notes with:

- **Executive Summary** — key message in one sentence + 3 main points
- **Key Concepts** — extracted terms in a table
- **Detailed Notes** — expanded analysis with context
- **Action Items** — actionable checklist
- **Feynman Explanation** — simplified explanation for easy understanding

### Supported AI Providers

| Provider | Default Model | Notes |
|----------|---------------|-------|
| OpenAI | gpt-4o | |
| Google Gemini | gemini-2.0-flash | |
| Anthropic | claude-3-5-sonnet | |
| Grok (xAI) | grok-3 | |
| zai | GLM-4.5 | Custom endpoint |
| Custom | — | Any OpenAI-compatible API |

- Per-provider API Key, model, and endpoint configuration
- **Connection Test** button per provider
- Custom prompt template support

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| Trigger (Like) | Save on like | On |
| Trigger (Bookmark) | Save on bookmark | On |
| Notes folder | Save path in vault | `Threads` |
| Year/Month folders | Auto-create subfolders (e.g. `Threads/2026/03`) | Off |
| Download images | Save images locally | Off |
| Image folder mode | Centralized / Per-note subfolder | Centralized |
| AI transformation | AI-powered content conversion | Off |

## Saved Note Format

### Default Format

```markdown
---
source: threads
type: single
author: "@username"
post_url: "https://threads.net/..."
saved_at: "2026. 03. 23. 14:30"
tags:
  - threads
---

# @username's post

> Post content here

---
*Original: [View on Threads](https://threads.net/...)*
```

### AI-Transformed Format

```markdown
---
source: threads
type: single
author: "@username"
topic: "topic name"
post_url: "https://threads.net/..."
saved_at: "2026. 03. 23. 14:30"
tags:
  - threads
  - topic
---

## 1. Executive Summary
...

## 2. Key Concepts
| Term | Description | Context |
...

## 3. Detailed Notes
...

## 4. Action Items
- [ ] ...

## 5. Feynman Explanation
...

## 6. Original Text
> ...
```

## Project Structure

```
sns_to_obsidian/
├── manifest.json              # Extension manifest (MV3)
├── background/
│   ├── service-worker.js      # Background service worker
│   └── ai-service.js          # AI API call module
├── content/
│   ├── content.js             # Content script (DOM detection & extraction)
│   └── styles.css             # Toast notification styles
├── popup/
│   ├── popup.html / js / css  # Popup UI
├── options/
│   ├── options.html / js / css # Settings page
└── assets/icons/              # Extension icons (PNG + SVG)
```

## Privacy

- All data is stored locally in Chrome storage
- API keys are stored only in your browser, never sent to any third-party server (except the configured AI provider)
- No analytics, tracking, or data collection
- The extension only activates on `threads.net` / `threads.com`

## Release Packaging

Build a Chrome Web Store zip with preflight checks:

```bash
./scripts/package-cws.sh
```

Output:
- `release/sns_to_obsidian-cws-v<version>.zip`

## Architecture Notes

- See `spec/architecture.md` for component boundaries and data flow.

## License

MIT License
