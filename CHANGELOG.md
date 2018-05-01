# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

      <a name="10.5.0"></a>
# [10.5.0](https://github.com/botpress/botpress/compare/v10.4.0...v10.5.0) (2018-05-01)


### Bug Fixes

* removed usage of deprecated `bp.db.kvs` ([d5cef13](https://github.com/botpress/botpress/commit/d5cef13))
* **audience:** audiance module working properly ([d96c62a](https://github.com/botpress/botpress/commit/d96c62a))
* **hitl:** getUserSession returns a promise ([58dc349](https://github.com/botpress/botpress/commit/58dc349))
* **hitl:** hitl now works with webchat ([a3415d4](https://github.com/botpress/botpress/commit/a3415d4))


### Features

* added "update" CLI command ([f9c3143](https://github.com/botpress/botpress/commit/f9c3143))




      <a name="10.4.0"></a>
# [10.4.0](https://github.com/botpress/botpress/compare/v10.3.1...v10.4.0) (2018-04-29)


### Bug Fixes

* **messenger:** updated to new config, removed GUI ([b8db37e](https://github.com/botpress/botpress/commit/b8db37e))


### Features

* **configuration:** module configuration manager ([1c432e3](https://github.com/botpress/botpress/commit/1c432e3))
* throw if there's missing mandatory config keys ([7635b27](https://github.com/botpress/botpress/commit/7635b27))




<a name="10.3.1"></a>
## [10.3.1](https://github.com/botpress/botpress/compare/v10.2.5...v10.3.1) (2018-04-28)




**Note:** Version bump only for package undefined

<a name="10.3.0"></a>

# [10.3.0](https://github.com/botpress/modules/compare/v10.2.3...v10.3.0) (2018-04-27)

### Features

* **web:** added support for markdown render of text ([f5403bb](https://github.com/botpress/modules/commit/f5403bb))

<a name="10.2.3"></a>

## [10.2.3](https://github.com/botpress/modules/compare/v10.2.1...v10.2.3) (2018-04-24)

### Bug Fixes

* **nlu:** debugMode ([541909c](https://github.com/botpress/modules/commit/541909c))

<a name="10.2.3"></a>

## [10.2.3](https://github.com/botpress/modules/compare/v10.2.1...v10.2.3) (2018-04-24)

### Bug Fixes

* **nlu:** debugMode ([541909c](https://github.com/botpress/modules/commit/541909c))

<a name="10.2.0"></a>

# [10.2.0](https://github.com/botpress/botpress/compare/v10.1.2...v10.2.0) (2018-04-18)

### Features

* **core:** high-level API to manipulate the dialog manager ([6ea72db](https://github.com/botpress/botpress/commit/6ea72db))
* **util-roles:** added utils-roles package to the monorepo ([25b733c](https://github.com/botpress/modules/commit/25b733c))
* **utils:** implemented roles engine ([e0d1a79](https://github.com/botpress/modules/commit/e0d1a79))

<a name="10.1.2"></a>

## [10.1.2](https://github.com/botpress/botpress/compare/v10.1.1...v10.1.2) (2018-04-17)

### Bug Fixes

* **auth:** check decoded.aud only for cloud-paired bots ([faad07e](https://github.com/botpress/botpress/commit/faad07e))
* **changelog:** Fixed changelog to use Conventional Commits ([9f32879](https://github.com/botpress/modules/commit/9f32879))

<a name="10.1.1"></a>

## [10.1.1](https://github.com/botpress/botpress/compare/v10.1.0...v10.1.1) (2018-04-17)

### Bug Fixes

* **style:** default font weight is a bit bolder ([4c97d74](https://github.com/botpress/botpress/commit/4c97d74))
* botId of undefined ([4332ba8](https://github.com/botpress/botpress/commit/4332ba8))

<a name="10.1.0"></a>

# [10.1.0](https://github.com/botpress/botpress/compare/v10.0.16...v10.1.0) (2018-04-17)

### Features

* **login:** cli authentication to cloud bots ([84e6ca5](https://github.com/botpress/botpress/commit/84e6ca5))

<a name="10.0.16"></a>

## [10.0.16](https://github.com/botpress/botpress/compare/v10.0.15...v10.0.16) (2018-04-17)

### Bug Fixes

* **login:** fixes the "bp-cloup" not found error ([696a133](https://github.com/botpress/botpress/commit/696a133))

<a name="10.0.15"></a>

## [10.0.15](https://github.com/botpress/botpress/compare/v10.0.14...v10.0.15) (2018-04-17)

<a name="10.0.12"></a>

## [10.0.12](https://github.com/botpress/botpress/compare/v10.0.8...v10.0.12) (2018-04-13)

### Bug Fixes

* **changelog:** reformatted changelog ([7af81be](https://github.com/botpress/botpress/commit/7af81be))

# Before Botpress X

# 1.0.11 / 2017-07-05

* 1.0.11
* There's a new kind of views that botpress can now serve: **Lightweight Views**. The purpose of these is so that modules can serve UIs that don't require any of the heavy botpress styling & APIs. The default Botpress view weighs about 1.5mb and each module about 500kb. The lightweight views weigh about 200kb total.

# 1.0.9 / 2017-06-24

* 1.0.9
* Added built-in fallback handler

# 1.0.8 / 2017-06-22

* 1.0.8
* Merge branch 'master' into next

# 1.0.7 / 2017-06-20

* Fixed webpack
* 1.0.7
* Better evaluation of arrays
* Rendering error
* Fixed issue with plugins with dots
* 1.0.6
* Uglify the build
* Update README.md
* Add count method to users
* Fetch list of users from userId + limit
* Add id value to user
* Fix on update + list of users + getTags
* Subproject sync
* Merge branch 'master' into next
* Loads the bot's .env file
* Ability to tag users
* Removed node-sass and theming
* Updatyed enterprise
* Loading config from module-name.config.yml
* Merge branch 'next'
* Switched to sitemap-general for prefix
* changed sitemap location
* Added robots.txt

# 1.0.5 / 2017-06-08

* 1.0.5
* Added support for heroku postgres by default

# 1.0.4 / 2017-06-08

* 1.0.4
* init creates a botpress 1 bot
* Added UMM Support Image
* 1.0.3
* Update README.md

# 1.0.3 / 2017-06-07

* Removed middleware loading
* 1.0.2
* 1.0.1

# 1.0.1 / 2017-06-07

* Added missing modules
* Merge branch 'master' into next
* Merge pull request [#155](https://github.com/botpress/botpress/issues/155) from botpress/next
Upcoming Botpress 1.0
* Added some examples
* Added proactive umm example
* Fixed typo
* Fixed typos
* Inject database to UMM
* Wired up proactive UMM sender + refactoring
* Proactive UMM sender
* Support for UMM in convos
* Anchors plugin
* Postgres warning heroku
* Botfile configuration
* Added dynamic css injection
* gitbook version
* Attempt at fixing style
* Removing gitbook
* Moved style
* Listeners (bp.hear) now add regex matchings to event (`event.captured`)
* Doc: umm
* Doc: structure
* Doc: flow
* Doc: events
* doc: database
* doc: convoersations
* Documentation refactoring
* Custom book CSS
* Added Hints plugin
* Changed contentPath in botfile
* No longer need to load middlewares manually
* Revamped botfile comments
* Removed incomplete examples
* TLDR Styling
* doc: Hello world demo
* Added a few plugins
* Up you'll get
* Added gitbook to ignored files

# 1.0.0 / 2017-06-03

* 1.0.0
* Botfile documentation
* Moved old documentation to new layout
* UMM Documentation
* CLI Reference
* Introduction documentation
* Deploying documentation
* Database helper documentation
* Flow documentation
* Advanced documentation
* moved modules documentation
* Added fundamentals documentation
* /Doc -> Setup
* New documentation readme
* Added docs tutorials
* New doc summary
* Removed old /docs
