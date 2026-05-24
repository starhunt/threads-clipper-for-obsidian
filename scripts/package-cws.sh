#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/release"
VERSION=$(node -e 'console.log(require(process.argv[1]).version)' "$ROOT_DIR/manifest.json")
OUT_ZIP="$OUT_DIR/threads-clipper-for-obsidian-cws-v${VERSION}.zip"

mkdir -p "$OUT_DIR"

# Basic preflight
node -e 'const m=require(process.argv[1]); if(m.manifest_version!==3) { throw new Error("manifest_version must be 3"); } console.log("manifest ok:", m.version);' "$ROOT_DIR/manifest.json"

# Ensure key docs exist for store submission (referenced from the listing form, not bundled)
for f in PRIVACY_POLICY.md CWS_RELEASE_CHECKLIST.md LICENSE; do
  [[ -f "$ROOT_DIR/$f" ]] || { echo "missing required file: $f"; exit 1; }
done

# Build zip with only runtime files. Anything not needed at runtime
# (docs, dev scripts, local tooling) is excluded so we don't ship personal config.
cd "$ROOT_DIR"
rm -f "$OUT_ZIP"
zip -r "$OUT_ZIP" \
  manifest.json \
  background/ \
  content/ \
  popup/ \
  options/ \
  shared/ \
  _locales/ \
  assets/ \
  LICENSE \
  -x "*.DS_Store" \
  >/dev/null

ls -lh "$OUT_ZIP"
echo "done: $OUT_ZIP"
