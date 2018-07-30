if [ -d static/ ]; then
  rm -rf dist/static/ && cp -r static/ dist/static/
  echo "Copied static files"
fi

<<<<<<< HEAD
if [ -d config/ ]; then
  rm -rf dist/config
  rm -rf dist/storage
  
  mkdir -p dist/data
  mkdir -p dist/storage
  cp -r config/ dist/data
  echo "Copied configuration files"
fi

=======
>>>>>>> Moved config files to data directory
if [ -d data/ ]; then
  rm -rf dist/data/ && cp -r data/ dist/data/
  echo "Copied data directory"
fi
