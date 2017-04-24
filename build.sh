emails_tpl="extensions/enterprise/pro/emails/templates"

echo "Cleaning old build"
rm -rf lib/

if [ "$BOTPRESS_EDITION" == "pro" ] || [ "$BOTPRESS_EDITION" == "ultimate" ]
then
  echo "Copying email templates"
  mkdir -p lib/emails/templates
  cp -a "$emails_tpl/." lib/emails/templates
fi

echo "Bundling app..."
node webpack.js --compile

echo "Copying templates"
mkdir -p lib/cli/templates
cp -a src/cli/templates/. lib/cli/templates
