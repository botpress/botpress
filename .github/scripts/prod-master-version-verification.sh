#!/usr/bin/env bash

# Report integrations that changed on master after the latest successful
# production deployment workflow run.

set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"

SKIP_INTEGRATIONS=("chat" "docusign")
production_workflow="deploy-integrations-production.yml"

if ! deployed_sha=$(gh api --paginate --slurp "repos/$GITHUB_REPOSITORY/actions/workflows/$production_workflow/runs?status=success&per_page=100" --jq '[.[] | .workflow_runs[]][0].head_sha'); then
  echo "Failed to find successful production deployment workflow runs." >&2
  exit 2
fi

if [ -z "$deployed_sha" ] || [ "$deployed_sha" = "null" ]; then
  echo "No successful production deployment workflow run was found." >&2
  exit 2
fi

if ! git cat-file -e "$deployed_sha^{commit}" 2>/dev/null; then
  if ! git fetch --no-tags origin "$deployed_sha"; then
    echo "Failed to fetch the latest production deployment commit: $deployed_sha" >&2
    exit 2
  fi
fi

echo "Comparing master with the latest production deployment commit: $deployed_sha"

integrations=$(find integrations -mindepth 1 -maxdepth 1 -type d -print0 | xargs -0 -n1 basename | sort -u)
should_fail=0
outdated_integrations=""
skipped_integrations=""

for integration in $integrations; do
  skip=0
  for skip_integration in "${SKIP_INTEGRATIONS[@]}"; do
    if [ "$integration" = "$skip_integration" ]; then
      echo "Skipping $integration"
      skip=1
      skipped_integrations="$skipped_integrations> $integration\n"
      break
    fi
  done

  if [ "$skip" -eq 1 ]; then
    continue
  fi

  if git diff --quiet "$deployed_sha" HEAD -- "integrations/$integration"; then
    continue
  else
    diff_status=$?
  fi

  if [ "$diff_status" -ne 1 ]; then
    echo "Failed to compare integrations/$integration with $deployed_sha." >&2
    exit 2
  fi

  echo "Integration $integration changed since its latest production deployment."
  should_fail=1
  outdated_integrations="$outdated_integrations> $integration\n"
done

if [ "$should_fail" -eq 1 ]; then
  message="\n\nThe following integrations need to be deployed:\n$outdated_integrations"
  message="$message\nThe following integrations were skipped:\n$skipped_integrations"
  message="$message\nPlease run the production deployment workflow for the listed integrations in ${SERVER_URL}/${REPO}"

  echo -e "\n\nSending curl request to Slack webhook"
  echo "Response:"
  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "key": "prod-master-version-verification",
      "text": "'"$message"'"
    }'
  echo -e "\nCurl request sent"

  echo -e "$message"
  exit 1
fi
