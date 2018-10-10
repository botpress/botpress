echo $(cat package.json \
| grep version \
| head -1 \
| awk -F: '{ print $2 }' \
| sed 's/[",]//g' \
| sed 's/.,_//g' \
| sed 's/\./_/g' \
| tr -d '[[:space:]]')