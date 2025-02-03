if [ -z "$1" ]; then
  echo "Error: plugin name is not provided" >&2 
  exit 1
fi
plugin=$1

plugin_path="plugins/$plugin"
plugin_def=$(pnpm bp read --work-dir $plugin_path --json)

name=$(echo $plugin_def | jq -r ".name")
version=$(echo $plugin_def | jq -r ".version")

command="pnpm bp plugins get \"$name@$version\" --json >/dev/null 2>&1"
exists=$(eval $command && echo 1 || echo 0) 
echo $exists
