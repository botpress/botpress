echo $(cat package.json \
| grep version \
| head -1 \
| awk -F: '{ print $2 }' \
| sed 's/[",]//g' \
| tr -d '[[:space:]]' \
| sed -E "s/^(.+)\.(.+)\.(.+)$/\1.\2/") # takes a complex version (1.2.3) and turns it into (1.2)