#!/bin/bash

cd $(dirname $0)/..

echo "Copying BP files..."
rm -rf static
mkdir static
mkdir static/studio
mkdir static/admin
cp -r ./node_modules/botpress/lib/web/* static/studio
cp -r ./node_modules/@botpress/xx-admin/front/build/* static/admin