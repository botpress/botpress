cd `dirname $0`
./node_modules/.bin/lerna bootstrap
./node_modules/.bin/lerna run compile
