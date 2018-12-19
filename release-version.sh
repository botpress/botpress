#!/bin/bash

DOCS_VERSION_COMMAND="run version"

echo "Select an option for release："
echo

select VERSION in patch minor major "Specific Version"
  do
    echo
    if [[ $REPLY =~ ^[1-4]$ ]]; then
      if [[ $REPLY == 4 ]]; then
        read -p "Enter a specific version: " -r VERSION
        echo
        if [[ -z $REPLY ]]; then
          VERSION=$REPLY
        fi
      fi

      read -p "Create $VERSION commit - Are you sure ... (y/n) " -n 1 -r
      echo

      if [[ $REPLY =~ ^[Yy]$ || -z $REPLY ]]; then
        # Bump version
        yarn version --new-version $VERSION --no-git-tag-version
        NEW_VERSION=$(node -p "require('./package.json').version")
        cd docs/guide/website && yarn $DOCS_VERSION_COMMAND $NEW_VERSION && cd ../../..
        
        # Update changelog from git history
        gulp changelog

        # Create commit
        git add -A
        git commit -m "v$NEW_VERSION"
        git tag -a "v$NEW_VERSION" -m "created tag v$NEW_VERSION"
        echo "-----"
        echo "Finished, commit created, need to push to origin/master directly"
      else
        echo Cancelled
      fi
      break
    else
      echo Invalid \"${REPLY}\"
      echo "To continue, please enter one of the options (1-4):"
      echo
    fi
  done
