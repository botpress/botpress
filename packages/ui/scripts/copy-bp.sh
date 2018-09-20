#!/bin/bash

cd $(dirname $0)/..

echo "Copying BP files..."
rm -rf static
mkdir -p static/admin/

cp -r ./node_modules/botpress/lib/web/* static/
cp -r ../admin/front/build/* static/admin/