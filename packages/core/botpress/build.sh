echo "--> Cleaning up old build"
rm -rf lib
mkdir -p lib/cli/templates

echo "--> Bundling app"
NODE_ENV=production yarn concurrently "node ./webpack.server.js --compile" "node ./webpack.web.js --compile"

echo "--> Copying templates"
cp -a ../../../templates lib/cli/
