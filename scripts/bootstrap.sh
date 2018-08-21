#find ./packages -name package.json | grep -v -E "node_modules|dist" | xargs -n1 dirname | xargs -n1 npm install

npm install
originalPath=$PWD
find ./packages -name package.json | grep -v -E "node_modules|dist" | 
while read filename
do
  directory=$(dirname "$filename")
  echo $directory
  cd $directory
  npm install
  echo $PWD
  cd $originalPath
  echo $PWD
done