// Threads → Obsidian (Scriptable, iOS)
// ------------------------------------------------------------------
// Save Threads posts to your Obsidian vault from the iOS share sheet.
//
// Why share-sheet and not "tap-the-heart"? Threads' official API does not
// expose your likes/bookmarks, iOS does not let third-party scripts hook
// taps inside another app, and Android accessibility hooks are policy
// landmines. The share-sheet path is one extra tap but it actually works.
//
// Install:
//   1. Install Scriptable (free) from the App Store.
//   2. Open Scriptable → "+" → paste this whole file → name it
//      "Threads to Obsidian" → ✓.
//   3. In the script's "..." settings, enable "Show in Share Sheet" and
//      restrict input to "URLs" so the share sheet shows it only for posts.
//   4. (Optional) Edit the CONFIG block below — change the target folder,
//      pin a specific vault, or change the auto-attached tags.
//   5. Make sure Obsidian Mobile is installed and your vault is open at
//      least once so iOS knows which vault the obsidian:// URI belongs to.
//
// Use:
//   In Threads → tap a post's share button → Scriptable → "Threads to
//   Obsidian". Obsidian Mobile opens with the new note already created in
//   the configured folder.
// ------------------------------------------------------------------

// ---------- CONFIG ----------
const CONFIG = {
  // Subfolder inside your Obsidian vault. Leave empty ("") to save at vault root.
  folder: "mobiletip",
  // Specific vault name, or "" to use the vault Obsidian last opened
  // (the simplest setup when you only use one vault on mobile).
  vault: "",
  // Tags auto-attached in the note frontmatter.
  tags: ["threads", "mobiletip"],
};
// ----------------------------

await main();

async function main() {
  const SOURCE_URL = pickShareUrl();
  if (!SOURCE_URL || !/threads\.(net|com)\/@/.test(SOURCE_URL)) {
    await notify("Threads URL을 찾지 못했습니다.\n공유 시트에서 Threads 게시글을 선택해 주세요.");
    Script.complete();
    return;
  }

  const { author } = parseUrl(SOURCE_URL);

  let meta = { title: "", description: "", image: "" };
  try {
    meta = await fetchMeta(SOURCE_URL);
  } catch (e) {
    // Network failure shouldn't block — we still save a URL-only note as fallback.
    console.warn("fetch failed: " + e);
  }

  const now = new Date();
  const filename = buildFilename(author, now);
  const md = buildMarkdown({ author, url: SOURCE_URL, now, meta });

  // Same clipboard pattern as the desktop extension's URI mode — keeps very
  // long bodies safe from URL-length limits.
  Pasteboard.copyString(md);

  const file = (CONFIG.folder ? CONFIG.folder + "/" : "") + filename.replace(/\.md$/, "");
  const params = new URLSearchParams();
  if (CONFIG.vault) params.set("vault", CONFIG.vault);
  params.set("file", file);
  params.set("clipboard", "true");
  params.set("overwrite", "true");
  const uri = `obsidian://new?${params.toString()}`;

  Safari.open(uri);
  Script.complete();
}

// ---------- helpers ----------

function pickShareUrl() {
  // 1) URL-typed share input
  if (args.urls && args.urls.length) {
    const u = args.urls.find((u) => /threads\.(net|com)\/@/.test(u));
    if (u) return u;
    return args.urls[0];
  }
  // 2) Plain-text share input (some apps share the URL as text)
  if (args.plainTexts && args.plainTexts.length) {
    for (const t of args.plainTexts) {
      const m = t.match(/https?:\/\/(?:www\.)?threads\.(?:net|com)\/[^\s"']+/);
      if (m) return m[0];
    }
  }
  // 3) Shortcut input (e.g. invoked from iOS Shortcuts wrapper)
  if (args.shortcutParameter) return String(args.shortcutParameter);
  // 4) Last resort — current clipboard
  const clip = Pasteboard.paste();
  if (clip && /threads\.(net|com)\/@/.test(clip)) return clip.trim();
  return null;
}

function parseUrl(url) {
  const m = url.match(/threads\.(?:net|com)\/@([^\/?#]+)\/post\/([^\/?#]+)/);
  return { author: m ? m[1] : "unknown", postId: m ? m[2] : "" };
}

async function fetchMeta(url) {
  const req = new Request(url);
  // A mobile Safari UA gets Threads' SSR Open Graph block reliably.
  req.headers = {
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
  };
  req.timeoutInterval = 15;
  const html = await req.loadString();
  return {
    title: pickMeta(html, "og:title"),
    description: pickMeta(html, "og:description"),
    image: pickMeta(html, "og:image"),
  };
}

function pickMeta(html, key) {
  const k = escapeReg(key);
  // <meta property="og:..." content="...">
  let m = html.match(new RegExp(`<meta\\s+(?:property|name)=["']${k}["']\\s+content=["']([^"']*)["']`, "i"));
  if (m) return decodeEntities(m[1]);
  // <meta content="..." property="og:...">
  m = html.match(new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+(?:property|name)=["']${k}["']`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

function pad2(n) { return String(n).padStart(2, "0"); }

function buildFilename(author, date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const safeAuthor = (author || "unknown").replace(/[\\/:*?"<>|]/g, "_").slice(0, 40);
  return `@${safeAuthor}_${y}${m}${d}_${hh}${mm}.md`;
}

function buildMarkdown({ author, url, now, meta }) {
  const seoul = now.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const yamlEscape = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const tagsBlock = ["tags:"].concat(CONFIG.tags.map((t) => `  - ${t}`)).join("\n");

  let body;
  if (meta.description && meta.description.trim()) {
    body = meta.description.split("\n").map((l) => "> " + l).join("\n");
  } else {
    body = "> (본문을 가져오지 못했어요. 원문 링크에서 확인하세요.)";
  }
  const image = meta.image ? `\n\n![cover](${meta.image})` : "";

  return [
    "---",
    "source: threads",
    "saved_via: mobile-share",
    `author: "@${yamlEscape(author)}"`,
    `post_url: "${yamlEscape(url)}"`,
    `saved_at: "${seoul}"`,
    tagsBlock,
    "---",
    "",
    `# Threads — @${author}`,
    "",
    `[원문 보기](${url})`,
    "",
    body + image,
    "",
  ].join("\n");
}

async function notify(msg) {
  const n = new Notification();
  n.title = "Threads → Obsidian";
  n.body = msg;
  await n.schedule();
}
