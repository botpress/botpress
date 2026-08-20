#!/bin/bash

# Enforce major-only integration versioning in CI.

integration=$1

if [ -z "$integration" ]; then
  echo "Integration name is not provided."
  exit 1
fi

integration_def=$(pnpm bp read --work-dir "integrations/$integration" --json)
name=$(echo "$integration_def" | jq -r '.name')
version=$(echo "$integration_def" | jq -r '.version')
# Do not mistake API, authentication, or parsing failures for a new integration.
if ! integrations_json=$(pnpm bp integrations ls --name "$name" --json); then
  echo "Failed to list deployed versions for integration $integration."
  exit 1
fi

if ! public_versions=$(jq -r '.[] | select(.public) | .version' <<< "$integrations_json"); then
  echo "Failed to parse deployed versions for integration $integration."
  exit 1
fi

latest_version=$(printf '%s\n' "$public_versions" | sort -V | tail -1)

if ! [[ "$version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "Integration $integration has invalid version $version."
  exit 1
fi

major=${BASH_REMATCH[1]}
minor=${BASH_REMATCH[2]}
patch=${BASH_REMATCH[3]}

# New integrations must start at a major boundary.
if [ -z "$latest_version" ]; then
  if [ "$minor" -ne 0 ] || [ "$patch" -ne 0 ]; then
    echo "New integration $integration must start at x.0.0, not $version."
    exit 1
  fi
  exit 0
fi

# Non-breaking changes keep their current version.
if [ "$version" = "$latest_version" ]; then
  exit 0
fi

latest_major=${latest_version%%.*}

# Breaking changes move to the next major and reset minor/patch.
if [ "$major" -eq $((latest_major + 1)) ] && [ "$minor" -eq 0 ] && [ "$patch" -eq 0 ]; then
  exit 0
fi

# Minor/patch bumps, skipped majors, and downgrades are rejected.
echo "Keep $latest_version for a non-breaking change, or use $((latest_major + 1)).0.0 for a breaking change."
exit 1
