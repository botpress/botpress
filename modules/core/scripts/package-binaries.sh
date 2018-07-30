if [ -d config/ ]; then
  rm -rf bin/config/
  mkdir -p bin/config
  cp -r config/ bin/config/
  echo "Copied configuration files"
  echo "Packaging binaries..."
  # TODO: Add targets linux-x86,linux-x64,win-x86,win-x64
  pkg dist/src/app.js --target macos-x86,macos-x64 --output bin/botpress
fi
