# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="10.2.0"></a>
# [10.2.0](https://github.com/botpress/botpress/compare/v10.1.2...v10.2.0) (2018-04-18)


### Features

* **core:** high-level API to manipulate the dialog manager ([6ea72db](https://github.com/botpress/botpress/commit/6ea72db))



<a name="10.1.2"></a>
## [10.1.2](https://github.com/botpress/botpress/compare/v10.1.1...v10.1.2) (2018-04-17)


### Bug Fixes

* **auth:** check decoded.aud only for cloud-paired bots ([faad07e](https://github.com/botpress/botpress/commit/faad07e))



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
