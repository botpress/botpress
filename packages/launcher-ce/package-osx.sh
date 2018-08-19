mkdir -p dist/mac/data
mkdir -p dist/mac/storage
mkdir -p dist/mac/modules

echo "Copying Core configuration files..."
cp -r ../core/data/ dist/mac/data
cp -r ../core/native-extensions/macos/** dist/mac

echo "Packaging binaries..."
pkg package.json --target macos-x64 --output dist/mac/botpress
