echo "--> Cleaning up old build"
rm -rf lib

echo "--> Transpiling server code and CLI"
npm run compile-server

echo "--> bundling web UI"
node ./webpack.web.js --compile

echo "--> Copying templates"
cp -a ./src/cli/templates lib/cli/
