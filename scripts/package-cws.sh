#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/release"
VERSION=$(node -e 'console.log(require(process.argv[1]).version)' "$ROOT_DIR/manifest.json")
OUT_ZIP="$OUT_DIR/threads-clipper-for-obsidian-cws-v${VERSION}.zip"

mkdir -p "$OUT_DIR"

node -e '
const m = require(process.argv[1]);
if (m.manifest_version !== 3) throw new Error("manifest_version must be 3");
if ((m.host_permissions || []).some(p => /localhost|127\.0\.0\.1|openai|anthropic|googleapis|x\.ai|z\.ai/.test(p))) throw new Error("release build must not include localhost or AI hosts");
if (!(m.permissions || []).includes("clipboardWrite")) throw new Error("URI release must include clipboardWrite permission");
console.log("manifest ok:", m.version);
' "$ROOT_DIR/manifest.json"

for f in PRIVACY_POLICY.md CWS_RELEASE_CHECKLIST.md LICENSE README.md README.ko.md; do
  [[ -f "$ROOT_DIR/$f" ]] || { echo "missing required file: $f"; exit 1; }
done

cd "$ROOT_DIR"
zip -r "$OUT_ZIP" .   -x "*.git*"   -x "node_modules/*"   -x "release/*"   -x "*.DS_Store" >/dev/null

ls -lh "$OUT_ZIP"
echo "done: $OUT_ZIP"
