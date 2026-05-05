#!/bin/bash
mapfile -t sentry_integrations < <(ls integrations/*/.sentryclirc)

filter=""

for sentry_integration in "${sentry_integrations[@]}";
do 
  actual_integration="${sentry_integration//\.sentryclirc/}"
  filter="-F ./$actual_integration $filter"
done

echo "$filter"
