#!/bin/bash
if [ -z "$1" ]; then
  echo "Error: integration name is not provided" >&2
  exit 1
fi
integration=$1

integration_path="integrations/$integration"
# Redirect to a file, not $(): a pipe makes Node's stdout async, truncating large definitions (e.g. slack) on process exit.
integration_def_file=$(mktemp)
trap 'rm -f "$integration_def_file"' EXIT
if ! pnpm bp read --work-dir "$integration_path" --json >"$integration_def_file"; then
  echo "Error: Failed to read integration definition for \"$integration\". Check the integration for TypeScript errors." >&2
  exit 1
fi

category=$(jq -r '.attributes.category // empty' "$integration_def_file")

valid_categories=(
  "AI Models"
  "Business Operations"
  "CRM & Sales"
  "Communication & Channels"
  "Customer Support"
  "Developer Tools"
  "E-commerce & Payments"
  "File Management"
  "Marketing & Email"
  "Other"
  "Project Management"
)

if [ -z "$category" ]; then
  echo "Integration \"$integration\" is missing the \"category\" attribute in its definition file" >&2
  echo "Valid categories are: $(printf '"%s", ' "${valid_categories[@]}" | sed 's/, $//')" >&2
  exit 1
fi

for valid_category in "${valid_categories[@]}"; do
  if [ "$category" = "$valid_category" ]; then
    echo "Integration \"$integration\" has a valid category: \"$category\""
    exit 0
  fi
done

echo "Integration \"$integration\" has an invalid category: \"$category\"" >&2
echo "Valid categories are: $(printf '"%s", ' "${valid_categories[@]}" | sed 's/, $//')" >&2
exit 1
