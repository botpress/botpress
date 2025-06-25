if [ -z "$1" ]; then
  echo "❌ Error: item name is not provided" >&2
  exit 1
fi
item=$1

if [ -z "$2" ]; then
  echo "❌ Error: field name is not provided" >&2
  exit 1
fi
field=$2

current_token=$(op item get "$item" --format json | jq -r ".fields[] | select(.label == \"$field\").value")
if [ -z "$current_token" ]; then
  echo "❌ Error: Failed to retrieve current token from 1Password" >&2
  exit 1
fi

refresh_result=$(pnpm -F 'instagram' exec -- pnpm run --silent refreshTokens --json --instagramRefreshToken "$current_token")
new_token=$(echo "$refresh_result" | jq -r '.refreshedToken')
if [ -z "$new_token" ]; then
  echo "❌ Error: Failed to refresh token" >&2
  exit 1
fi

echo "$refresh_result" | jq -r '.message'

op item edit "$item" "$field=$new_token" > /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to update token in 1Password" >&2
  exit 1
fi

echo "✅ Tokens refreshed successfully"