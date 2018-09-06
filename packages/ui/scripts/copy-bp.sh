#!/bin/bash

cd $(dirname $0)/..

echo "Copying BP files..."
rm -rf static
mkdir static
cp -r ./node_modules/botpress/lib/web/* static/