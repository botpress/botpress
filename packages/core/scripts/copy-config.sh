cd $(dirname $0)/..

if [ -d data/ ]; then
  echo "Copying DEV mode configuration files..."
  
  # keep the SQLite DB between rebuilds
  mkdir -p tmp
  if [ -d dist/storage/ ]; then
    cp -R dist/storage/ tmp/
  fi
  rm -rf dist/storage/
  mkdir -p dist/storage/
  
  rm -rf dist/data/
  mkdir -p dist/data/
  cp -R data/ dist/data

  cp -R tmp/ dist/storage/
  rm -rf tmp/

  echo "   Done."
fi
