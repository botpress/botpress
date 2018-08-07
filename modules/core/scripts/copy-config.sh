cd $(dirname $0)/..

if [ -d data/ ]; then
  rm -rf dist/data/
  mkdir -p dist/data/
  
  rm -rf dist/storage/
  mkdir -p dist/storage/
  
  cp -r data/ dist/data
  echo "Copied configuration files"
fi
