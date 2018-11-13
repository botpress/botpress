#!/bin/bash

export CI=true
export CODEBUILD=true

export CODEBUILD_GIT_BRANCH=`git symbolic-ref HEAD --short 2>/dev/null`

if [ "$CODEBUILD_GIT_BRANCH" == "" ] ; then
  CODEBUILD_GIT_BRANCH=`git branch -a --contains HEAD | sed -n 2p | awk '{ printf $1 }'`
  export CODEBUILD_GIT_BRANCH=${CODEBUILD_GIT_BRANCH#remotes/origin/}
fi

export CODEBUILD_GIT_TAG=`git describe --tags --exact-match 2>/dev/null`
export CODEBUILD_GIT_MESSAGE=`git log -1 --pretty=%B`
export CODEBUILD_GIT_AUTHOR=`git log -1 --pretty=%an`
export CODEBUILD_GIT_AUTHOR_EMAIL=`git log -1 --pretty=%ae`
export CODEBUILD_GIT_COMMIT=`git log -1 --pretty=%H`

export CODEBUILD_PULL_REQUEST=false
if [[ $CODEBUILD_GIT_BRANCH == pr-* ]] ; then
  export CODEBUILD_PULL_REQUEST=${CODEBUILD_GIT_BRANCH#pr-}
fi

export CODEBUILD_PROJECT=${CODEBUILD_BUILD_ID%:$CODEBUILD_LOG_PATH}
export CODEBUILD_BUILD_URL=https://$AWS_DEFAULT_REGION.console.aws.amazon.com/codebuild/home?region=$AWS_DEFAULT_REGION#/builds/$CODEBUILD_BUILD_ID/view/new

export ARTIFACT_NAME="nightly-$(date +"%Y-%m-%d")"
if [[ "$CODEBUILD_GIT_TAG" == v* ]] ; then
  export ARTIFACT_NAME=`echo $CODEBUILD_GIT_TAG | sed 's/\./_/g'`
fi

export REPOSITORY_URI=botpress/server
export COMMIT_HASH=`echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7`
export EDITION=${EDITION:=ce}
export IMAGE_TAG=${COMMIT_HASH:=latest}
export DOCKER_TAG_COMMIT=`echo commit-$(date +"%Y-%m-%d")-$IMAGE_TAG`
echo "export ARTIFACT_NAME=$ARTIFACT_NAME"
echo "export REPOSITORY_URI=$REPOSITORY_URI"
echo "export COMMIT_HASH=$COMMIT_HASH"
echo "export IMAGE_TAG=$IMAGE_TAG"
echo "export EDITION=$EDITION"
echo "export CODEBUILD_GIT_TAG=$CODEBUILD_GIT_TAG"
echo "export DOCKER_TAG_COMMIT=$DOCKER_TAG_COMMIT"