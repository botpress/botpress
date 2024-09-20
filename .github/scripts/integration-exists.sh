if [ -z "$1" ]; then
  echo "Error: integration name is not provided" >&2 
  exit 1
fi
integration=$1
            
integration_path="integrations/$integration"
integration_def=$(pnpm bp read --work-dir $integration_path --json)

name=$(echo $integration_def | jq -r ".name")
version=$(echo $integration_def | jq -r ".version")

exists=$(pnpm bp integrations ls --name $name --version-number $version --json | jq '[ .[] | select(.public) ] | length') # 0 if not exists
echo $exists
