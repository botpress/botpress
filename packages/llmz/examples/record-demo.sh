#!/bin/bash

set -euo pipefail
cd "$(dirname "$0")"

# Record colors even when the parent shell disables them for automation.
export FORCE_COLOR="${FORCE_COLOR:-1}"
unset NO_COLOR

if [ "$#" -ne 1 ]; then
  echo "Usage: ./record-demo.sh <example folder or two-digit number>" >&2
  exit 1
fi

FOLDER=''
for candidate in [0-9][0-9]_*; do
  if [[ "$candidate" =~ ^[0-9][0-9]_(chat|worker)_[a-z0-9_]+$ ]] && [ -f "$candidate/index.ts" ]; then
    if [ "$candidate" = "$1" ] || [ "${candidate%%_*}" = "$1" ]; then
      FOLDER=$candidate
      break
    fi
  fi
done
if [ -z "$FOLDER" ]; then
  echo "Unknown example: $1. Run pnpm start --list." >&2
  exit 1
fi

for dependency in asciinema node pnpm svg-term; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    echo "Missing required command: $dependency" >&2
    exit 1
  fi
done

CAST_PATH="${FOLDER}/demo.cast"
SVG_PATH="${FOLDER}/demo.svg"

echo "🎬 Recording demo for ${FOLDER}..."
# asciinema 2 records asciicast v2 by default; it has no -f option.
# Hide pnpm's script banner, which includes the local working directory.
asciinema rec "$CAST_PATH" --cols 100 --rows 28 --command "pnpm --silent start ${FOLDER}" --overwrite

echo "📏 Preparing recording..."
DIMENSIONS=$(node - "$CAST_PATH" <<'JS'
const fs = require('node:fs');
const path = process.argv[2];
const [header, ...frames] = fs.readFileSync(path, 'utf8').trim().split('\n').map(JSON.parse);
if (header.version !== 2) throw new Error('svg-term requires an asciicast v2 recording. Use asciinema 2.x.');

// Shorten idle waits while preserving all output and its ordering.
let previousTime = 0;
let playbackTime = 0;
for (const frame of frames) {
  playbackTime += Math.min(Math.max(0, frame[0] - previousTime), 2);
  previousTime = frame[0];
  frame[0] = playbackTime;
}
// Keep the final terminal state visible for four seconds.
frames.push([playbackTime + 4, 'o', '']);
fs.writeFileSync(path, [header, ...frames].map((frame) => JSON.stringify(frame)).join('\n') + '\n');
// Preserve the recorded terminal width; cursor redraws are not new text columns.
process.stdout.write(`${header.width} ${header.height}`);
JS
)

read -r WIDTH HEIGHT <<< "$DIMENSIONS"
echo "🖼 Generating SVG (${WIDTH}×${HEIGHT})..."
# Read dimensions from the cast header. svg-term adds an extra emulator row when
# --height is supplied, which clips the bottom prompt in a full terminal.
svg-term --in "$CAST_PATH" --out "$SVG_PATH" --window --from 0

echo "✅ Saved to:"
echo "  - $CAST_PATH"
echo "  - $SVG_PATH"
