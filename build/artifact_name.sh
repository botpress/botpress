#!/bin/bash

name="nightly-$(date +"%m-%d-%y")-"
if [ "$CODEBUILD_SOURCE_VERSION" == "stable" ]; then
  name="v$(./build/source_version.sh)"
fi

echo $name