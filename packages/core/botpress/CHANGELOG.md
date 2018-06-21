# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="10.20.1"></a>
## [10.20.1](https://github.com/botpress/botpress/compare/v10.20.0...v10.20.1) (2018-06-21)


### Bug Fixes

* **botfile:** added default value for hiddenHeroSection (resolve [#647](https://github.com/botpress/botpress/issues/647)) ([9d5cf80](https://github.com/botpress/botpress/commit/9d5cf80))
* **core:** enable modules config watching (resolve [#519](https://github.com/botpress/botpress/issues/519)) ([8e7393f](https://github.com/botpress/botpress/commit/8e7393f))
* **core:** make sqlite3 optional and warn if using node v10 (ref [#526](https://github.com/botpress/botpress/issues/526)) ([a5cf727](https://github.com/botpress/botpress/commit/a5cf727))




<a name="10.20.0"></a>
# [10.20.0](https://github.com/botpress/botpress/compare/v10.19.0...v10.20.0) (2018-06-20)


### Bug Fixes

* **core:** fix for the user with id === 0 ([05ad1ce](https://github.com/botpress/botpress/commit/05ad1ce))
* **core:** flowbuilder imports should match filenames ([cfebba5](https://github.com/botpress/botpress/commit/cfebba5))
* **ghost:** fix content manager ([2234b40](https://github.com/botpress/botpress/commit/2234b40))
* **licensing:** fix the license name in the footer ([beff44c](https://github.com/botpress/botpress/commit/beff44c))
* **webpack:** change path to js files (resolve [#648](https://github.com/botpress/botpress/issues/648)) ([8a2564d](https://github.com/botpress/botpress/commit/8a2564d))


### Features

* **cloud-roles:** bot media read-only mode ([ede9d73](https://github.com/botpress/botpress/commit/ede9d73))
* **cloud-roles:** content read-only mode ([8e49720](https://github.com/botpress/botpress/commit/8e49720))
* **cloud-roles:** flows read-only mode ([a8d89d3](https://github.com/botpress/botpress/commit/a8d89d3))
* **cloud-roles:** ghost-content read-only mode ([1799803](https://github.com/botpress/botpress/commit/1799803))
* **cloud-roles:** hide skill edit button based on perm ([492377e](https://github.com/botpress/botpress/commit/492377e))
* **cloud-roles:** hide skills dropdown according to perms ([8431799](https://github.com/botpress/botpress/commit/8431799))




<a name="10.19.0"></a>
# [10.19.0](https://github.com/botpress/botpress/compare/v10.18.0...v10.19.0) (2018-06-19)


### Features

* **core:** implement auto pick content (resolve [#517](https://github.com/botpress/botpress/issues/517)) ([d100d87](https://github.com/botpress/botpress/commit/d100d87))




<a name="10.18.0"></a>
# [10.18.0](https://github.com/botpress/botpress/compare/v10.17.3...v10.18.0) (2018-06-19)


### Bug Fixes

* **core:** timeout-flow should be triggered (ref [#628](https://github.com/botpress/botpress/issues/628)) ([be433db](https://github.com/botpress/botpress/commit/be433db))
* **webpack:** improve build performance (resolve [#399](https://github.com/botpress/botpress/issues/399)) ([5616277](https://github.com/botpress/botpress/commit/5616277))


### Features

* **botfile:** added variable hideHeroSection (resolve [#29](https://github.com/botpress/botpress/issues/29)) ([f9caf5f](https://github.com/botpress/botpress/commit/f9caf5f))
* **core:** added confirm when user want go out from flow(resolve [#516](https://github.com/botpress/botpress/issues/516)) ([b7841c1](https://github.com/botpress/botpress/commit/b7841c1))
* **core:** hostname bot listens to can be customized (resolve [#644](https://github.com/botpress/botpress/issues/644)) ([fb9c4de](https://github.com/botpress/botpress/commit/fb9c4de))




<a name="10.17.3"></a>
## [10.17.3](https://github.com/botpress/botpress/compare/v10.17.2...v10.17.3) (2018-06-15)


### Bug Fixes

* **code:** empty dashboard when user signed in (resolve [#635](https://github.com/botpress/botpress/issues/635)) ([41283de](https://github.com/botpress/botpress/commit/41283de))
* **content:** blank page (ref [#620](https://github.com/botpress/botpress/issues/620)) ([ecbbeda](https://github.com/botpress/botpress/commit/ecbbeda))
* **core:** fix utc (resolve [#494](https://github.com/botpress/botpress/issues/494)) ([780b4f2](https://github.com/botpress/botpress/commit/780b4f2))
* **core:** use bot's NODE_ENV not botpress's(resolve [#591](https://github.com/botpress/botpress/issues/591)) ([6699aa1](https://github.com/botpress/botpress/commit/6699aa1))




<a name="10.17.2"></a>
## [10.17.2](https://github.com/botpress/botpress/compare/v10.17.1...v10.17.2) (2018-06-13)


### Bug Fixes

* **cloud-roles:** fix permissions for anonymous users ([c8a2653](https://github.com/botpress/botpress/commit/c8a2653))
* **cloud-roles:** updated client-side checks ([4793423](https://github.com/botpress/botpress/commit/4793423))




<a name="10.17.1"></a>
## [10.17.1](https://github.com/botpress/botpress/compare/v10.17.0...v10.17.1) (2018-06-11)




**Note:** Version bump only for package botpress

<a name="10.17.0"></a>
# [10.17.0](https://github.com/botpress/botpress/compare/v10.15.0...v10.17.0) (2018-06-10)


### Bug Fixes

* **auth:** disable auth check when login not enabled ([11347d4](https://github.com/botpress/botpress/commit/11347d4))
* **cloud-roles:** fix operation name and add more checks ([d3186d9](https://github.com/botpress/botpress/commit/d3186d9))
* **cloud-roles:** improve roles fetch throttling ([888e8c8](https://github.com/botpress/botpress/commit/888e8c8))
* **dashboard:** infinite loop fix & refresh issue ([9455970](https://github.com/botpress/botpress/commit/9455970))
* **login:** should not log auth failure as an error ([f1adcae](https://github.com/botpress/botpress/commit/f1adcae))
* **logs:** logs view & download archive ([c4d304a](https://github.com/botpress/botpress/commit/c4d304a))
* **rules:** all bot rules start with `bot.` ([98643a0](https://github.com/botpress/botpress/commit/98643a0))


### Features

* **cloud-roles:** middlewares read-only mode ([1cbc084](https://github.com/botpress/botpress/commit/1cbc084))
* **cloud-roles:** server-side check for cloud permissions ([919e68c](https://github.com/botpress/botpress/commit/919e68c))
* **roles:** client-side permissions checks in the sidebar and header ([af772e5](https://github.com/botpress/botpress/commit/af772e5))




<a name="10.16.0"></a>
# [10.16.0](https://github.com/botpress/botpress/compare/v10.15.0...v10.16.0) (2018-06-10)


### Bug Fixes

* **auth:** disable auth check when login not enabled ([11347d4](https://github.com/botpress/botpress/commit/11347d4))
* **cloud-roles:** fix operation name and add more checks ([d3186d9](https://github.com/botpress/botpress/commit/d3186d9))
* **cloud-roles:** improve roles fetch throttling ([888e8c8](https://github.com/botpress/botpress/commit/888e8c8))
* **dashboard:** infinite loop fix & refresh issue ([9455970](https://github.com/botpress/botpress/commit/9455970))
* **login:** should not log auth failure as an error ([f1adcae](https://github.com/botpress/botpress/commit/f1adcae))
* **logs:** logs view & download archive ([c4d304a](https://github.com/botpress/botpress/commit/c4d304a))
* **rules:** all bot rules start with `bot.` ([98643a0](https://github.com/botpress/botpress/commit/98643a0))


### Features

* **cloud-roles:** middlewares read-only mode ([1cbc084](https://github.com/botpress/botpress/commit/1cbc084))
* **cloud-roles:** server-side check for cloud permissions ([919e68c](https://github.com/botpress/botpress/commit/919e68c))
* **roles:** client-side permissions checks in the sidebar and header ([af772e5](https://github.com/botpress/botpress/commit/af772e5))




<a name="10.15.0"></a>
# [10.15.0](https://github.com/botpress/botpress/compare/v10.11.3...v10.15.0) (2018-06-07)


### Bug Fixes

* **content-manager:** action-button form should open correctly ([2062d30](https://github.com/botpress/botpress/commit/2062d30))
* **core:** fill computed data upon loading content items ([4e874fe](https://github.com/botpress/botpress/commit/4e874fe))
* **core:** improve .npmignore (ref [#513](https://github.com/botpress/botpress/issues/513)) ([d647813](https://github.com/botpress/botpress/commit/d647813))
* **core:** jumpTo jumps to the right node when specified ([e8c2455](https://github.com/botpress/botpress/commit/e8c2455))
* **core:** umm depr warning doesn't appear on start (resolve [#593](https://github.com/botpress/botpress/issues/593)) ([6512246](https://github.com/botpress/botpress/commit/6512246))
* **messenger:** queue: userId for messenger channel ([460c026](https://github.com/botpress/botpress/commit/460c026))
* **npmignore:** fix ignore nested folders ([64b797b](https://github.com/botpress/botpress/commit/64b797b))
* **qna:** cleanup log ([6518bdc](https://github.com/botpress/botpress/commit/6518bdc))
* **util-roles:** don't use parcel as its output is not es6-compatible ([25d84fb](https://github.com/botpress/botpress/commit/25d84fb))


### Features

* **qna:** bulk import for the questions ([0d83a89](https://github.com/botpress/botpress/commit/0d83a89))
* **qna:** redirect to node, middleware not working yet ([d93949b](https://github.com/botpress/botpress/commit/d93949b))
* **qna:** slightly more aesthetic UI ([3617ac1](https://github.com/botpress/botpress/commit/3617ac1))
* **roles:** describe available resources ([364d6f5](https://github.com/botpress/botpress/commit/364d6f5))
* **roles:** rename resources to follow dot-separated scheme ([9469877](https://github.com/botpress/botpress/commit/9469877))




<a name="10.14.2"></a>
## [10.14.2](https://github.com/botpress/botpress/compare/v10.14.1...v10.14.2) (2018-06-07)




**Note:** Version bump only for package botpress

<a name="10.14.1"></a>
## [10.14.1](https://github.com/botpress/botpress/compare/v10.14.0...v10.14.1) (2018-06-07)




**Note:** Version bump only for package botpress

<a name="10.14.0"></a>
# [10.14.0](https://github.com/botpress/botpress/compare/v10.13.4...v10.14.0) (2018-06-07)


### Bug Fixes

* **content-manager:** action-button form should open correctly ([2062d30](https://github.com/botpress/botpress/commit/2062d30))
* **core:** improve .npmignore (ref [#513](https://github.com/botpress/botpress/issues/513)) ([d647813](https://github.com/botpress/botpress/commit/d647813))
* **core:** umm depr warning doesn't appear on start (resolve [#593](https://github.com/botpress/botpress/issues/593)) ([6512246](https://github.com/botpress/botpress/commit/6512246))
* **util-roles:** don't use parcel as its output is not es6-compatible ([25d84fb](https://github.com/botpress/botpress/commit/25d84fb))


### Features

* **roles:** describe available resources ([364d6f5](https://github.com/botpress/botpress/commit/364d6f5))
* **roles:** rename resources to follow dot-separated scheme ([9469877](https://github.com/botpress/botpress/commit/9469877))




<a name="10.13.4"></a>
## [10.13.4](https://github.com/botpress/botpress/compare/v10.13.3...v10.13.4) (2018-06-01)


### Bug Fixes

* **messenger:** queue: userId for messenger channel ([460c026](https://github.com/botpress/botpress/commit/460c026))




<a name="10.13.3"></a>
## [10.13.3](https://github.com/botpress/botpress/compare/v10.13.2...v10.13.3) (2018-06-01)




**Note:** Version bump only for package botpress

<a name="10.13.2"></a>
## [10.13.2](https://github.com/botpress/botpress/compare/v10.13.1...v10.13.2) (2018-06-01)




**Note:** Version bump only for package botpress

<a name="10.13.1"></a>
## [10.13.1](https://github.com/botpress/botpress/compare/v10.13.0...v10.13.1) (2018-06-01)




**Note:** Version bump only for package botpress

<a name="10.13.0"></a>
# [10.13.0](https://github.com/botpress/botpress/compare/v10.11.3...v10.13.0) (2018-06-01)


### Bug Fixes

* **core:** fill computed data upon loading content items ([4e874fe](https://github.com/botpress/botpress/commit/4e874fe))
* **core:** jumpTo jumps to the right node when specified ([e8c2455](https://github.com/botpress/botpress/commit/e8c2455))
* **qna:** cleanup log ([6518bdc](https://github.com/botpress/botpress/commit/6518bdc))


### Features

* **qna:** bulk import for the questions ([0d83a89](https://github.com/botpress/botpress/commit/0d83a89))
* **qna:** redirect to node, middleware not working yet ([d93949b](https://github.com/botpress/botpress/commit/d93949b))
* **qna:** slightly more aesthetic UI ([3617ac1](https://github.com/botpress/botpress/commit/3617ac1))




<a name="10.12.0"></a>
# [10.12.0](https://github.com/botpress/botpress/compare/v10.11.3...v10.12.0) (2018-06-01)


### Bug Fixes

* **core:** fill computed data upon loading content items ([4e874fe](https://github.com/botpress/botpress/commit/4e874fe))
* **core:** jumpTo jumps to the right node when specified ([e8c2455](https://github.com/botpress/botpress/commit/e8c2455))
* **qna:** cleanup log ([6518bdc](https://github.com/botpress/botpress/commit/6518bdc))


### Features

* **qna:** bulk import for the questions ([0d83a89](https://github.com/botpress/botpress/commit/0d83a89))
* **qna:** redirect to node, middleware not working yet ([d93949b](https://github.com/botpress/botpress/commit/d93949b))
* **qna:** slightly more aesthetic UI ([3617ac1](https://github.com/botpress/botpress/commit/3617ac1))




<a name="10.11.1"></a>
## [10.11.1](https://github.com/botpress/botpress/compare/v10.11.0...v10.11.1) (2018-05-29)




**Note:** Version bump only for package botpress

<a name="10.11.0"></a>
# [10.11.0](https://github.com/botpress/botpress/compare/v10.10.0...v10.11.0) (2018-05-29)


### Bug Fixes

* **core:** botpress shouldn't change cwd (resolves [#52](https://github.com/botpress/botpress/issues/52)) ([14ed105](https://github.com/botpress/botpress/commit/14ed105))
* **core:** hide webchat on logout from admin-panel (resolve [#554](https://github.com/botpress/botpress/issues/554)) ([8d05b69](https://github.com/botpress/botpress/commit/8d05b69))
* **docs:** deploy tutorial link (resolve [#498](https://github.com/botpress/botpress/issues/498)) ([111279f](https://github.com/botpress/botpress/commit/111279f))




<a name="10.10.0"></a>
# [10.10.0](https://github.com/botpress/botpress/compare/v10.9.4...v10.10.0) (2018-05-24)


### Bug Fixes

* expand folders ([6c0387e](https://github.com/botpress/botpress/commit/6c0387e))
* fix filtering skills from the flows list ([9dcf01d](https://github.com/botpress/botpress/commit/9dcf01d))
* invalid jsdoc for CLI ([51424c9](https://github.com/botpress/botpress/commit/51424c9))
* prevent tree menu from activating the node ([f914da0](https://github.com/botpress/botpress/commit/f914da0))
* properly maintain toggled state when switching between flows ([b80ee96](https://github.com/botpress/botpress/commit/b80ee96))
* refactor ([94ddd87](https://github.com/botpress/botpress/commit/94ddd87))
* **docs:** removed global "type" in docs ([b32430d](https://github.com/botpress/botpress/commit/b32430d))
* **flows:** support slashes in URL ([2fe290f](https://github.com/botpress/botpress/commit/2fe290f))


### Features

* **content:** allow transparently batching content items requests ([bb31197](https://github.com/botpress/botpress/commit/bb31197))
* **flows:** hide the Skills list from the sidebar ([e299cf5](https://github.com/botpress/botpress/commit/e299cf5))
* **flows:** menu items ([12605b0](https://github.com/botpress/botpress/commit/12605b0))
* **flows:** sample flows in directories ([ab818ac](https://github.com/botpress/botpress/commit/ab818ac))
* **flows:** tree view ([06358de](https://github.com/botpress/botpress/commit/06358de))




<a name="10.9.4"></a>
## [10.9.4](https://github.com/botpress/botpress/compare/v10.9.3...v10.9.4) (2018-05-16)




**Note:** Version bump only for package botpress

<a name="10.9.3"></a>
## [10.9.3](https://github.com/botpress/botpress/compare/v10.9.2...v10.9.3) (2018-05-15)




**Note:** Version bump only for package botpress

<a name="10.9.2"></a>
## [10.9.2](https://github.com/botpress/botpress/compare/v10.9.1...v10.9.2) (2018-05-15)


### Bug Fixes

* **cli:** make the init command cancelable ([a56fed7](https://github.com/botpress/botpress/commit/a56fed7))




<a name="10.9.1"></a>
## [10.9.1](https://github.com/botpress/botpress/compare/v10.9.0...v10.9.1) (2018-05-15)




**Note:** Version bump only for package botpress

<a name="10.9.0"></a>
# [10.9.0](https://github.com/botpress/botpress/compare/v10.8.0...v10.9.0) (2018-05-15)




**Note:** Version bump only for package botpress

<a name="10.8.0"></a>
# [10.8.0](https://github.com/botpress/botpress/compare/v10.7.0...v10.8.0) (2018-05-14)


### Bug Fixes

* make flow iter keys content-dependent ([2f17c26](https://github.com/botpress/botpress/commit/2f17c26))
* **core:** content manager doesn't yell when missing elements file ([35ab5de](https://github.com/botpress/botpress/commit/35ab5de))


### Features

* **actions:** actions dropdown shows action metadata ([21af29d](https://github.com/botpress/botpress/commit/21af29d))
* **core:** actions GUI to show available metadata ([a328ea6](https://github.com/botpress/botpress/commit/a328ea6))
* **core:** actions registration and metadata provider ([1b5f643](https://github.com/botpress/botpress/commit/1b5f643))
* **core:** moved CLI template to separate folder at root ([6e6e205](https://github.com/botpress/botpress/commit/6e6e205))
* **flows:** move node / flow props to a separate modal ([0dc327e](https://github.com/botpress/botpress/commit/0dc327e))
* **flows:** tabbed interface ([1c1108f](https://github.com/botpress/botpress/commit/1c1108f))




<a name="10.7.0"></a>
# [10.7.0](https://github.com/botpress/botpress/compare/v10.6.2...v10.7.0) (2018-05-11)


### Bug Fixes

* invalid jsdoc ([06f613b](https://github.com/botpress/botpress/commit/06f613b))
* **cli:** fixes botpress cloud ghost-sync ([0387467](https://github.com/botpress/botpress/commit/0387467))
* **core:** content rendering of arrays ([259c027](https://github.com/botpress/botpress/commit/259c027))
* **core:** getTag with details when there is no prior value ([d29fda9](https://github.com/botpress/botpress/commit/d29fda9))
* **docs:** removed private APIs ([a91afbf](https://github.com/botpress/botpress/commit/a91afbf))
* **media:** fixed static media link ([5c65596](https://github.com/botpress/botpress/commit/5c65596))
* **web:** variable names containing special chars (like $, @) ([e9c7ff2](https://github.com/botpress/botpress/commit/e9c7ff2))


### Features

* **core:** added dialog engine hooks APIs ([5e214ff](https://github.com/botpress/botpress/commit/5e214ff))
* **core:** built-in content types ([613ac02](https://github.com/botpress/botpress/commit/613ac02))
* **core:** exposed recomputeCategoriesMetadata in contentManager ([30d7fae](https://github.com/botpress/botpress/commit/30d7fae))
* **core:** getTag() can now return more details like the tagging time ([43d725c](https://github.com/botpress/botpress/commit/43d725c))




<a name="10.6.2"></a>
## [10.6.2](https://github.com/botpress/botpress/compare/v10.6.1...v10.6.2) (2018-05-04)




**Note:** Version bump only for package botpress

<a name="10.6.1"></a>
## [10.6.1](https://github.com/botpress/botpress/compare/v10.6.0...v10.6.1) (2018-05-04)




**Note:** Version bump only for package botpress

<a name="10.6.0"></a>
# [10.6.0](https://github.com/botpress/botpress/compare/v10.5.0...v10.6.0) (2018-05-04)


### Features

* **configuration:** add ability to make flow-editor read-only ([cfe9149](https://github.com/botpress/botpress/commit/cfe9149))




<a name="10.5.0"></a>
# [10.5.0](https://github.com/botpress/botpress/compare/v10.4.0...v10.5.0) (2018-05-01)


### Bug Fixes

* **audience:** audiance module working properly ([d96c62a](https://github.com/botpress/botpress/commit/d96c62a))


### Features

* added "update" CLI command ([f9c3143](https://github.com/botpress/botpress/commit/f9c3143))




<a name="10.4.0"></a>
# [10.4.0](https://github.com/botpress/botpress/compare/v10.3.1...v10.4.0) (2018-04-29)


### Features

* **configuration:** module configuration manager ([1c432e3](https://github.com/botpress/botpress/commit/1c432e3))
* throw if there's missing mandatory config keys ([7635b27](https://github.com/botpress/botpress/commit/7635b27))




<a name="10.3.1"></a>
## [10.3.1](https://github.com/botpress/botpress/compare/v10.2.5...v10.3.1) (2018-04-28)




**Note:** Version bump only for package botpress
