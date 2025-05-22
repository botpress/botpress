if [ -z "$1" ]; then
  echo "Error: integration name is not provided" >&2
  exit 1
fi

integration=$1
integration_path="integrations/$integration"
integration_def=$(pnpm bp read --work-dir $integration_path --json)

has_sandbox=false
sandbox_config=$(echo "$integration_def" | jq -r ".configurations.sandbox")
sandbox_script="$integration_path/sandboxIdentifierExtractScript.vrl"

if [ "$sandbox_config" != "null" ] && [ "$sandbox_config" != "" ] && [ -f "$sandbox_script" ]; then
  has_sandbox=true
fi

echo $has_sandbox
