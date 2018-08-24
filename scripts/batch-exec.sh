originalPath=$PWD

SEARCH_STRING=$1
COMMAND_TO_EXEC=$2

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
GREY='\033[90m'
NC='\033[0;00m'

safeRunCommand() {
  cmnd="$*"
  eval $cmnd
  ret_code=$?
  if [ $ret_code != 0 ]; then
    printf "Error : [%d] when executing command: '$cmnd'" $ret_code
    exit $ret_code
  fi
}

find ./packages -name package.json | grep -v -E "node_modules|dist|front" |
while read filename
do
  cd $(dirname "$filename")
  File=package.json
  if grep -q "$SEARCH_STRING" "$File";
  then
    echo "${GREEN}Running${NC} ${COMMAND_TO_EXEC} ${GREY}in $PWD"
    safeRunCommand $COMMAND_TO_EXEC
  else
    echo "${YELLOW}Skipped${GREY} $PWD"
  fi
  cd $originalPath
done
