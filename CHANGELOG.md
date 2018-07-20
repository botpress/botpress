# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

      <a name="10.24.0"></a>
# [10.24.0](https://github.com/botpress/botpress/compare/v10.23.0...v10.24.0) (2018-07-20)


### Bug Fixes

* **builtins:** change card presentation (ref [#734](https://github.com/botpress/botpress/issues/734)) ([3057446](https://github.com/botpress/botpress/commit/3057446))
* **core:** async renderers should keep messages order (resolve [#736](https://github.com/botpress/botpress/issues/736)) ([8e9449e](https://github.com/botpress/botpress/commit/8e9449e))
* **core:** correctly get author information from bots ([8f286b7](https://github.com/botpress/botpress/commit/8f286b7)), closes [/github.com/sindresorhus/is/blob/b2bb3e7d3717de9734a3881156b1f8ab00236fe9/package.json#L7-L11](https://github.com//github.com/sindresorhus/is/blob/b2bb3e7d3717de9734a3881156b1f8ab00236fe9/package.json/issues/L7-L11)
* **docs:** added tutorial for messenger configuration ([732d2e5](https://github.com/botpress/botpress/commit/732d2e5))
* **slack:** added method for update config (resolve [#705](https://github.com/botpress/botpress/issues/705)) ([fb96afd](https://github.com/botpress/botpress/commit/fb96afd))
* **telegram:** fix telegram load (resolve [#733](https://github.com/botpress/botpress/issues/733)) ([a726c9c](https://github.com/botpress/botpress/commit/a726c9c))
* **telegram:** improve stateId from telegram (resolve [#715](https://github.com/botpress/botpress/issues/715)) ([50580af](https://github.com/botpress/botpress/commit/50580af))


### Features

* **chat:** added 'ref' query into [host]/s/chat (resolve [#721](https://github.com/botpress/botpress/issues/721)) ([c5525c7](https://github.com/botpress/botpress/commit/c5525c7))
* **core:** added toast to module view props (resolve [#40](https://github.com/botpress/botpress/issues/40)) ([63c6361](https://github.com/botpress/botpress/commit/63c6361))
* **qna:** bp.qna.getQuestion function ([fbbcb23](https://github.com/botpress/botpress/commit/fbbcb23))
* **qna:** qna interception can be customized via hook ([bace4c0](https://github.com/botpress/botpress/commit/bace4c0))




      <a name="10.23.0"></a>
# [10.23.0](https://github.com/botpress/botpress/compare/v10.22.4...v10.23.0) (2018-07-13)


### Bug Fixes

* **qna:** on flow deletion or rename, QNA still works ([efd75d6](https://github.com/botpress/botpress/commit/efd75d6))
* **webpack:** change chunk spliting and improve config (resolve [#725](https://github.com/botpress/botpress/issues/725)) ([541d5fd](https://github.com/botpress/botpress/commit/541d5fd))


### Features

* **qna:** added "text_redirect" action type ([d8e6825](https://github.com/botpress/botpress/commit/d8e6825))




<a name="10.22.4"></a>
## [10.22.4](https://github.com/botpress/botpress/compare/v10.22.3...v10.22.4) (2018-07-11)


### Bug Fixes

* improper new calls ([3e7ed8f](https://github.com/botpress/botpress/commit/3e7ed8f))
* restore log archive loading using axios ([d088fc8](https://github.com/botpress/botpress/commit/d088fc8))
* **core:** ghost-sync ignores deleting missing files ([f8f7f27](https://github.com/botpress/botpress/commit/f8f7f27))
* **core:** remove now unneeded evals ([f718d92](https://github.com/botpress/botpress/commit/f718d92))
* **flow:** change a text el to an action ([474c362](https://github.com/botpress/botpress/commit/474c362))
* **logs:** remove now unneeded logs secret key ([3c57c06](https://github.com/botpress/botpress/commit/3c57c06))
* **skill:** pull choices (resolve [#711](https://github.com/botpress/botpress/issues/711)) ([d439f0a](https://github.com/botpress/botpress/commit/d439f0a))
* **slack:** made readme up to date ([3278e04](https://github.com/botpress/botpress/commit/3278e04))
* **template:** change .gitignore (resolve [#601](https://github.com/botpress/botpress/issues/601)) ([5018009](https://github.com/botpress/botpress/commit/5018009))




<a name="10.22.3"></a>
## [10.22.3](https://github.com/botpress/botpress/compare/v10.22.0...v10.22.3) (2018-07-05)


### Bug Fixes

* options not always defined across multiple botpress envs ([108d371](https://github.com/botpress/botpress/commit/108d371))
* opts might not be a function ([22cf41f](https://github.com/botpress/botpress/commit/22cf41f))
* **dialog:** handle race conditions ([9113f60](https://github.com/botpress/botpress/commit/9113f60))
* **docs:** jumps recipe should 'await' jumping to node ([3ad8619](https://github.com/botpress/botpress/commit/3ad8619))




<a name="10.22.2"></a>
## [10.22.2](https://github.com/botpress/botpress/compare/v10.22.1...v10.22.2) (2018-07-03)


### Bug Fixes

* opts might not be a function ([22cf41f](https://github.com/botpress/botpress/commit/22cf41f))




<a name="10.22.1"></a>
## [10.22.1](https://github.com/botpress/botpress/compare/v10.22.0...v10.22.1) (2018-07-03)


### Bug Fixes

* options not always defined across multiple botpress envs ([108d371](https://github.com/botpress/botpress/commit/108d371))




<a name="10.22.0"></a>
# [10.22.0](https://github.com/botpress/botpress/compare/v10.21.0...v10.22.0) (2018-07-03)


### Features

* **scheduler:** action can be async function ([ab1832a](https://github.com/botpress/botpress/commit/ab1832a))
* **scheduler:** expose bp.scheduler.add/remove ([2172f70](https://github.com/botpress/botpress/commit/2172f70))




<a name="10.21.0"></a>
# [10.21.0](https://github.com/botpress/botpress/compare/v10.17.2...v10.21.0) (2018-07-03)


### Bug Fixes

* **bench:** package.json -> private = true ([7538a44](https://github.com/botpress/botpress/commit/7538a44))
* **botfile:** added default value for hiddenHeroSection (resolve [#647](https://github.com/botpress/botpress/issues/647)) ([9d5cf80](https://github.com/botpress/botpress/commit/9d5cf80))
* **cli:** botpress init --yes inits bot in current dir (resolve [#623](https://github.com/botpress/botpress/issues/623)) ([50a1d3a](https://github.com/botpress/botpress/commit/50a1d3a))
* **code:** empty dashboard when user signed in (resolve [#635](https://github.com/botpress/botpress/issues/635)) ([41283de](https://github.com/botpress/botpress/commit/41283de))
* **content:** blank page (ref [#620](https://github.com/botpress/botpress/issues/620)) ([ecbbeda](https://github.com/botpress/botpress/commit/ecbbeda))
* **core:** content-widget placeholder shows selected item (resolve [#673](https://github.com/botpress/botpress/issues/673)) ([39c5b2c](https://github.com/botpress/botpress/commit/39c5b2c))
* **core:** enable modules config watching (resolve [#519](https://github.com/botpress/botpress/issues/519)) ([8e7393f](https://github.com/botpress/botpress/commit/8e7393f))
* **core:** fix for the user with id === 0 ([05ad1ce](https://github.com/botpress/botpress/commit/05ad1ce))
* **core:** fix utc (resolve [#494](https://github.com/botpress/botpress/issues/494)) ([780b4f2](https://github.com/botpress/botpress/commit/780b4f2))
* **core:** flowbuilder imports should match filenames ([cfebba5](https://github.com/botpress/botpress/commit/cfebba5))
* **core:** make sqlite3 optional and warn if using node v10 (ref [#526](https://github.com/botpress/botpress/issues/526)) ([a5cf727](https://github.com/botpress/botpress/commit/a5cf727))
* **core:** renderers for carousel/action-btns (resolve [#697](https://github.com/botpress/botpress/issues/697) [#634](https://github.com/botpress/botpress/issues/634)) ([a139890](https://github.com/botpress/botpress/commit/a139890))
* **core:** timeout-flow should be triggered (ref [#628](https://github.com/botpress/botpress/issues/628)) ([be433db](https://github.com/botpress/botpress/commit/be433db))
* **core:** use bot's NODE_ENV not botpress's(resolve [#591](https://github.com/botpress/botpress/issues/591)) ([6699aa1](https://github.com/botpress/botpress/commit/6699aa1))
* **docs:** sorting versions in docs header (resolve [#660](https://github.com/botpress/botpress/issues/660)) ([6d40e38](https://github.com/botpress/botpress/commit/6d40e38))
* **docs:** upgrade sprockets to avoid vulnerability ([2bf9204](https://github.com/botpress/botpress/commit/2bf9204))
* **flow:** close button in create content form (resolve [#672](https://github.com/botpress/botpress/issues/672)) ([fc0a0b1](https://github.com/botpress/botpress/commit/fc0a0b1))
* **ghost:** fix content manager ([2234b40](https://github.com/botpress/botpress/commit/2234b40))
* **janitor:** adjusted log levels ([7cd6753](https://github.com/botpress/botpress/commit/7cd6753))
* **licensing:** fix the license name in the footer ([beff44c](https://github.com/botpress/botpress/commit/beff44c))
* **logger:** migrations run fully before using logger ([8f2dd66](https://github.com/botpress/botpress/commit/8f2dd66))
* **logs:** prevent logs from jumping when loading more lines ([da34cfd](https://github.com/botpress/botpress/commit/da34cfd))
* **logs:** various fixes ([c63b22c](https://github.com/botpress/botpress/commit/c63b22c))
* **messenger:** fixes error 400 upon bot start ([48117f9](https://github.com/botpress/botpress/commit/48117f9))
* **nlu:** fixed LUIS intent resolution ([168aa9b](https://github.com/botpress/botpress/commit/168aa9b))
* **webchat:** keyframes anymation fallback for ie (resolve [#657](https://github.com/botpress/botpress/issues/657)) ([5dce355](https://github.com/botpress/botpress/commit/5dce355))
* **webpack:** change path to js files (resolve [#648](https://github.com/botpress/botpress/issues/648)) ([8a2564d](https://github.com/botpress/botpress/commit/8a2564d))
* **webpack:** improve build performance (resolve [#399](https://github.com/botpress/botpress/issues/399)) ([5616277](https://github.com/botpress/botpress/commit/5616277))


### Features

* **bench:** initial benchmark script ([0537e26](https://github.com/botpress/botpress/commit/0537e26))
* **botfile:** added variable hideHeroSection (resolve [#29](https://github.com/botpress/botpress/issues/29)) ([f9caf5f](https://github.com/botpress/botpress/commit/f9caf5f))
* **cli:** implement --inspect|-i flags for start (resolve [#91](https://github.com/botpress/botpress/issues/91)) ([e209ea1](https://github.com/botpress/botpress/commit/e209ea1))
* **cloud-roles:** bot media read-only mode ([ede9d73](https://github.com/botpress/botpress/commit/ede9d73))
* **cloud-roles:** content read-only mode ([8e49720](https://github.com/botpress/botpress/commit/8e49720))
* **cloud-roles:** flows read-only mode ([a8d89d3](https://github.com/botpress/botpress/commit/a8d89d3))
* **cloud-roles:** ghost-content read-only mode ([1799803](https://github.com/botpress/botpress/commit/1799803))
* **cloud-roles:** hide skill edit button based on perm ([492377e](https://github.com/botpress/botpress/commit/492377e))
* **cloud-roles:** hide skills dropdown according to perms ([8431799](https://github.com/botpress/botpress/commit/8431799))
* **core:** added confirm when user want go out from flow(resolve [#516](https://github.com/botpress/botpress/issues/516)) ([b7841c1](https://github.com/botpress/botpress/commit/b7841c1))
* **core:** async renderers (resolve [#349](https://github.com/botpress/botpress/issues/349)) ([bb512ab](https://github.com/botpress/botpress/commit/bb512ab))
* **core:** hostname bot listens to can be customized (resolve [#644](https://github.com/botpress/botpress/issues/644)) ([fb9c4de](https://github.com/botpress/botpress/commit/fb9c4de))
* **core:** implement auto pick content (resolve [#517](https://github.com/botpress/botpress/issues/517)) ([d100d87](https://github.com/botpress/botpress/commit/d100d87))
* **logger:** batch insert logs ([50f1052](https://github.com/botpress/botpress/commit/50f1052))
* **logs:** add logs janitor ([89ba1e8](https://github.com/botpress/botpress/commit/89ba1e8))
* **logs:** store logs in the database ([2a8031a](https://github.com/botpress/botpress/commit/2a8031a))
* **qna:** csv import/export ([394a922](https://github.com/botpress/botpress/commit/394a922))
* **release:** v10 release 🎉 ([536c297](https://github.com/botpress/botpress/commit/536c297))


### BREAKING CHANGES

* **logs:** it fails on the old botfile
and requires manual migration.
It also ignores the old log files.




<a name="10.20.1"></a>
## [10.20.1](https://github.com/botpress/botpress/compare/v10.20.0...v10.20.1) (2018-06-21)


### Bug Fixes

* **bench:** package.json -> private = true ([7538a44](https://github.com/botpress/botpress/commit/7538a44))
* **botfile:** added default value for hiddenHeroSection (resolve [#647](https://github.com/botpress/botpress/issues/647)) ([9d5cf80](https://github.com/botpress/botpress/commit/9d5cf80))
* **core:** enable modules config watching (resolve [#519](https://github.com/botpress/botpress/issues/519)) ([8e7393f](https://github.com/botpress/botpress/commit/8e7393f))
* **core:** make sqlite3 optional and warn if using node v10 (ref [#526](https://github.com/botpress/botpress/issues/526)) ([a5cf727](https://github.com/botpress/botpress/commit/a5cf727))
* **docs:** sorting versions in docs header (resolve [#660](https://github.com/botpress/botpress/issues/660)) ([6d40e38](https://github.com/botpress/botpress/commit/6d40e38))
* **webchat:** keyframes anymation fallback for ie (resolve [#657](https://github.com/botpress/botpress/issues/657)) ([5dce355](https://github.com/botpress/botpress/commit/5dce355))


### Features

* **bench:** initial benchmark script ([0537e26](https://github.com/botpress/botpress/commit/0537e26))




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
* **release:** v10 release 🎉 ([536c297](https://github.com/botpress/botpress/commit/536c297))




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

* docs ([e447cf4](https://github.com/botpress/botpress/commit/e447cf4))
* **util-roles:** can't find ./resources (resolve [#625](https://github.com/botpress/botpress/issues/625)) ([1d4c28e](https://github.com/botpress/botpress/commit/1d4c28e))




<a name="10.17.0"></a>
# [10.17.0](https://github.com/botpress/botpress/compare/v10.15.0...v10.17.0) (2018-06-10)


### Bug Fixes

* **auth:** disable auth check when login not enabled ([11347d4](https://github.com/botpress/botpress/commit/11347d4))
* **botpress-terminal:** add missing dependencies (resolve [#618](https://github.com/botpress/botpress/issues/618)) ([f71e4bf](https://github.com/botpress/botpress/commit/f71e4bf))
* **cloud-roles:** fix operation name and add more checks ([d3186d9](https://github.com/botpress/botpress/commit/d3186d9))
* **cloud-roles:** improve roles fetch throttling ([888e8c8](https://github.com/botpress/botpress/commit/888e8c8))
* **dashboard:** infinite loop fix & refresh issue ([9455970](https://github.com/botpress/botpress/commit/9455970))
* **docs:** restored API Reference ([7635f3d](https://github.com/botpress/botpress/commit/7635f3d))
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
* **init:** added readme to init-tamplate (ref [#31](https://github.com/botpress/botpress/issues/31)) ([a514d38](https://github.com/botpress/botpress/commit/a514d38))
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
* publish script fixes ([c7d7c60](https://github.com/botpress/botpress/commit/c7d7c60))
* **qna:** text renderer can be changed in config ([5111234](https://github.com/botpress/botpress/commit/5111234))
* **templates:** typo in utterance (resolve [#592](https://github.com/botpress/botpress/issues/592)) ([9a57c22](https://github.com/botpress/botpress/commit/9a57c22))
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
* **init:** added readme to init-tamplate (ref [#31](https://github.com/botpress/botpress/issues/31)) ([a514d38](https://github.com/botpress/botpress/commit/a514d38))
* **util-roles:** don't use parcel as its output is not es6-compatible ([25d84fb](https://github.com/botpress/botpress/commit/25d84fb))
* **util-roles:** gracefully handle null for rules ([3b47ab7](https://github.com/botpress/botpress/commit/3b47ab7))


### Features

* **roles:** describe available resources ([364d6f5](https://github.com/botpress/botpress/commit/364d6f5))
* **roles:** rename resources to follow dot-separated scheme ([9469877](https://github.com/botpress/botpress/commit/9469877))
* **util-roles:** export resources with fully qualified name ([5eabd5c](https://github.com/botpress/botpress/commit/5eabd5c))




<a name="10.13.4"></a>
## [10.13.4](https://github.com/botpress/botpress/compare/v10.13.3...v10.13.4) (2018-06-01)


### Bug Fixes

* publish script fixes ([c7d7c60](https://github.com/botpress/botpress/commit/c7d7c60))
* **messenger:** queue: userId for messenger channel ([460c026](https://github.com/botpress/botpress/commit/460c026))




<a name="10.13.3"></a>
## [10.13.3](https://github.com/botpress/botpress/compare/v10.13.2...v10.13.3) (2018-06-01)




**Note:** Version bump only for package undefined

<a name="10.13.2"></a>
## [10.13.2](https://github.com/botpress/botpress/compare/v10.13.1...v10.13.2) (2018-06-01)




**Note:** Version bump only for package undefined

<a name="10.13.1"></a>
## [10.13.1](https://github.com/botpress/botpress/compare/v10.13.0...v10.13.1) (2018-06-01)




**Note:** Version bump only for package undefined

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
* **templates:** typo in utterance (resolve [#592](https://github.com/botpress/botpress/issues/592)) ([9a57c22](https://github.com/botpress/botpress/commit/9a57c22))


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
* **templates:** typo in utterance (resolve [#592](https://github.com/botpress/botpress/issues/592)) ([9a57c22](https://github.com/botpress/botpress/commit/9a57c22))


### Features

* **nlu:** hide hidden intents by default ([077da1f](https://github.com/botpress/botpress/commit/077da1f))
* **qna:** bulk import for the questions ([0d83a89](https://github.com/botpress/botpress/commit/0d83a89))
* **qna:** filter question ([70d54a6](https://github.com/botpress/botpress/commit/70d54a6))
* **qna:** Q&A module ([f79e2e8](https://github.com/botpress/botpress/commit/f79e2e8))
* **qna:** redirect to node, middleware not working yet ([d93949b](https://github.com/botpress/botpress/commit/d93949b))
* **qna:** slightly more aesthetic UI ([3617ac1](https://github.com/botpress/botpress/commit/3617ac1))




<a name="10.11.1"></a>
## [10.11.1](https://github.com/botpress/botpress/compare/v10.11.0...v10.11.1) (2018-05-29)


### Bug Fixes

* **nlu:** using custom stemmer when provided ([f7f6ab5](https://github.com/botpress/botpress/commit/f7f6ab5))




<a name="10.11.0"></a>
# [10.11.0](https://github.com/botpress/botpress/compare/v10.10.0...v10.11.0) (2018-05-29)


### Bug Fixes

* **builtins:** allow $ in variable names ([4818d2e](https://github.com/botpress/botpress/commit/4818d2e))
* WordPress typo ([697b7a3](https://github.com/botpress/botpress/commit/697b7a3))
* **core:** botpress shouldn't change cwd (resolves [#52](https://github.com/botpress/botpress/issues/52)) ([14ed105](https://github.com/botpress/botpress/commit/14ed105))
* **core:** hide webchat on logout from admin-panel (resolve [#554](https://github.com/botpress/botpress/issues/554)) ([8d05b69](https://github.com/botpress/botpress/commit/8d05b69))
* **docs:** deploy tutorial link (resolve [#498](https://github.com/botpress/botpress/issues/498)) ([111279f](https://github.com/botpress/botpress/commit/111279f))


### Features

* **analytics:** graph accepts fnAvg to customize avgValue calculation ([8e8c4f6](https://github.com/botpress/botpress/commit/8e8c4f6))
* **channel-web:** carousel acts as quick-replies ([6377576](https://github.com/botpress/botpress/commit/6377576))




<a name="10.10.0"></a>
# [10.10.0](https://github.com/botpress/botpress/compare/v10.9.4...v10.10.0) (2018-05-24)


### Bug Fixes

* expand folders ([6c0387e](https://github.com/botpress/botpress/commit/6c0387e))
* fix filtering skills from the flows list ([9dcf01d](https://github.com/botpress/botpress/commit/9dcf01d))
* invalid jsdoc for CLI ([51424c9](https://github.com/botpress/botpress/commit/51424c9))
* prevent tree menu from activating the node ([f914da0](https://github.com/botpress/botpress/commit/f914da0))
* properly maintain toggled state when switching between flows ([b80ee96](https://github.com/botpress/botpress/commit/b80ee96))
* refactor ([94ddd87](https://github.com/botpress/botpress/commit/94ddd87))
* **docs:** readme ([aa97d16](https://github.com/botpress/botpress/commit/aa97d16))
* **docs:** removed global "type" in docs ([b32430d](https://github.com/botpress/botpress/commit/b32430d))
* **flows:** support slashes in URL ([2fe290f](https://github.com/botpress/botpress/commit/2fe290f))


### Features

* **content:** allow transparently batching content items requests ([bb31197](https://github.com/botpress/botpress/commit/bb31197))
* **flows:** hide the Skills list from the sidebar ([e299cf5](https://github.com/botpress/botpress/commit/e299cf5))
* **flows:** menu items ([12605b0](https://github.com/botpress/botpress/commit/12605b0))
* **flows:** sample flows in directories ([ab818ac](https://github.com/botpress/botpress/commit/ab818ac))
* **flows:** tree view ([06358de](https://github.com/botpress/botpress/commit/06358de))
* **nlu:** added ability to provide custom stemmer ([217ebe5](https://github.com/botpress/botpress/commit/217ebe5))




<a name="10.9.4"></a>
## [10.9.4](https://github.com/botpress/botpress/compare/v10.9.3...v10.9.4) (2018-05-16)


### Bug Fixes

* **builtins:** allow to change output var ([c711edb](https://github.com/botpress/botpress/commit/c711edb))




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
