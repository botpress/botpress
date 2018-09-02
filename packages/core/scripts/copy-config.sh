cd $(dirname $0)/..

if [ -d data/ ]; then
  echo "Copying DEV mode configuration files..."
  
  # keep the SQLite DB between rebuilds
  mkdir -p tmp
  if [ -d dist/storage/ ]; then
    cp dist/storage/* tmp/
  fi
  rm -rf dist/storage/
  mkdir -p dist/storage/
  cp tmp/* dist/storage/
  rm -rf tmp/
  
  rm -rf dist/data/
  mkdir -p dist/data/
  cp -r data/ dist/data

  echo "   Done."
fi
