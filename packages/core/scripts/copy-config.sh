cd $(dirname $0)/..

if [ -d data/ ]; then
  rm -rf dist/data/
  mkdir -p dist/data/
  
  rm -rf dist/storage/
  mkdir -p dist/storage/
  
  rm -rf dist/modules/
  mkdir -p dist/modules/

  cp -r data/ dist/data
  
  # Copy all the modules
  cp -r ../channels/webchat/dist/. dist/modules/channel-web
  
  echo "Copied configuration files"
fi
