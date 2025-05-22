if [ -z "$1" ]; then
  echo "Error: integration name is not provided" >&2
  exit 1
fi

integration=$1
integration_path="integrations/$integration"
integration_def=$(pnpm bp read --work-dir $integration_path --json)

has_sandbox=false
sandbox_script="$integration_path/sandboxIdentifierExtract.vrl"
if [ -f "$sandbox_script" ]; then
  has_sandbox=true
fi

echo $has_sandbox
