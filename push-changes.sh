cd `dirname $0`
./node_modules/.bin/lerna bootstrap
./node_modules/.bin/lerna run compile
./node_modules/.bin/lerna publish --force-publish=* --npm-tag=beta --conventional-commits
