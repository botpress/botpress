#!/usr/bin/env bash

# Exit 0 when an integration changed since the supplied deployment commit;
# exit 1 when it did not change.

set -euo pipefail

if [ "$#" -ne 2 ] || [ -z "$1" ]; then
  echo "Usage: $0 <integration-name> <deployment-sha>" >&2
  exit 2
fi

integration=$1
previous_sha=$2
integration_path="integrations/$integration"

if [ ! -d "$integration_path" ]; then
  echo "Integration directory does not exist: $integration_path" >&2
  exit 2
fi

# No previous deployment run means every integration needs deployment.
if [ -z "$previous_sha" ]; then
  echo "true"
  exit 0
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
