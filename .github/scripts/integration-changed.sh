#!/usr/bin/env bash

# Exit 0 when an integration changed since the most recent successful, non-PR
# run of this workflow; exit 1 when it did not change.

set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "$1" ]; then
  echo "Usage: $0 <integration-name>" >&2
  exit 2
fi

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID must be set}"

integration=$1
integration_path="integrations/$integration"

if [ ! -d "$integration_path" ]; then
  echo "Integration directory does not exist: $integration_path" >&2
  exit 2
fi

if ! workflow_id=$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" --jq '.workflow_id'); then
  echo "Failed to determine the current workflow." >&2
  exit 2
fi

if ! previous_runs=$(gh api --paginate --slurp "repos/$GITHUB_REPOSITORY/actions/workflows/$workflow_id/runs?status=success&per_page=100"); then
  echo "Failed to find previous successful workflow runs." >&2
  exit 2
fi

if ! previous_sha=$(jq -r '[.[] | .workflow_runs[] | select(.event != "pull_request")][0].head_sha' <<< "$previous_runs"); then
  echo "Failed to parse previous successful workflow runs." >&2
  exit 2
fi

# No previous deployment run means every integration is new to this workflow.
if [ -z "$previous_sha" ] || [ "$previous_sha" = "null" ]; then
  echo "true"
  exit 0
fi

if ! git cat-file -e "$previous_sha^{commit}" 2>/dev/null; then
  if ! git fetch --no-tags origin "$previous_sha"; then
    echo "Failed to fetch the previous workflow commit: $previous_sha" >&2
    exit 2
  fi
fi

if git diff --quiet "$previous_sha" HEAD -- "$integration_path"; then
  echo "false"
  exit 1
else
  diff_status=$?
fi

if [ "$diff_status" -ne 1 ]; then
  echo "Failed to compare $integration_path with $previous_sha." >&2
  exit 2
fi

echo "true"
