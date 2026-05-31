# Privacy Policy — Threads Clipper for Obsidian

**Last updated:** 2026-05-31
**Extension:** Threads Clipper for Obsidian (Chrome Web Store ID: `jhcffdbojaagahlehckadedkmeomdhim`)
**Publisher:** Starhunter (open-source project; source code at <https://github.com/starhunt/threads-clipper-for-obsidian>)

Threads Clipper for Obsidian ("the extension") is a Chrome extension that lets you save Threads posts to your own Obsidian vault. The extension runs entirely on your own machine and against services you choose. **The publisher does not operate any backend server, analytics endpoint, or telemetry pipeline.** This policy explains, in compliance with Chrome Web Store program policies, exactly what user data the extension *collects*, *processes*, *stores*, and *shares*.

---

## 1. Data we collect

The extension collects only the data that is necessary to perform the features you explicitly trigger. The table below enumerates every category and the exact items that fall into each.

| Chrome data category | Collected? | Items | When |
|---|---|---|---|
| Personally identifiable information (name, address, email, age, identification number) | **No** | — | — |
| Health information | **No** | — | — |
| Financial and payment information | **No** | — | — |
| Authentication information | **Yes** | (a) Optional API key for the Obsidian Local REST API plugin you install on your own machine; (b) optional API keys for AI providers you configure (OpenAI, Google Gemini, Anthropic, xAI/Grok, Z.AI, or a custom/local endpoint). | Only when you enter them in the Options page. |
| Personal communications (emails, SMS, chats) | **No** | — | — |
| Location | **No** | — | — |
| Web history | **No** | — | — |
| User activity (clicks, scrolling, mouse position, keystrokes, etc.) | **No** | — | The extension reacts only to your Like or Bookmark click on a Threads post and does not log clickstream, dwell time, scroll position, or any other behavioral signal. |
| Website content (text, images, sounds, videos, hyperlinks of the sites you visit) | **Yes** | The textual content, attached image/video URLs, author handle, post URL, timestamp, hashtags, and (if you enable the option) replies of the specific Threads post you triggered. | Only at the moment you trigger Like or Bookmark on that post; nothing is read from any other site. |

The extension does **not** sell user data, does **not** transfer user data for purposes unrelated to the single purpose stated in the Chrome Web Store listing, and does **not** transfer user data to determine creditworthiness or for lending purposes.

---

## 2. How we use the data (processing)

Each item collected above is used only for the corresponding feature you have enabled:

- **Threads post content** → assembled into a Markdown note (with optional AI summarization in your chosen format) and written to your Obsidian vault. Not analyzed, indexed, or retained anywhere else.
- **Obsidian REST API key** → attached as the `Authorization: Bearer …` header on local HTTP requests to your Obsidian Local REST API plugin so the note can be written into your vault.
- **AI provider API keys** → attached as the appropriate authentication header on the HTTP request to the single AI provider you selected, so it can return the transformed text.
- **Extension settings** (folder paths, format toggles, language, etc.) → used solely to render the Options/Popup UI and to control how notes are formatted and where they are saved.
- **Local usage counters** (`savedPosts`, `todayPosts`) → displayed back to you in the popup so you can see how many posts you have clipped. Never sent off-device.

We do **not** use any collected data for advertising, profiling, training models, A/B testing, or any purpose beyond the immediate save action you triggered.

---

## 3. How and where we store the data (storage)

| Item | Storage location | Survives uninstall? |
|---|---|---|
| Extension settings (incl. API keys, folder paths, AI provider config, language) | `chrome.storage.sync` (Chrome's built-in API). If you are signed in to Chrome with Sync enabled, Chrome will synchronize this data across your other Chrome installations through your Google account, encrypted in transit by Google. The publisher never receives a copy. | No — removed by Chrome when the extension is uninstalled. |
| Local usage counters (`savedPosts`, `todayPosts`, `lastDate`) | `chrome.storage.local` (this browser profile only, not synced) | No — removed by Chrome when the extension is uninstalled. |
| Saved Threads notes (Markdown) and downloaded images | Inside your own Obsidian vault (a folder on your own filesystem that you chose) | **Yes** — these are your files. Deleting the extension does not touch them; you delete them like any other file. |
| Server-side logs, analytics, crash reports | **None.** The publisher operates no server, no analytics, no crash reporting. | n/a |

The extension does **not** write any data to disk outside Chrome's own extension storage and your own Obsidian vault.

---

## 4. How and with whom we share the data (sharing)

The publisher does **not** share, sell, rent, or otherwise transfer any user data to third parties for advertising, profiling, or marketing purposes. The only situations in which data leaves your browser are described below, and each one happens **only because you configured it and triggered it**:

| Recipient | What is sent | Purpose | Triggered by | Network endpoint |
|---|---|---|---|---|
| Your local Obsidian instance (Local REST API plugin running on your own machine) | The Markdown note and optionally the image bytes for the post you saved | Writing the file into your vault | Saving a post while "REST API" save method is configured | `http(s)://localhost` or `http(s)://127.0.0.1` on the port you specified |
| Instagram/Facebook image CDNs (`*.cdninstagram.com`, `*.fbcdn.net`) | Standard HTTP GET for the image URL that Threads itself returned in the post HTML | Downloading the post image so it can be saved into your vault — only when "Download Images Locally" is enabled and you are in REST mode | Saving a post with image download enabled | The image URL as returned by Threads |
| AI provider of your choice — OpenAI (`api.openai.com`), Google Gemini (`generativelanguage.googleapis.com`), Anthropic (`api.anthropic.com`), xAI/Grok (`api.x.ai`), Z.AI (`api.z.ai`), or a custom/local endpoint you typed in | The textual content, author handle, and topic of the Threads post you are saving, together with the API key you stored and the prompt template you configured. Comments and image bytes are **not** sent. | Generating the AI-transformed Markdown body and title | Saving a post while "Enable AI Transformation" is on AND the chosen provider has a key configured | The provider's official HTTPS API endpoint, or the custom endpoint URL you entered |

If AI transformation is disabled, **no** request is ever made to any AI provider. If REST mode is not used, **no** request is ever made to `localhost`. If image download is disabled, **no** request is ever made to CDN hosts.

These third parties operate under their own privacy policies; this extension does not control how they handle the request beyond sending the minimum data described above. Review the policy of any provider you choose to enable.

---

## 5. Permissions and the data each one touches

For full transparency, here is what each permission declared in `manifest.json` enables and which data it touches.

| Permission | Why it is requested | Data touched |
|---|---|---|
| `storage` | Persisting extension settings and local usage counters | The items listed in section 3 |
| `notifications` | Showing a desktop notification after a successful save (optional, toggleable) | Just the filename of the just-saved note |
| `clipboardWrite` | Writing the generated Markdown to your clipboard so that the `obsidian://new` URI can hand it to Obsidian when URI save mode is selected | The Markdown body of the post you just triggered |
| `host_permissions: https://www.threads.net/*`, `https://www.threads.com/*` | Reading the post the user clicked Like/Bookmark on | The post content, author, timestamp, and media URLs of that specific post |
| `host_permissions: http(s)://localhost/*`, `http(s)://127.0.0.1/*` | Talking to the local Obsidian REST API plugin running on your own computer | The note body and image bytes you save |
| `host_permissions: https://*.cdninstagram.com/*`, `https://*.fbcdn.net/*` | Downloading the post's image bytes (Threads itself serves them from these CDNs) | Just the image URLs returned by Threads |
| `optional_host_permissions: https://api.openai.com/*`, `https://generativelanguage.googleapis.com/*`, `https://api.anthropic.com/*`, `https://api.x.ai/*`, `https://api.z.ai/*` | Sending the post content to the AI provider you chose, only when AI transformation is on. Optional — Chrome asks for your consent the first time. | Post text + your API key for that provider |

The extension does **not** request `tabs`, `activeTab`, `scripting`, `webRequest`, `webNavigation`, `cookies`, `history`, `bookmarks`, `downloads`, `<all_urls>`, or any other permission beyond the list above.

---

## 6. Data retention and your controls

- **Settings & counters in Chrome storage**: kept until you change them in the Options page, click **Restore Defaults**, or uninstall the extension. Uninstalling removes them automatically.
- **Notes & images in your Obsidian vault**: kept until you delete them yourself in the file system — the extension does not track or revisit them.
- **API keys**: you can remove them at any time by clearing the corresponding field in the Options page and clicking Save. We recommend that you also revoke the key on the provider's dashboard if you no longer want it used.
- **Disabling network features**: turn off **Enable AI Transformation** to stop all calls to AI providers; turn off **Download Images Locally** to stop image CDN calls; switch save method to **Obsidian URI** to stop calls to `localhost`.
- **Right to access / delete**: because all data lives in your own browser storage and your own vault, you already have full access to it and can delete it at any time without contacting the publisher. There is no server-side dataset to access or erase.

---

## 7. Children

The extension is not directed to children under 13 and we do not knowingly collect data from children under 13. (As noted above, the extension does not knowingly collect personal data from anyone.)

---

## 8. Changes to this policy

If we make material changes to this policy we will update the "Last updated" date at the top of this document and publish the new version at the same URL. Because the file is versioned in the public GitHub repository linked above, you can review the full edit history at any time.

---

## 9. Contact

Questions, requests, or reports about this policy or about the extension's data handling:

- **GitHub Issues** (preferred): <https://github.com/starhunt/threads-clipper-for-obsidian/issues>
- **Email**: starhunt@gmail.com

We aim to respond within a reasonable timeframe; because this is an open-source project maintained by an individual, please use GitHub Issues whenever possible so that other users can benefit from the discussion.
