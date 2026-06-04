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

By default the share sheet shows *Scriptable → script picker → Threads to
Obsidian* — three taps after Share. Wrapping the script in a Shortcut gets
that down to **one tap** with a label of your choice. Recipe takes ~2 minutes.

### Build it (one time)

1. Open the **Shortcuts** app → **+** to create a new shortcut.
2. Tap the search bar at the bottom → search **Run Script** → pick the action
   under the **Scriptable** category (icon is purple/violet). The action lands
   on the canvas as `Run Script Threads to Obsidian` (or similar default).
3. Configure the action:
   - **Script** → tap and pick `Threads to Obsidian`.
   - Tap **Show More** to reveal the rest of the fields.
   - **Texts** → tap the field → from the variable picker choose
     **Shortcut Input**. (Even though the input is a URL, Scriptable's Run
     Script action exposes it through this field; the script also reads
     `args.urls` and `args.shortcutParameter`, so any path works.)
   - **Show When Run** → **OFF** (runs silently — no Scriptable UI flash).
   - **Run Script in App** → **OFF** (stays in Shortcuts, then jumps to
     Obsidian via the URI; switching apps twice feels jankier).
4. Tap the shortcut's name field at the top → rename to whatever you want to
   see in the share sheet, e.g. **Threads → Obsidian**.
5. Tap the **ⓘ** (info) button:
   - **Show in Share Sheet** → **ON**.
   - **Share Sheet Types** → keep only **URLs** (uncheck Images, Text, etc.)
     so the shortcut doesn't clutter share menus from other apps.
6. Tap **Done**.

### Use it

In Threads: tap a post → share icon → **Threads → Obsidian**. That's it. The
Shortcut forwards the URL to the Scriptable script, the script copies the
rendered Markdown to your clipboard and opens
`obsidian://new?…&clipboard=true`, and Obsidian Mobile creates the note in
your configured folder.

### Tips

- iOS may ask once whether to **Allow** the shortcut to open Obsidian. Tap
  **Always Allow** so future runs are silent.
- If you ever rename the Scriptable script, also re-pick it inside the
  Shortcut — Shortcuts stores the link by name.
- You can stack more actions on top of `Run Script` if you want to chain
  behavior (e.g. log to a separate file, show a haptic confirmation). The
  Scriptable action returns control to Shortcuts before opening Obsidian, so
  follow-up actions run as expected.
