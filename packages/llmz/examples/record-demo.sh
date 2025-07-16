#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: ./record-demo.sh <example_folder>"
  exit 1
fi

FOLDER=$1
CAST_PATH="${FOLDER}/demo.cast"
SVG_PATH="${FOLDER}/demo.svg"

echo "🎬 Recording demo for ${FOLDER}..."
asciinema rec "$CAST_PATH" --command "pnpm start ${FOLDER}" --overwrite

echo "🛠  Appending trailing empty frame..."
node -e "
const fs = require('fs');
const path = '$CAST_PATH';
const lines = fs.readFileSync(path, 'utf8').split('\n').filter(Boolean);

const header = JSON.parse(lines[0]);
const frames = lines.slice(1).map(JSON.parse);

const lastTime = frames.at(-1)?.[0] ?? 0;
frames.push([lastTime + 5, '']);

// Write everything back
fs.writeFileSync(path, [JSON.stringify(header), ...frames.map(f => JSON.stringify(f))].join('\n') + '\n');
"

echo "📏 Calculating max width..."
MAX_WIDTH=$(node -e "
const fs = require('fs');
const stripAnsi = s => s.replace(
  /\\u001b\\[[0-9;?]*[a-zA-Z]|\\u001b\\][^\u0007]*(\u0007|$)/g, ''
);
const lines = fs.readFileSync('$CAST_PATH', 'utf8').split('\n').filter(Boolean).slice(1);
let max = 0;
for (const line of lines) {
  try {
    const arr = JSON.parse(line);
    if (arr[1] === 'o') {
      const cleaned = stripAnsi(arr[2]);
      for (const l of cleaned.split('\n')) {
        if (l.length > max) max = l.length;
      }
    }
  } catch {}
}
console.log(Math.min(150, Math.max(max || 100, 80)));
")

echo "🖼  Generating SVG (width=$MAX_WIDTH)..."

echo "🖼  Generating SVG..."
svg-term --in "$CAST_PATH" --out "$SVG_PATH" --window --width "$MAX_WIDTH" --height 30 --from 500

echo "✅ Done! Saved to:"
echo "  - $CAST_PATH"
echo "  - $SVG_PATH"
