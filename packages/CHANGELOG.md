# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="10.20.1"></a>
## [10.20.1](https://github.com/botpress/botpress/compare/v10.20.0...v10.20.1) (2018-06-21)


### Bug Fixes

* **botfile:** added default value for hiddenHeroSection (resolve [#647](https://github.com/botpress/botpress/issues/647)) ([9d5cf80](https://github.com/botpress/botpress/commit/9d5cf80))
* **core:** enable modules config watching (resolve [#519](https://github.com/botpress/botpress/issues/519)) ([8e7393f](https://github.com/botpress/botpress/commit/8e7393f))
* **core:** make sqlite3 optional and warn if using node v10 (ref [#526](https://github.com/botpress/botpress/issues/526)) ([a5cf727](https://github.com/botpress/botpress/commit/a5cf727))
* **webchat:** keyframes anymation fallback for ie (resolve [#657](https://github.com/botpress/botpress/issues/657)) ([5dce355](https://github.com/botpress/botpress/commit/5dce355))




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


### Bug Fixes

* **messenger:** fixes error 400 upon bot start ([48117f9](https://github.com/botpress/botpress/commit/48117f9))


### Features

* **core:** implement auto pick content (resolve [#517](https://github.com/botpress/botpress/issues/517)) ([d100d87](https://github.com/botpress/botpress/commit/d100d87))




<a name="10.18.0"></a>
# [10.18.0](https://github.com/botpress/botpress/compare/v10.17.3...v10.18.0) (2018-06-19)


### Bug Fixes

* **core:** timeout-flow should be triggered (ref [#628](https://github.com/botpress/botpress/issues/628)) ([be433db](https://github.com/botpress/botpress/commit/be433db))
* **nlu:** fixed LUIS intent resolution ([168aa9b](https://github.com/botpress/botpress/commit/168aa9b))
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


### Bug Fixes

* **util-roles:** can't find ./resources (resolve [#625](https://github.com/botpress/botpress/issues/625)) ([1d4c28e](https://github.com/botpress/botpress/commit/1d4c28e))




<a name="10.17.0"></a>
# [10.17.0](https://github.com/botpress/botpress/compare/v10.15.0...v10.17.0) (2018-06-10)


### Bug Fixes

* **auth:** disable auth check when login not enabled ([11347d4](https://github.com/botpress/botpress/commit/11347d4))
* **botpress-terminal:** add missing dependencies (resolve [#618](https://github.com/botpress/botpress/issues/618)) ([f71e4bf](https://github.com/botpress/botpress/commit/f71e4bf))
* **cloud-roles:** fix operation name and add more checks ([d3186d9](https://github.com/botpress/botpress/commit/d3186d9))
* **cloud-roles:** improve roles fetch throttling ([888e8c8](https://github.com/botpress/botpress/commit/888e8c8))
* **dashboard:** infinite loop fix & refresh issue ([9455970](https://github.com/botpress/botpress/commit/9455970))
* **login:** should not log auth failure as an error ([f1adcae](https://github.com/botpress/botpress/commit/f1adcae))
* **logs:** logs view & download archive ([c4d304a](https://github.com/botpress/botpress/commit/c4d304a))
* **rules:** all bot rules start with `bot.` ([98643a0](https://github.com/botpress/botpress/commit/98643a0))
* **util-roles:** add convenience 2nd level wildcards ([704c4f5](https://github.com/botpress/botpress/commit/704c4f5))


### Features

* **cloud-roles:** middlewares read-only mode ([1cbc084](https://github.com/botpress/botpress/commit/1cbc084))
* **cloud-roles:** server-side check for cloud permissions ([919e68c](https://github.com/botpress/botpress/commit/919e68c))
* **messenger:** support custom graph version ([#599](https://github.com/botpress/botpress/issues/599)) ([e5054c6](https://github.com/botpress/botpress/commit/e5054c6))
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
* **util-roles:** add convenience 2nd level wildcards ([704c4f5](https://github.com/botpress/botpress/commit/704c4f5))


### Features

* **cloud-roles:** middlewares read-only mode ([1cbc084](https://github.com/botpress/botpress/commit/1cbc084))
* **cloud-roles:** server-side check for cloud permissions ([919e68c](https://github.com/botpress/botpress/commit/919e68c))
* **messenger:** support custom graph version ([#599](https://github.com/botpress/botpress/issues/599)) ([e5054c6](https://github.com/botpress/botpress/commit/e5054c6))
* **roles:** client-side permissions checks in the sidebar and header ([af772e5](https://github.com/botpress/botpress/commit/af772e5))




<a name="10.15.0"></a>
# [10.15.0](https://github.com/botpress/botpress/compare/v10.11.3...v10.15.0) (2018-06-07)


### Bug Fixes

* **content-manager:** action-button form should open correctly ([2062d30](https://github.com/botpress/botpress/commit/2062d30))
* **core:** fill computed data upon loading content items ([4e874fe](https://github.com/botpress/botpress/commit/4e874fe))
* **core:** improve .npmignore (ref [#513](https://github.com/botpress/botpress/issues/513)) ([d647813](https://github.com/botpress/botpress/commit/d647813))
* **core:** jumpTo jumps to the right node when specified ([e8c2455](https://github.com/botpress/botpress/commit/e8c2455))
* **core:** umm depr warning doesn't appear on start (resolve [#593](https://github.com/botpress/botpress/issues/593)) ([6512246](https://github.com/botpress/botpress/commit/6512246))
* **docs:** docs on botpress-analytics usage ([469b317](https://github.com/botpress/botpress/commit/469b317))
* **messenger:** queue: userId for messenger channel ([460c026](https://github.com/botpress/botpress/commit/460c026))
* **npmignore:** fix ignore nested folders ([64b797b](https://github.com/botpress/botpress/commit/64b797b))
* **qna:** added configuration to readme ([9666c7d](https://github.com/botpress/botpress/commit/9666c7d))
* **qna:** allow fast typing with Enter adding new question ([0de70e7](https://github.com/botpress/botpress/commit/0de70e7))
* **qna:** autofocus the initial question form ([546f9a2](https://github.com/botpress/botpress/commit/546f9a2))
* **qna:** cleanup dependencies ([99c02bb](https://github.com/botpress/botpress/commit/99c02bb))
* **qna:** cleanup log ([6518bdc](https://github.com/botpress/botpress/commit/6518bdc))
* **qna:** don't allow deleting the only question ([b16f3a8](https://github.com/botpress/botpress/commit/b16f3a8))
* **qna:** jump to node ([9c2fbe4](https://github.com/botpress/botpress/commit/9c2fbe4))
* **qna:** properly process the redirect node ([d513f24](https://github.com/botpress/botpress/commit/d513f24))
* **qna:** text renderer can be changed in config ([5111234](https://github.com/botpress/botpress/commit/5111234))
* **util-roles:** don't use parcel as its output is not es6-compatible ([25d84fb](https://github.com/botpress/botpress/commit/25d84fb))
* **util-roles:** fix resources export ([22a4732](https://github.com/botpress/botpress/commit/22a4732))
* **util-roles:** gracefully handle null for rules ([3b47ab7](https://github.com/botpress/botpress/commit/3b47ab7))
* **util-roles:** missing babel config change ([bd7bb07](https://github.com/botpress/botpress/commit/bd7bb07))


### Features

* **nlu:** hide hidden intents by default ([077da1f](https://github.com/botpress/botpress/commit/077da1f))
* **qna:** bulk import for the questions ([0d83a89](https://github.com/botpress/botpress/commit/0d83a89))
* **qna:** filter question ([70d54a6](https://github.com/botpress/botpress/commit/70d54a6))
* **qna:** Q&A module ([f79e2e8](https://github.com/botpress/botpress/commit/f79e2e8))
* **qna:** redirect to node, middleware not working yet ([d93949b](https://github.com/botpress/botpress/commit/d93949b))
* **qna:** slightly more aesthetic UI ([3617ac1](https://github.com/botpress/botpress/commit/3617ac1))
* **roles:** describe available resources ([364d6f5](https://github.com/botpress/botpress/commit/364d6f5))
* **roles:** rename resources to follow dot-separated scheme ([9469877](https://github.com/botpress/botpress/commit/9469877))
* **util-roles:** export resources with fully qualified name ([5eabd5c](https://github.com/botpress/botpress/commit/5eabd5c))




<a name="10.14.2"></a>
## [10.14.2](https://github.com/botpress/botpress/compare/v10.14.1...v10.14.2) (2018-06-07)


### Bug Fixes

* **util-roles:** missing babel config change ([bd7bb07](https://github.com/botpress/botpress/commit/bd7bb07))




<a name="10.14.1"></a>
## [10.14.1](https://github.com/botpress/botpress/compare/v10.14.0...v10.14.1) (2018-06-07)


### Bug Fixes

* **util-roles:** fix resources export ([22a4732](https://github.com/botpress/botpress/commit/22a4732))




<a name="10.14.0"></a>
# [10.14.0](https://github.com/botpress/botpress/compare/v10.13.4...v10.14.0) (2018-06-07)


### Bug Fixes

* **content-manager:** action-button form should open correctly ([2062d30](https://github.com/botpress/botpress/commit/2062d30))
* **core:** improve .npmignore (ref [#513](https://github.com/botpress/botpress/issues/513)) ([d647813](https://github.com/botpress/botpress/commit/d647813))
* **core:** umm depr warning doesn't appear on start (resolve [#593](https://github.com/botpress/botpress/issues/593)) ([6512246](https://github.com/botpress/botpress/commit/6512246))
* **util-roles:** don't use parcel as its output is not es6-compatible ([25d84fb](https://github.com/botpress/botpress/commit/25d84fb))
* **util-roles:** gracefully handle null for rules ([3b47ab7](https://github.com/botpress/botpress/commit/3b47ab7))


### Features

* **roles:** describe available resources ([364d6f5](https://github.com/botpress/botpress/commit/364d6f5))
* **roles:** rename resources to follow dot-separated scheme ([9469877](https://github.com/botpress/botpress/commit/9469877))
* **util-roles:** export resources with fully qualified name ([5eabd5c](https://github.com/botpress/botpress/commit/5eabd5c))




<a name="10.13.4"></a>
## [10.13.4](https://github.com/botpress/botpress/compare/v10.13.3...v10.13.4) (2018-06-01)


### Bug Fixes

* **messenger:** queue: userId for messenger channel ([460c026](https://github.com/botpress/botpress/commit/460c026))




<a name="10.13.3"></a>
## [10.13.3](https://github.com/botpress/botpress/compare/v10.13.2...v10.13.3) (2018-06-01)




**Note:** Version bump only for package botpress-fake-root

<a name="10.13.2"></a>
## [10.13.2](https://github.com/botpress/botpress/compare/v10.13.1...v10.13.2) (2018-06-01)




**Note:** Version bump only for package botpress-fake-root

<a name="10.13.1"></a>
## [10.13.1](https://github.com/botpress/botpress/compare/v10.13.0...v10.13.1) (2018-06-01)




**Note:** Version bump only for package botpress-fake-root

<a name="10.13.0"></a>
# [10.13.0](https://github.com/botpress/botpress/compare/v10.11.3...v10.13.0) (2018-06-01)


### Bug Fixes

* **core:** fill computed data upon loading content items ([4e874fe](https://github.com/botpress/botpress/commit/4e874fe))
* **core:** jumpTo jumps to the right node when specified ([e8c2455](https://github.com/botpress/botpress/commit/e8c2455))
* **docs:** docs on botpress-analytics usage ([469b317](https://github.com/botpress/botpress/commit/469b317))
* **qna:** added configuration to readme ([9666c7d](https://github.com/botpress/botpress/commit/9666c7d))
* **qna:** allow fast typing with Enter adding new question ([0de70e7](https://github.com/botpress/botpress/commit/0de70e7))
* **qna:** autofocus the initial question form ([546f9a2](https://github.com/botpress/botpress/commit/546f9a2))
* **qna:** cleanup dependencies ([99c02bb](https://github.com/botpress/botpress/commit/99c02bb))
* **qna:** cleanup log ([6518bdc](https://github.com/botpress/botpress/commit/6518bdc))
* **qna:** don't allow deleting the only question ([b16f3a8](https://github.com/botpress/botpress/commit/b16f3a8))
* **qna:** jump to node ([9c2fbe4](https://github.com/botpress/botpress/commit/9c2fbe4))
* **qna:** properly process the redirect node ([d513f24](https://github.com/botpress/botpress/commit/d513f24))
* **qna:** text renderer can be changed in config ([5111234](https://github.com/botpress/botpress/commit/5111234))


### Features

* **nlu:** hide hidden intents by default ([077da1f](https://github.com/botpress/botpress/commit/077da1f))
* **qna:** bulk import for the questions ([0d83a89](https://github.com/botpress/botpress/commit/0d83a89))
* **qna:** filter question ([70d54a6](https://github.com/botpress/botpress/commit/70d54a6))
* **qna:** Q&A module ([f79e2e8](https://github.com/botpress/botpress/commit/f79e2e8))
* **qna:** redirect to node, middleware not working yet ([d93949b](https://github.com/botpress/botpress/commit/d93949b))
* **qna:** slightly more aesthetic UI ([3617ac1](https://github.com/botpress/botpress/commit/3617ac1))




<a name="10.12.0"></a>
# [10.12.0](https://github.com/botpress/botpress/compare/v10.11.3...v10.12.0) (2018-06-01)


### Bug Fixes

* **core:** fill computed data upon loading content items ([4e874fe](https://github.com/botpress/botpress/commit/4e874fe))
* **core:** jumpTo jumps to the right node when specified ([e8c2455](https://github.com/botpress/botpress/commit/e8c2455))
* **docs:** docs on botpress-analytics usage ([469b317](https://github.com/botpress/botpress/commit/469b317))
* **qna:** added configuration to readme ([9666c7d](https://github.com/botpress/botpress/commit/9666c7d))
* **qna:** allow fast typing with Enter adding new question ([0de70e7](https://github.com/botpress/botpress/commit/0de70e7))
* **qna:** autofocus the initial question form ([546f9a2](https://github.com/botpress/botpress/commit/546f9a2))
* **qna:** cleanup dependencies ([99c02bb](https://github.com/botpress/botpress/commit/99c02bb))
* **qna:** cleanup log ([6518bdc](https://github.com/botpress/botpress/commit/6518bdc))
* **qna:** don't allow deleting the only question ([b16f3a8](https://github.com/botpress/botpress/commit/b16f3a8))
* **qna:** jump to node ([9c2fbe4](https://github.com/botpress/botpress/commit/9c2fbe4))
* **qna:** properly process the redirect node ([d513f24](https://github.com/botpress/botpress/commit/d513f24))
* **qna:** text renderer can be changed in config ([5111234](https://github.com/botpress/botpress/commit/5111234))


### Features

* **nlu:** hide hidden intents by default ([077da1f](https://github.com/botpress/botpress/commit/077da1f))
* **qna:** bulk import for the questions ([0d83a89](https://github.com/botpress/botpress/commit/0d83a89))
* **qna:** filter question ([70d54a6](https://github.com/botpress/botpress/commit/70d54a6))
* **qna:** Q&A module ([f79e2e8](https://github.com/botpress/botpress/commit/f79e2e8))
* **qna:** redirect to node, middleware not working yet ([d93949b](https://github.com/botpress/botpress/commit/d93949b))
* **qna:** slightly more aesthetic UI ([3617ac1](https://github.com/botpress/botpress/commit/3617ac1))
