# Architecture (Threads to Obsidian)

## Goal
Capture user-triggered Threads interactions (Like/Bookmark), extract post data, transform to Markdown (optional AI), and save into Obsidian via Local REST API.

## Runtime Layers

1. **Content layer (`content/content.js`)**
   - Detects Threads UI events and extracts post/thread metadata.
   - Sends normalized payload to background worker.

2. **Orchestration layer (`background/service-worker.js`)**
   - Receives save jobs from content scripts.
   - Applies settings, path templates, and dedupe logic.
   - Calls AI service (optional) and Obsidian API.

3. **AI integration layer (`background/ai-service.js`)**
   - Provider-specific API handling (OpenAI/Gemini/Anthropic/Grok/Z.AI/Custom).
   - Only active when AI mode is enabled by user.

4. **Settings/UI layer (`options/*`, `popup/*`)**
   - Connection test for Local REST API.
   - Provider setup and prompt template configuration.

## Data Flow

Threads Event -> Content Extraction -> Background Job ->
(Option A) Markdown Render -> Obsidian Write
(Option B) AI Transform -> Markdown Render -> Obsidian Write

## Security/Privacy Boundaries

- No analytics/tracking SDK.
- API keys stored in browser storage only.
- Network calls restricted to Threads + local Obsidian + selected AI provider endpoints.
- Save actions are user-triggered (Like/Bookmark), not passive scraping.

## Failure Handling

- Obsidian unavailable: show clear toast/error and skip write.
- AI provider failure: fallback to non-AI markdown save if possible.
- Invalid settings: block save with actionable message.
