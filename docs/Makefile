# Copyright (c) 2013-present, Facebook, Inc.
# All rights reserved.

.PHONY: start install serve build i18n-upload i18n-download

ifeq ($(origin DEST), undefined)
BUILD_FLAGS=
else
BUILD_FLAGS=-d $(DEST)
endif

.DEFAULT_GOAL := start
start:
	@make clear
	@make install
	@make serve

install: test-bundler test-yarn
	@yarn install
	@bundle install

clear: 
	rm -rf .asset-cache
	rm -rf .node_modules
	rm -rf "_site/"

local:
	@make clear
	@make install
	@make serve-developpement

serve: test-jekyll
	@bundle exec jekyll serve --host="127.0.0.1" --port=8080 --trace  --verbose

build: test-jekyll symlinks
	bundle exec jekyll build $(BUILD_FLAGS)

algolie:
	bundle exec jekyll algolia push

serve-developpement: 
	bundle exec jekyll serve --host="0.0.0.0" --port=8080 --watch --config "_config.yml,_config.local.yml"

serve-production: test-jekyll
	@JEKYLL_ENV=production bundle exec jekyll serve --host="::" --port=8080

build-production: test-jekyll
	@JEKYLL_ENV=production bundle exec jekyll build $(BUILD_FLAGS) --config "_config.yml,_config.prod.yml"

BUNDLE_EXISTS := $(shell command -v bundle 2> /dev/null)
YARN_EXISTS := $(shell command -v yarn 2> /dev/null)
JEKYLL_EXISTS := $(shell command -v jekyll 2> /dev/null)
# CROWDIN_EXISTS := $(shell command -v crowdin-cli 2> /dev/null)

test-bundler:
ifndef BUNDLE_EXISTS
	$(error bundler is not installed. Run `gem install bundler`)
endif

test-yarn:
ifndef YARN_EXISTS
	$(error yarn is not installed. Run `npm install yarn`)
endif

test-jekyll:
ifndef JEKYLL_EXISTS
	$(error Jekyll is not installed. Run `make install`)
endif
