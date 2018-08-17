cd $(dirname $0)/..

rm -rf bin

# OSX Compilation

mkdir -p bin/mac/data
mkdir -p bin/mac/storage
mkdir -p bin/mac/modules

echo "Copying configuration files..."
cp -r data/ bin/mac/data
cp -r extensions/macos/** bin/mac

echo "Copying built-in modules..."
cp -r dist/modules/** bin/mac/modules

echo "Packaging binaries..."
pkg package.json --target macos-x64 --output bin/mac/botpress
