#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR" || exit 1

check_one() {
  local dir="$1"
  local out
  if ! out=$(cd "$dir" && pnpm --package=typescript@6.0.3 dlx tsc --noEmit --ignoreDeprecations 6.0 2>&1); then
    echo "FAIL: $dir"
    echo "$out"
    return 1
  fi
}
export -f check_one

pnpm exec turbo run check:type --dry=json 2>/dev/null \
  | grep '"directory"' | sed 's/.*"directory": *"\(.*\)".*/\1/' \
  | xargs -P 6 -I{} bash -c 'check_one "$@"' _ {}
