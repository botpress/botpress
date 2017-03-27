emails_tpl="extensions/enterprise/pro/emails/templates"

echo "Cleaning old build"
rm -rf lib/


echo "Bundling app..."
node webpack.js --compile

echo "Copying templates"
mkdir -p lib/cli/templates
cp -a src/cli/templates/. lib/cli/templates
