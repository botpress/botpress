#!/bin/bash

export CI=true
export CODEBUILD=true

export CODEBUILD_GIT_BRANCH="$(git symbolic-ref HEAD --short 2>/dev/null)"
if [ "$CODEBUILD_GIT_BRANCH" = "" ] ; then
  CODEBUILD_GIT_BRANCH="$(git branch -a --contains HEAD | sed -n 2p | awk '{ printf $1 }')";
  export CODEBUILD_GIT_BRANCH=${CODEBUILD_GIT_BRANCH#remotes/origin/};
fi

export CODEBUILD_GIT_CLEAN_BRANCH="$(echo $CODEBUILD_GIT_BRANCH | tr '/' '.')"
export CODEBUILD_GIT_ESCAPED_BRANCH="$(echo $CODEBUILD_GIT_CLEAN_BRANCH | sed -e 's/[]\/$*.^[]/\\\\&/g')"
export CODEBUILD_GIT_MESSAGE="$(git log -1 --pretty=%B)"
export CODEBUILD_GIT_AUTHOR="$(git log -1 --pretty=%an)"
export CODEBUILD_GIT_AUTHOR_EMAIL="$(git log -1 --pretty=%ae)"
export CODEBUILD_GIT_COMMIT="$(git log -1 --pretty=%H)"
export CODEBUILD_GIT_SHORT_COMMIT="$(git log -1 --pretty=%h)"
export CODEBUILD_GIT_TAG="$(git describe --tags --exact-match 2>/dev/null)"
export CODEBUILD_GIT_MOST_RECENT_TAG="$(git describe --tags --abbrev=0)"

export CODEBUILD_PULL_REQUEST=false
if [ "${CODEBUILD_GIT_BRANCH#pr-}" != "$CODEBUILD_GIT_BRANCH" ] ; then
  export CODEBUILD_PULL_REQUEST=${CODEBUILD_GIT_BRANCH#pr-};
fi

export CODEBUILD_PROJECT=${CODEBUILD_BUILD_ID%:$CODEBUILD_LOG_PATH}
export CODEBUILD_BUILD_URL=https://$AWS_DEFAULT_REGION.console.aws.amazon.com/codebuild/home?region=$AWS_DEFAULT_REGION#/builds/$CODEBUILD_BUILD_ID/view/new

echo "==> AWS CodeBuild Extra Environment Variables:"
echo "==> CI = $CI"
echo "==> CODEBUILD = $CODEBUILD"
echo "==> CODEBUILD_GIT_AUTHOR = $CODEBUILD_GIT_AUTHOR"
echo "==> CODEBUILD_GIT_AUTHOR_EMAIL = $CODEBUILD_GIT_AUTHOR_EMAIL"
echo "==> CODEBUILD_GIT_BRANCH = $CODEBUILD_GIT_BRANCH"
echo "==> CODEBUILD_GIT_CLEAN_BRANCH = $CODEBUILD_GIT_CLEAN_BRANCH"
echo "==> CODEBUILD_GIT_ESCAPED_BRANCH = $CODEBUILD_GIT_ESCAPED_BRANCH"
echo "==> CODEBUILD_GIT_COMMIT = $CODEBUILD_GIT_COMMIT"
echo "==> CODEBUILD_GIT_SHORT_COMMIT = $CODEBUILD_GIT_SHORT_COMMIT"
echo "==> CODEBUILD_GIT_MESSAGE = $CODEBUILD_GIT_MESSAGE"
echo "==> CODEBUILD_GIT_TAG = $CODEBUILD_GIT_TAG"
echo "==> CODEBUILD_GIT_MOST_RECENT_TAG = $CODEBUILD_GIT_MOST_RECENT_TAG"
echo "==> CODEBUILD_PROJECT = $CODEBUILD_PROJECT"
echo "==> CODEBUILD_PULL_REQUEST = $CODEBUILD_PULL_REQUEST"