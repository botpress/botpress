if [ -d static/ ]; then
  rm -rf dist/static/ && cp -r static/ dist/static/
  echo "Copied static files"
fi

if [ -d config/ ]; then
  rm -rf dist/config
  rm -rf dist/storage
  
  mkdir -p dist/data
  mkdir -p dist/storage
  cp -r config/ dist/data
  echo "Copied configuration files"
fi
