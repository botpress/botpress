if [ -d ./static/ ]; then
  rm -rf ../dist/static/ && cp -r static/ dist/
  echo "Copied static files"
fi

if [ -d ./config/ ]; then
  rm -rf ../dist/config/ && cp -r config/ dist/
  echo "Copied configuration files"
fi
