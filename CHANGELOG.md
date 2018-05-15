# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

  <a name="10.9.3"></a>
## [10.9.3](https://github.com/botpress/botpress/compare/v10.9.2...v10.9.3) (2018-05-15)


### Bug Fixes

* **skill-choice:** pointing to the right version ([07d3e6c](https://github.com/botpress/botpress/commit/07d3e6c))




  <a name="10.9.2"></a>
## [10.9.2](https://github.com/botpress/botpress/compare/v10.9.1...v10.9.2) (2018-05-15)


### Bug Fixes

* **cli:** make the init command cancelable ([a56fed7](https://github.com/botpress/botpress/commit/a56fed7))




<a name="10.9.1"></a>
## [10.9.1](https://github.com/botpress/botpress/compare/v10.9.0...v10.9.1) (2018-05-15)




**Note:** Version bump only for package undefined

<a name="10.9.0"></a>
# [10.9.0](https://github.com/botpress/botpress/compare/v10.8.0...v10.9.0) (2018-05-15)


### Features

* **core:** created [@botpress](https://github.com/botpress)/util-sdk to help develop modules ([96d30a3](https://github.com/botpress/botpress/commit/96d30a3))
* **skill-choice:** rewrote the skill to work with builtin content ([e04e1ba](https://github.com/botpress/botpress/commit/e04e1ba))




<a name="10.8.0"></a>
# [10.8.0](https://github.com/botpress/botpress/compare/v10.7.0...v10.8.0) (2018-05-14)


### Bug Fixes

* fixed UMM deprecation notice ([ce4c229](https://github.com/botpress/botpress/commit/ce4c229))
* make flow iter keys content-dependent ([2f17c26](https://github.com/botpress/botpress/commit/2f17c26))
* **core:** content manager doesn't yell when missing elements file ([35ab5de](https://github.com/botpress/botpress/commit/35ab5de))
* **nlu:** removed beta annotation ([cd920aa](https://github.com/botpress/botpress/commit/cd920aa))
* **web:** using builtin config file ([888beb3](https://github.com/botpress/botpress/commit/888beb3))


### Features

* **actions:** actions dropdown shows action metadata ([21af29d](https://github.com/botpress/botpress/commit/21af29d))
* **builtin:** storage actions ([e09af56](https://github.com/botpress/botpress/commit/e09af56))
* **core:** actions GUI to show available metadata ([a328ea6](https://github.com/botpress/botpress/commit/a328ea6))
* **core:** actions registration and metadata provider ([1b5f643](https://github.com/botpress/botpress/commit/1b5f643))
* **core:** moved CLI template to separate folder at root ([6e6e205](https://github.com/botpress/botpress/commit/6e6e205))
* **flows:** move node / flow props to a separate modal ([0dc327e](https://github.com/botpress/botpress/commit/0dc327e))
* **flows:** tabbed interface ([1c1108f](https://github.com/botpress/botpress/commit/1c1108f))
* **templates:** provided a "basic" bot template ([f872b77](https://github.com/botpress/botpress/commit/f872b77))




<a name="10.7.0"></a>
# [10.7.0](https://github.com/botpress/botpress/compare/v10.6.2...v10.7.0) (2018-05-11)


### Bug Fixes

* version extraction ([74525c1](https://github.com/botpress/botpress/commit/74525c1))
* **cli:** fixes botpress cloud ghost-sync ([0387467](https://github.com/botpress/botpress/commit/0387467))
* **core:** content rendering of arrays ([259c027](https://github.com/botpress/botpress/commit/259c027))
* added reference building to CI ([c480316](https://github.com/botpress/botpress/commit/c480316))
* invalid jsdoc ([06f613b](https://github.com/botpress/botpress/commit/06f613b))
* **core:** getTag with details when there is no prior value ([d29fda9](https://github.com/botpress/botpress/commit/d29fda9))
* **docs:** fixed TOC nav height ([5301eb0](https://github.com/botpress/botpress/commit/5301eb0))
* **docs:** removed private APIs ([a91afbf](https://github.com/botpress/botpress/commit/a91afbf))
* **media:** fixed static media link ([5c65596](https://github.com/botpress/botpress/commit/5c65596))
* **web:** set max height to carousel image on web ([36f9e98](https://github.com/botpress/botpress/commit/36f9e98))
* **web:** variable names containing special chars (like $, @) ([e9c7ff2](https://github.com/botpress/botpress/commit/e9c7ff2))


### Features

* **builtin:** new users actions ([b068be3](https://github.com/botpress/botpress/commit/b068be3))
* **core:** added dialog engine hooks APIs ([5e214ff](https://github.com/botpress/botpress/commit/5e214ff))
* **core:** built-in content renderers for the built-in content elements ([d1bf4f7](https://github.com/botpress/botpress/commit/d1bf4f7))
* **core:** built-in content types ([613ac02](https://github.com/botpress/botpress/commit/613ac02))
* **core:** exposed recomputeCategoriesMetadata in contentManager ([30d7fae](https://github.com/botpress/botpress/commit/30d7fae))
* **core:** getTag() can now return more details like the tagging time ([43d725c](https://github.com/botpress/botpress/commit/43d725c))
* **core:** partial progress toward built-in actions ([2eddbec](https://github.com/botpress/botpress/commit/2eddbec))




<a name="10.6.2"></a>
## [10.6.2](https://github.com/botpress/botpress/compare/v10.6.1...v10.6.2) (2018-05-04)


### Bug Fixes

* **core:** allow the use of private org ([c1c3745](https://github.com/botpress/botpress/commit/c1c3745))




<a name="10.6.1"></a>
## [10.6.1](https://github.com/botpress/botpress/compare/v10.6.0...v10.6.1) (2018-05-04)


### Bug Fixes

* **nlu:** zscore dependency ([cd44ea1](https://github.com/botpress/botpress/commit/cd44ea1))




<a name="10.6.0"></a>
# [10.6.0](https://github.com/botpress/botpress/compare/v10.5.0...v10.6.0) (2018-05-04)


### Features

* **configuration:** add ability to make flow-editor read-only ([cfe9149](https://github.com/botpress/botpress/commit/cfe9149))
* **nlu:** native NLU has better ranking and false-positive detection ([6c8e8c8](https://github.com/botpress/botpress/commit/6c8e8c8))




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
