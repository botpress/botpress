echo "--> Cleaning up old build"
rm -rf lib
mkdir -p lib/cli/templates

echo "--> Bundling app"
node webpack.js --compile

echo "--> Copying templates"
cp -a src/cli/templates lib/cli/templates