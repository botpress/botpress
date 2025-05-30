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

echo "🖼  Generating SVG..."
svg-term --in "$CAST_PATH" --out "$SVG_PATH" --window --width 100 --height 30 --from 500

echo "✅ Done! Saved to:"
echo "  - $CAST_PATH"
echo "  - $SVG_PATH"
