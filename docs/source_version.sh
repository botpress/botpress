PACKAGE_VERSION=$(cat ../package.json \
| grep version \
| head -1 \
| awk -F: '{ print $2 }' \
| sed 's/[",]//g' \
| tr -d '[[:space:]]')

echo "baseurl: \"$PACKAGE_VERSION\"" > _config.prod.yml
