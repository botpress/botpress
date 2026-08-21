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

for integration_path in $integration_paths; do
    integration=$(basename "$integration_path")

    base_command="bp deploy -v -y --noBuild --visibility public --allowDeprecated $dryrun"

    integration_deployed=false
    if bash ./.github/scripts/integration-changed.sh "$integration"; then
        echo -e "\nDeploying integration: ### $integration ###\n"
        pnpm retry -n 2 -- pnpm -F "{integrations/$integration}" -c exec -- "$base_command"
        integration_deployed=true
    else
        changed_status=$?
        if [ "$changed_status" -ne 1 ]; then
            echo "Failed to determine whether integration $integration changed." >&2
            exit "$changed_status"
        elif [ "$redeploy" -eq 1 ]; then
            echo -e "\nRe-deploying integration: ### $integration ###\n"
            pnpm retry -n 2 -- pnpm -F "{integrations/$integration}" -c exec -- "$base_command"
            integration_deployed=true
        else
            echo -e "\nSkipping integration: ### $integration ###\n"
        fi
    fi

    # upload sandbox scripts
    integration_implements_sandbox=$(./.github/scripts/integration-implements-sandbox.sh "$integration")
    if [ "$integration_implements_sandbox" = "true" ] && [ "$integration_deployed" = "true" ] && [ "$is_dry_run" -eq 0 ]; then
        echo -e "\nUploading integration sandbox scripts\n"
        base_upload_command="uploadSandboxScripts --apiUrl=$api_url --workspaceId=$CLOUD_OPS_WORKSPACE_ID --token=$TOKEN_CLOUD_OPS_ACCOUNT --userEmail=cloud-ops@botpress.com"
        # shellcheck disable=SC2086 # base_upload_command contains multiple space-separated arguments
        pnpm retry -n 2 -- pnpm -F "{integrations/$integration}" run -- $base_upload_command
    fi

    # deploy shopify app manifest (config-as-code) for the current environment
    manifest_file="$integration_path/shopify.app.$INPUT_ENVIRONMENT.toml"
    if [ "$integration_deployed" = "true" ] && [ "$is_dry_run" -eq 0 ] && [ -f "$manifest_file" ]; then
        case "$integration" in
          shopify-admin)      shopify_token="$SHOPIFY_ADMIN_AUTOMATION_TOKEN" ;;
          shopify-storefront) shopify_token="$SHOPIFY_STOREFRONT_AUTOMATION_TOKEN" ;;
          *)                  shopify_token="" ;;
        esac

        if [ -z "$shopify_token" ]; then
            echo "::warning::Found $manifest_file but no Shopify automation token for $integration - skipping manifest deploy"
        else
            echo -e "\nDeploying Shopify app manifest ($INPUT_ENVIRONMENT): ### $integration ###\n"
            shopify_deploy_command="pnpm shopify app deploy --config $INPUT_ENVIRONMENT --allow-updates --source-control-url $COMMIT_URL"
            SHOPIFY_APP_AUTOMATION_TOKEN="$shopify_token" \
              pnpm retry -n 2 -- pnpm -F "{integrations/$integration}" -c exec -- "$shopify_deploy_command"
        fi
    fi
done
