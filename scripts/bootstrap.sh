npm install

originalPath=$PWD

find ./packages -name package.json | grep -v -E "node_modules|dist" | 
while read filename
do
  cd $(dirname "$filename")
  npm install
  cd $originalPath
done