echo "Copying static files to tsc generated files"
cd ./static && rm -rf ../dist/static && mkdir ../dist/static/ && cp * ../dist/static/