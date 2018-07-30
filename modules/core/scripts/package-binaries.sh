rm -rf bin

# OSX Compilation

mkdir -p bin/mac/data
mkdir -p bin/mac/storage

cp -r config/ bin/mac/data
cp -r extensions/macos/** bin/mac

echo "Copied configuration files"
echo "Packaging binaries..."

pkg dist/src/app.js --target macos-x64 --output bin/mac/botpress
