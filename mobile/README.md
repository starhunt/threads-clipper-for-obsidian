# Mobile (iOS) — Threads → Obsidian via Share Sheet

The Chrome extension only runs on desktop. For iOS, this folder contains a
[Scriptable](https://scriptable.app/) script that does the same job through the
iOS share sheet: share a Threads post → script grabs the post's Open Graph
metadata → builds the same kind of Markdown note → opens it in Obsidian Mobile.

> **Why not "tap the heart"?**
> Threads' official API does not expose your likes or bookmarks, and iOS does
> not let third-party scripts hook taps inside another app. Share-sheet is one
> extra tap, but it is the only path that actually works without policy or
> privacy compromises. See the parent repo discussion for the full reasoning.

## What you get

- A Markdown note saved into your chosen folder (default `mobiletip/`) of your
  Obsidian vault, with this frontmatter:
  ```yaml
  ---
  source: threads
  saved_via: mobile-share
  author: "@handle"
  post_url: "https://www.threads.com/@handle/post/..."
  saved_at: "2026-05-31 18:20"
  tags:
    - threads
    - mobiletip
  ---
  ```
- Filename pattern: `@handle_YYYYMMDD_HHmm.md` — matches the desktop extension.
- Post body comes from the page's `og:description` (the public sharing snippet).
  When that's empty (login-gated or rare layout), the note still saves with the
  URL and a placeholder line so you can open the original later.

## Install (one-time)

1. Install **Scriptable** (free) from the App Store.
2. Install **Obsidian Mobile** and open your vault once so iOS knows that vault
   exists. If you use multiple vaults, see the *Vault selection* section below.
3. In Scriptable, tap **+** to create a new script.
4. Copy the entire contents of [`threads-to-obsidian.scriptable.js`](./threads-to-obsidian.scriptable.js)
   and paste them in. Name the script **Threads to Obsidian**, tap ✓.
5. In the script list, tap the **…** corner of the new script:
   - **Script Settings → Show in Share Sheet** → ON
   - **Share Sheet Inputs** → set to `URLs` (so the script only appears for posts)

## Use

In the Threads app:

1. Open a post you want to keep.
2. Tap the share icon → choose **Scriptable** → **Threads to Obsidian**.
3. The script copies the rendered Markdown to your clipboard and opens
   `obsidian://new?…&clipboard=true`. Obsidian Mobile takes over and writes the
   note into the configured folder.

The first time you run it from Obsidian's perspective, iOS may ask whether to
allow Scriptable to open Obsidian — tap **Allow** (and **Always Allow** if
prompted) so future runs are silent.

## Configuration

Edit the `CONFIG` block at the top of `threads-to-obsidian.scriptable.js`:

```js
const CONFIG = {
  folder: "mobiletip",   // subfolder inside the vault, "" for vault root
  vault: "",             // pin a specific vault name, "" = last opened vault
  tags: ["threads", "mobiletip"],
};
```

### Vault selection

- **One vault on mobile** (most users): leave `vault: ""`. The
  `obsidian://new` URI then targets the vault Obsidian opened most recently —
  which is the only one you ever use, so it always wins.
- **Multiple vaults**: set `vault: "YourVaultName"` so the URI always lands in
  the right place no matter which vault you opened last. The name is what
  Obsidian shows in the vault switcher, case-sensitive.

### Folder

Change `folder` to whatever path you want. Nested paths work
(`"clippings/threads"`). Leave empty to drop the file in the vault root.

## Limits and known issues

- **Body source is `og:description`** — that's the public sharing snippet, so
  very long posts may be truncated by Threads itself. The full URL is always
  stored, so you can re-open the original from Obsidian.
- **Login-gated posts** sometimes return only the title, in which case the
  note saves with a placeholder body line and the URL.
- **Images**: only the cover image (`og:image`) is embedded as a remote `![]()`.
  Full image download is desktop-only because iOS Scriptable cannot write into
  the Obsidian vault directly.
- **No comments / no chained-post collection** on mobile — the desktop
  extension reads those from the live DOM, which Scriptable can't do.

## Optional: wrap in iOS Shortcuts

If you'd rather have a custom button labeled "Save to Obsidian" in the share
sheet (instead of going through *Scriptable → script picker*), wrap the call:

1. Shortcuts app → **+** → **Add Action** → search **Run Script**
   (Scriptable).
2. Choose script **Threads to Obsidian**.
3. Toggle **Show in Share Sheet** for the shortcut, accept **URLs** as input.
4. Name the shortcut whatever you want it to look like in the share sheet.

The shortcut then forwards the shared URL to the Scriptable script via
`args.shortcutParameter`, which the script already handles.
