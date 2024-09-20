if [ -z "$1" ]; then
  echo "Error: interface name is not provided" >&2 
  exit 1
fi
interface=$1

interface_path="interfaces/$interface"
interface_def=$(pnpm bp read --work-dir $interface_path --json)

name=$(echo $interface_def | jq -r ".name")
version=$(echo $interface_def | jq -r ".version")

command="pnpm bp interfaces get \"$name@$version\" --json"
exists=$(eval $command && echo 1 || echo 0) 
echo $exists
