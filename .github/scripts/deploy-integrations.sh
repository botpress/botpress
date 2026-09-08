#!/usr/bin/env bash
set -e

if [ "$INPUT_ENVIRONMENT" = "staging" ]; then
  api_url="https://api.botpress.dev"
else
  api_url="https://api.botpress.cloud"
fi

# login

echo "### Logging in to $api_url ###"
pnpm bp login -y --api-url "$api_url" --workspaceId "$CLOUD_OPS_WORKSPACE_ID" --token "$TOKEN_CLOUD_OPS_ACCOUNT"

# deploy

if [ "$INPUT_FORCE" = "true" ]; then
  redeploy=1
else
  redeploy=0
fi

if [ "$INPUT_DRY_RUN" = "true" ]; then
  dryrun="--dryRun"
  is_dry_run=1
else
  dryrun=""
  is_dry_run=0
fi

all_filters="-F '{integrations/*}' $INPUT_EXTRA_FILTER"
list_integrations_cmd="pnpm list $all_filters --json"
integration_paths=$(eval "$list_integrations_cmd" | jq -r 'map(.path) | .[]')

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID must be set}"
: "${GITHUB_EVENT_NAME:?GITHUB_EVENT_NAME must be set}"

if ! workflow_id=$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" --jq '.workflow_id'); then
  echo "Failed to determine the current workflow." >&2
  exit 2
fi

# Select the last successful run for the same deployment stream. Avoid fetching
# the entire workflow history just to discard unrelated pull request/branch runs.
case "$GITHUB_EVENT_NAME" in
  push|workflow_dispatch)
    deployment_event="$GITHUB_EVENT_NAME"
    deployment_branch="${GITHUB_REF#refs/heads/}"
    ;;
  pull_request)
    deployment_event="push"
    deployment_branch="$GITHUB_BASE_REF"
    ;;
  *)
    echo "Unsupported workflow event: $GITHUB_EVENT_NAME" >&2
    exit 2
    ;;
esac

if ! previous_sha=$(gh api -X GET "repos/$GITHUB_REPOSITORY/actions/workflows/$workflow_id/runs" \
  -f status=success \
  -f event="$deployment_event" \
  -f branch="$deployment_branch" \
  -F per_page=1 \
  --jq '.workflow_runs[0].head_sha // ""'); then
  echo "Failed to find previous successful workflow run." >&2
  exit 2
fi

if [ -n "$previous_sha" ] && ! git cat-file -e "$previous_sha^{commit}" 2>/dev/null; then
  if ! git fetch --no-tags origin "$previous_sha"; then
    echo "Failed to fetch the previous workflow commit: $previous_sha" >&2
    exit 2
  fi
fi

integration_changed() {
    local integration=$1
    local previous_sha=$2
    local integration_path="integrations/$integration"

    if [ ! -d "$integration_path" ]; then
        echo "Integration directory does not exist: $integration_path" >&2
        return 2
    fi

    # No previous deployment run means every integration needs deployment.
    if [ -z "$previous_sha" ]; then
        return 0
    fi

    local diff_status
    if git diff --quiet "$previous_sha" HEAD -- "$integration_path"; then
        return 1
    else
        diff_status=$?
    fi

    if [ "$diff_status" -ne 1 ]; then
        echo "Failed to compare $integration_path with $previous_sha." >&2
        return 2
    fi

    return 0
}

deploy_integration() {
    local integration_path=$1
    local integration
    integration=$(basename "$integration_path")
    local base_command="bp deploy -v -y --noBuild --visibility public --allowDeprecated $dryrun"
    local integration_deployed=false

    if integration_changed "$integration" "$previous_sha"; then
        echo -e "\nDeploying integration: ### $integration ###\n"
        pnpm retry -n 2 -- pnpm -F "{integrations/$integration}" -c exec -- "$base_command"
        integration_deployed=true
    else
        local changed_status=$?
        if [ "$changed_status" -ne 1 ]; then
            echo "Failed to determine whether integration $integration changed." >&2
            return "$changed_status"
        elif [ "$redeploy" -eq 1 ]; then
            echo -e "\nRe-deploying integration: ### $integration ###\n"
            pnpm retry -n 2 -- pnpm -F "{integrations/$integration}" -c exec -- "$base_command"
            integration_deployed=true
        else
            echo -e "\nSkipping integration: ### $integration ###\n"
        fi
    fi

    # upload sandbox scripts
    local integration_implements_sandbox
    integration_implements_sandbox=$(./.github/scripts/integration-implements-sandbox.sh "$integration")
    if [ "$integration_implements_sandbox" = "true" ] && [ "$integration_deployed" = "true" ] && [ "$is_dry_run" -eq 0 ]; then
        echo -e "\nUploading integration sandbox scripts\n"
        local base_upload_command="uploadSandboxScripts --apiUrl=$api_url --workspaceId=$CLOUD_OPS_WORKSPACE_ID --token=$TOKEN_CLOUD_OPS_ACCOUNT --userEmail=cloud-ops@botpress.com"
        # shellcheck disable=SC2086 # base_upload_command contains multiple space-separated arguments
        pnpm retry -n 2 -- pnpm -F "{integrations/$integration}" run -- $base_upload_command
    fi

    # deploy shopify app manifest (config-as-code) for the current environment
    local manifest_file="$integration_path/shopify.app.$INPUT_ENVIRONMENT.toml"
    if [ "$integration_deployed" = "true" ] && [ "$is_dry_run" -eq 0 ] && [ -f "$manifest_file" ]; then
        local shopify_token
        case "$integration" in
          shopify-admin)      shopify_token="$SHOPIFY_ADMIN_AUTOMATION_TOKEN" ;;
          shopify-storefront) shopify_token="$SHOPIFY_STOREFRONT_AUTOMATION_TOKEN" ;;
          *)                  shopify_token="" ;;
        esac

        if [ -z "$shopify_token" ]; then
            echo "::warning::Found $manifest_file but no Shopify automation token for $integration - skipping manifest deploy"
        else
            echo -e "\nDeploying Shopify app manifest ($INPUT_ENVIRONMENT): ### $integration ###\n"
            local shopify_deploy_command="pnpm shopify app deploy --config $INPUT_ENVIRONMENT --allow-updates --source-control-url $COMMIT_URL"
            SHOPIFY_APP_AUTOMATION_TOKEN="$shopify_token" \
              pnpm retry -n 2 -- pnpm -F "{integrations/$integration}" -c exec -- "$shopify_deploy_command"
        fi
    fi
}

for integration_path in $integration_paths; do
    deploy_integration "$integration_path"
done
