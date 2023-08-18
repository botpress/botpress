sentry_integrations=( $(ls integrations/*/.sentryclirc) )

filter=""

for sentry_integration in "${sentry_integrations[@]}";
do 
  actual_integration=$(echo $sentry_integration | sed 's/\.sentryclirc//g')
  filter="-F ./$actual_integration $filter"
done

echo $filter
