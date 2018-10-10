#!/bin/bash

name="nightly-$(date +"%m-%d-%y")"
if [ "$CODEBUILD_GIT_ESCAPED_BRANCH" == "stable" ]; then
  name="v$(./build/source_version.sh)"
fi

echo $name