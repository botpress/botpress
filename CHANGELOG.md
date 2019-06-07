## [11.9.3](https://github.com/botpress/botpress/compare/v11.9.2...v11.9.3) (2019-06-06)


### Bug Fixes

* **basic-skills:** synthax error ([04a32e4](https://github.com/botpress/botpress/commit/04a32e4))
* **core:** removed machineV1 fingerprint ([b69ea15](https://github.com/botpress/botpress/commit/b69ea15))
* **pro:** licensing on openshift ([a6ae4ff](https://github.com/botpress/botpress/commit/a6ae4ff))



## [11.9.2](https://github.com/botpress/botpress/compare/v11.9.1...v11.9.2) (2019-06-05)


### Bug Fixes

* **core:** added flow cache invalidation ([f1ca9ef](https://github.com/botpress/botpress/commit/f1ca9ef))
* **core:** missing file ([f92ae68](https://github.com/botpress/botpress/commit/f92ae68))
* **pro:** SAML authentication options ([d22bd16](https://github.com/botpress/botpress/commit/d22bd16))
* **qna:** remove qna file when qna is disabled ([1d3569f](https://github.com/botpress/botpress/commit/1d3569f))
* **qna:** remove qna file when qna is disabled ([614d66e](https://github.com/botpress/botpress/commit/614d66e))
* **slot:** fix max attempt check ([ca703e8](https://github.com/botpress/botpress/commit/ca703e8))


### Features

* **core:** add .ghostignore to exclude files from tracking ([387668e](https://github.com/botpress/botpress/commit/387668e))



## [11.9.1](https://github.com/botpress/botpress/compare/v11.9.0...v11.9.1) (2019-05-31)


### Bug Fixes

* **admin:** Enable overwrite destination on copy ([72af1e7](https://github.com/botpress/botpress/commit/72af1e7))
* **core:** fixes checksum check of ghost in DB driver ([6c45eb6](https://github.com/botpress/botpress/commit/6c45eb6))
* **nlu:** missing source value ([01abed8](https://github.com/botpress/botpress/commit/01abed8))
* **nlu:** prevent token duplicates in source ([46cd03b](https://github.com/botpress/botpress/commit/46cd03b))



# [11.9.0](https://github.com/botpress/botpress/compare/v11.8.4...v11.9.0) (2019-05-15)

### Bug Fixes

- **core:** added red-hat binaries ([1304306](https://github.com/botpress/botpress/commit/1304306))
- slot modal not loading when editing ([b1cc881](https://github.com/botpress/botpress/commit/b1cc881))
- **core:** module extraction ([f2d1c9d](https://github.com/botpress/botpress/commit/f2d1c9d))
- **core:** passing more ENV to hooks and actions ([142acb7](https://github.com/botpress/botpress/commit/142acb7))
- **core:** unpacker fall back to move if rename fails ([7aa7e01](https://github.com/botpress/botpress/commit/7aa7e01))
- **docker:** duckling run cmd ([6528f1f](https://github.com/botpress/botpress/commit/6528f1f))
- **docker:** fixed user permissions ([df42b69](https://github.com/botpress/botpress/commit/df42b69))
- **ghost:** added method to rename file & fix dir listing with dot ([9581ee0](https://github.com/botpress/botpress/commit/9581ee0))
- **module:** added permissions for modules ([3d2d92d](https://github.com/botpress/botpress/commit/3d2d92d))
- **modules:** disabling module resources when parent mod is disabled ([701af91](https://github.com/botpress/botpress/commit/701af91))
- **redis:** switch from node-redis to ioredis ([9c1239d](https://github.com/botpress/botpress/commit/9c1239d))
- **skills:** fixed slot extraction skill ([f5cd610](https://github.com/botpress/botpress/commit/f5cd610))
- **ui-studio:** better disabled toolbar items ([42f1ac3](https://github.com/botpress/botpress/commit/42f1ac3))

### Features

- **admin:** white label / custom css ([1b194a7](https://github.com/botpress/botpress/commit/1b194a7))
- **channel-web:** internationalization ([43b4ff1](https://github.com/botpress/botpress/commit/43b4ff1))
- **code-editor:** Edit actions directly in the studio ([4e11d2d](https://github.com/botpress/botpress/commit/4e11d2d))
- **sdk:** added method to enable or disable hooks (beta) ([39050d0](https://github.com/botpress/botpress/commit/39050d0))
- add reset slot action ([345d90f](https://github.com/botpress/botpress/commit/345d90f))
- conversation scenarios ([3980987](https://github.com/botpress/botpress/commit/3980987))

## [11.8.4](https://github.com/botpress/botpress/compare/v11.8.3...v11.8.4) (2019-04-30)

### Bug Fixes

- **channel-web:** added cookie fallback ([109f5f3](https://github.com/botpress/botpress/commit/109f5f3))
- **channel-web:** starting new convo when not found ([182b2d8](https://github.com/botpress/botpress/commit/182b2d8))
- jump to timeout node ([3a00dc7](https://github.com/botpress/botpress/commit/3a00dc7))
- missing typing in sdk ([ff18810](https://github.com/botpress/botpress/commit/ff18810))
- timeout fake event ([dc16c5b](https://github.com/botpress/botpress/commit/dc16c5b))
- **nlu:** training seq to use multiple entities ([d4c1947](https://github.com/botpress/botpress/commit/d4c1947))

### Features

- **dialog-engine:** set channel name dinamically ([e86ca6d](https://github.com/botpress/botpress/commit/e86ca6d))
- **nlu:** exact intent matcher given utterance ([3b1a2fe](https://github.com/botpress/botpress/commit/3b1a2fe))

## [11.8.3](https://github.com/botpress/botpress/compare/v11.8.2...v11.8.3) (2019-04-26)

### Bug Fixes

- **messenger:** body-parser require of undefined ([cbaccbc](https://github.com/botpress/botpress/commit/cbaccbc))
- **actions:** displaying the correct stack trace for actions ([15e473d](https://github.com/botpress/botpress/commit/15e473d))
- **channel-web:** bigger desc + allow markdown and html ([657da19](https://github.com/botpress/botpress/commit/657da19))
- **messenger:** messages is not iterable ([1bf9bef](https://github.com/botpress/botpress/commit/1bf9bef))
- **studio:** prevent edge case ui from crashing ([1f0ec66](https://github.com/botpress/botpress/commit/1f0ec66))
- **studio:** correct module custom icon path ([288fa92](https://github.com/botpress/botpress/commit/288fa92))

### Features

- **nlu:** multi entities slots ([fcb8d33](https://github.com/botpress/botpress/commit/fcb8d33))
- **skill-api:** add call-api skill ([6ee330c](https://github.com/botpress/botpress/commit/6ee330c))

## [11.8.2](https://github.com/botpress/botpress/compare/v11.8.1...v11.8.2) (2019-04-25)

## [11.8.1](https://github.com/botpress/botpress/compare/v11.8.0...v11.8.1) (2019-04-24)

### Bug Fixes

- **admin:** changing how languages are handled (part 1) ([e161e24](https://github.com/botpress/botpress/commit/e161e24))
- **admin:** prevent logging out when server errors ([7e7fac5](https://github.com/botpress/botpress/commit/7e7fac5))
- **bot:** normalized bot name and id ([a34e445](https://github.com/botpress/botpress/commit/a34e445))
- **channel-web:** verify if its a channel-web msg ([a07d67b](https://github.com/botpress/botpress/commit/a07d67b))
- **channel-web:** adding config to change default css ([7e70b80](https://github.com/botpress/botpress/commit/7e70b80))
- **cms:** added missing properties to simplify multilang ([e8444c4](https://github.com/botpress/botpress/commit/e8444c4))
- **cms:** logic error when fetching content renderer ([0abf0fb](https://github.com/botpress/botpress/commit/0abf0fb))
- **cms:** updating json files when deleting elements ([f98008e](https://github.com/botpress/botpress/commit/f98008e))
- **core:** added event creation time ([ee65a1c](https://github.com/botpress/botpress/commit/ee65a1c))
- **module-builder:** cleanup of assets folder wasn't working ([1ca71ec](https://github.com/botpress/botpress/commit/1ca71ec))
- **qna:** correct UI tip with list of columns in CSV to import ([8e09d98](https://github.com/botpress/botpress/commit/8e09d98))
- **skill-slot:** slots map of undefined ([c8ab14b](https://github.com/botpress/botpress/commit/c8ab14b))
- **studio:** showing understanding menu on mouse over ([b59e567](https://github.com/botpress/botpress/commit/b59e567))
- **ux:** minor ux fix when editing a node on flow editor ([3506554](https://github.com/botpress/botpress/commit/3506554))
- **ux:** prevent closing when clicking outside modal (use btn or esc) ([ab24781](https://github.com/botpress/botpress/commit/ab24781))
- ignore models in bot revs ([732ed32](https://github.com/botpress/botpress/commit/732ed32))

### Features

- **cms:** warn modules of content element changes ([da424fa](https://github.com/botpress/botpress/commit/da424fa))
- **dropdown:** added dropdown component for the webchat ([d7b0890](https://github.com/botpress/botpress/commit/d7b0890))
- **module:** allow hot reloading of modules ([46a01c5](https://github.com/botpress/botpress/commit/46a01c5))
- Bot backups & Rollback ([3265b6d](https://github.com/botpress/botpress/commit/3265b6d))

# [11.8.0](https://github.com/botpress/botpress/compare/v11.7.4...v11.8.0) (2019-04-11)

### Bug Fixes

- **build:** copy bindings to the correct folder ([c064c81](https://github.com/botpress/botpress/commit/c064c81))
- **build:** fix packaging on windows ([a7fd609](https://github.com/botpress/botpress/commit/a7fd609))
- **build:** missing dependency ([39b6a35](https://github.com/botpress/botpress/commit/39b6a35))
- **build:** use cross-env to execute pkg and module-builder ([5c0d30f](https://github.com/botpress/botpress/commit/5c0d30f))
- **channel-web:** added payload field to hide some props in db ([f6cba23](https://github.com/botpress/botpress/commit/f6cba23))
- **cms:** prevent closing of modal when clicking outside ([3b3bb59](https://github.com/botpress/botpress/commit/3b3bb59))
- **core:** fix returning to previous flow ([c5f89ce](https://github.com/botpress/botpress/commit/c5f89ce))
- **core:** handle jumpPoints not being defined ([72275dc](https://github.com/botpress/botpress/commit/72275dc))
- **core:** push of undefined lastMessages ([18faaf7](https://github.com/botpress/botpress/commit/18faaf7))
- **core:** user creation fix ([6a6eeaa](https://github.com/botpress/botpress/commit/6a6eeaa))
- **core:** user creation issue ([542e3b2](https://github.com/botpress/botpress/commit/542e3b2))
- **hitl:** fixed user attributes and minor refactoring ([a0f40bd](https://github.com/botpress/botpress/commit/a0f40bd))
- **hitl:** max length for message ([d9a06c0](https://github.com/botpress/botpress/commit/d9a06c0))
- **hitl:** use user attributes ([6af745a](https://github.com/botpress/botpress/commit/6af745a))
- **sdk:** added method to delete content elements ([320308d](https://github.com/botpress/botpress/commit/320308d))
- **skill-choice:** handle undefined keys ([5117a60](https://github.com/botpress/botpress/commit/5117a60))
- **users:** attributes were overwritten when updating ([b6cbf75](https://github.com/botpress/botpress/commit/b6cbf75))
- **webchat:** botName and enableReset options (resolve [#1572](https://github.com/botpress/botpress/issues/1572)) ([1e5e235](https://github.com/botpress/botpress/commit/1e5e235))
- **webchat:** fix postMessage target and oversending setClass ([c744594](https://github.com/botpress/botpress/commit/c744594))

### Features

- create pipeline on server start ([76a4f15](https://github.com/botpress/botpress/commit/76a4f15))
- **cms:** added multilanguage support ([90c9b96](https://github.com/botpress/botpress/commit/90c9b96))
- **NLU:** config to load models on bot mount ([565015e](https://github.com/botpress/botpress/commit/565015e))
- **skill-slot:** add slot filling skill ([79c5251](https://github.com/botpress/botpress/commit/79c5251))

## [11.7.2](https://github.com/botpress/botpress/compare/v11.7.1...v11.7.2) (2019-03-27)

### Bug Fixes

- **channel-web:** minor changes for custom components ([beaac3f](https://github.com/botpress/botpress/commit/beaac3f))
- **channel-web:** prevent quick replies click spam ([fb79775](https://github.com/botpress/botpress/commit/fb79775))
- **diagram:** fix link recreating itself when moving after deletion ([df0d2fd](https://github.com/botpress/botpress/commit/df0d2fd))
- **docs:** wrong url in version docs ([ef03259](https://github.com/botpress/botpress/commit/ef03259))
- **studio:** submit on alt + enter as stated in UI ([464ca5d](https://github.com/botpress/botpress/commit/464ca5d))

## [11.7.1](https://github.com/botpress/botpress/compare/v11.7.0...v11.7.1) (2019-03-26)

### Bug Fixes

- **core:** attach action errors to logger ([baa4cd5](https://github.com/botpress/botpress/commit/baa4cd5))
- **core:** better action errors ([6d4b54a](https://github.com/botpress/botpress/commit/6d4b54a))
- **core:** external auth wasn't using the specified algorithm ([fb1896e](https://github.com/botpress/botpress/commit/fb1896e))
- **core:** loading of deleted bots warn ([7b312bb](https://github.com/botpress/botpress/commit/7b312bb))
- **core:** updated default debug output ([58503b1](https://github.com/botpress/botpress/commit/58503b1))
- **examples:** added a catch on axios api call ([9ab43ea](https://github.com/botpress/botpress/commit/9ab43ea))
- **ghost:** added file size limit for individual files ([5596e91](https://github.com/botpress/botpress/commit/5596e91))
- **hitl:** removing limit for text saved (issue with long response) ([3393e44](https://github.com/botpress/botpress/commit/3393e44))
- **qna:** added input validation & schema ([f90c1fb](https://github.com/botpress/botpress/commit/f90c1fb))

### Features

- **core:** expose env-variables to actions ([d1ab27b](https://github.com/botpress/botpress/commit/d1ab27b))
- **hooks:** added before outgoing hook ([a9341b0](https://github.com/botpress/botpress/commit/a9341b0))

# [11.7.0](https://github.com/botpress/botpress/compare/v11.6.3...v11.7.0) (2019-03-25)

### Bug Fixes

- **admin:** added schema for profile update ([b45eb54](https://github.com/botpress/botpress/commit/b45eb54))
- **admin:** debug UI auto-expand top-level bp node ([634d989](https://github.com/botpress/botpress/commit/634d989))
- **analytics:** piechart "toFixed of undefined" ([b3ff979](https://github.com/botpress/botpress/commit/b3ff979))
- **channel-web:** fixed file upload not sending uploaded file namme ([afb5f1f](https://github.com/botpress/botpress/commit/afb5f1f))
- **config:** added configuration for media uploads ([a426d0b](https://github.com/botpress/botpress/commit/a426d0b))
- **config:** added jwt settings, allow token refresh, added status route ([5f93b0d](https://github.com/botpress/botpress/commit/5f93b0d))
- **core:** added list of modules enabled by default ([9261b06](https://github.com/botpress/botpress/commit/9261b06))
- **core:** converse default global contexts ([5199ad9](https://github.com/botpress/botpress/commit/5199ad9))
- **core:** state is loaded before all hooks ([a0aefff](https://github.com/botpress/botpress/commit/a0aefff))
- **db:** detecting database type from provided url ([fdefe24](https://github.com/botpress/botpress/commit/fdefe24))
- **dialog:** fix infinite loop when going back to a skill node ([ece1c3e](https://github.com/botpress/botpress/commit/ece1c3e))
- **dialog:** fix infinite loop when going back to a skill node ([1a7dc5b](https://github.com/botpress/botpress/commit/1a7dc5b))
- **module-builder:** undefined assigment ([8257084](https://github.com/botpress/botpress/commit/8257084))
- **nlu:** avoid extracting substring of longer entities ([e08ed56](https://github.com/botpress/botpress/commit/e08ed56))
- **nlu:** disabling duckling when unreachable on server start ([7b15cfe](https://github.com/botpress/botpress/commit/7b15cfe))
- **nlu:** disabling duckling when unreachable on server start ([3c24868](https://github.com/botpress/botpress/commit/3c24868))
- **nlu:** entities extraction fix (whole entities) ([3259547](https://github.com/botpress/botpress/commit/3259547))
- **nlu:** fix issue in certain conditions with multiple slots ([78f6bf5](https://github.com/botpress/botpress/commit/78f6bf5))
- **nlu:** map series ([c88c175](https://github.com/botpress/botpress/commit/c88c175))
- **nlu:** null pointer and avoid comparing empty strings ([6489afe](https://github.com/botpress/botpress/commit/6489afe))
- **nlu:** patterns tests ([927a9fa](https://github.com/botpress/botpress/commit/927a9fa))
- **nlu:** slot tagger fastText args ([2e1c64f](https://github.com/botpress/botpress/commit/2e1c64f))
- **qna:** categories are trimmed ([a977c9e](https://github.com/botpress/botpress/commit/a977c9e))
- **studio:** removed useless emulator settings ([3c03162](https://github.com/botpress/botpress/commit/3c03162))
- **studio:** statusBar styling ([4e5718d](https://github.com/botpress/botpress/commit/4e5718d))
- **ux:** minor ui ajustments ([c72d96a](https://github.com/botpress/botpress/commit/c72d96a))

### Features

- **builtin:** added utilities for easier context management ([96a69b9](https://github.com/botpress/botpress/commit/96a69b9))
- **channel-web:** arrow navigation ([dc31baf](https://github.com/botpress/botpress/commit/dc31baf))
- **channel-web:** convos view arrow navigation ([b6b9a4b](https://github.com/botpress/botpress/commit/b6b9a4b))
- **channel-web:** send postback data to parent page ([80994c2](https://github.com/botpress/botpress/commit/80994c2))
- **core:** add config to set default debug scopes ([cecd983](https://github.com/botpress/botpress/commit/cecd983))
- **core:** make use of the debug package ([1672e76](https://github.com/botpress/botpress/commit/1672e76))
- **debug:** added audit logging ([71b1d62](https://github.com/botpress/botpress/commit/71b1d62))
- **nlu:** fuzzy matching of list entities ([0d0292a](https://github.com/botpress/botpress/commit/0d0292a))

## [11.6.3](https://github.com/botpress/botpress/compare/v11.6.2...v11.6.3) (2019-03-18)

### Bug Fixes

- **messenger:** disable channel when not configured ([480ba6f](https://github.com/botpress/botpress/commit/480ba6f))
- **messenger:** missing packages ([01f605b](https://github.com/botpress/botpress/commit/01f605b))
- **nlu:** fix delete intents / entities on firefox ([c5ad50d](https://github.com/botpress/botpress/commit/c5ad50d))

## [11.6.2](https://github.com/botpress/botpress/compare/v11.6.1...v11.6.2) (2019-03-18)

### Bug Fixes

- **channel-web:** fix 401 issue when embedding webchat ([843cd73](https://github.com/botpress/botpress/commit/843cd73))
- **channel-web:** fixed reset conversation not working ([20cda68](https://github.com/botpress/botpress/commit/20cda68))
- **core:** fix undefined value in carousel name ([6f68875](https://github.com/botpress/botpress/commit/6f68875))
- **emulator:** displays the final decision instead of the intent ([4096a10](https://github.com/botpress/botpress/commit/4096a10))
- **emulator:** fixed issue with new session button ([885d460](https://github.com/botpress/botpress/commit/885d460))
- **messenger:** default persistent menu to [](<[f02552e](https://github.com/botpress/botpress/commit/f02552e)>)
- **messenger:** fixed webhook ([8555d42](https://github.com/botpress/botpress/commit/8555d42))
- **messenger:** fixes webhooks ([c7d8349](https://github.com/botpress/botpress/commit/c7d8349))
- **messenger:** pro ref ([923fca8](https://github.com/botpress/botpress/commit/923fca8))
- **messenger:** typings of config ([7fa5353](https://github.com/botpress/botpress/commit/7fa5353))
- **nlu:** fixed viewport issue with multiple entity utterance ([011aa92](https://github.com/botpress/botpress/commit/011aa92))
- **nlu:** only copy vector files ([4f31fbc](https://github.com/botpress/botpress/commit/4f31fbc))

### Features

- **channel-messenger:** add messenger support ([966480d](https://github.com/botpress/botpress/commit/966480d))
- **core:** debug supports sub-namespaces ([ce53321](https://github.com/botpress/botpress/commit/ce53321))
- **messenger:** Added support for Messenger Channel ([25bcd7a](https://github.com/botpress/botpress/commit/25bcd7a))
- **nlu:** added ctx filtering ([c1921f2](https://github.com/botpress/botpress/commit/c1921f2))

## [11.6.1](https://github.com/botpress/botpress/compare/v11.6.0...v11.6.1) (2019-03-11)

### Bug Fixes

- **nlu:** sync with a grace period ([c4593e0](https://github.com/botpress/botpress/commit/c4593e0))

# [11.6.0](https://github.com/botpress/botpress/compare/v11.5.1...v11.6.0) (2019-03-09)

### Bug Fixes

- **actions:** bot variable wasn't defined, and cleanup of docs ([6ac24a1](https://github.com/botpress/botpress/commit/6ac24a1))
- **admin:** license link wasn't correct ([e88ae49](https://github.com/botpress/botpress/commit/e88ae49))
- **core:** added optional nlu init in Event creation ([a9d7841](https://github.com/botpress/botpress/commit/a9d7841))
- **core:** awaiting queuing of the messages ([fb153e9](https://github.com/botpress/botpress/commit/fb153e9))
- **core:** checkBotVisibility skip if global route ([21060f6](https://github.com/botpress/botpress/commit/21060f6))
- **core:** crash when migrations folder missing ([c94f255](https://github.com/botpress/botpress/commit/c94f255))
- **core:** getBotsIds extra asterisk ([996196b](https://github.com/botpress/botpress/commit/996196b))
- **core:** loading of external modules ([c235440](https://github.com/botpress/botpress/commit/c235440))
- **core:** lookup private modules path as well ([346984b](https://github.com/botpress/botpress/commit/346984b))
- **core:** native ext bad path ([68e2d07](https://github.com/botpress/botpress/commit/68e2d07))
- **core:** native extension linux lookup ([0ef8e3c](https://github.com/botpress/botpress/commit/0ef8e3c))
- **core:** sdk getAllUsers return attributes ([3ecdee5](https://github.com/botpress/botpress/commit/3ecdee5))
- **core:** session enabled might be undefined ([b159ad5](https://github.com/botpress/botpress/commit/b159ad5))
- **core:** session warn ([8de186b](https://github.com/botpress/botpress/commit/8de186b))
- **flow:** fixed flow-wide links that picked selected node instead ([462b1cc](https://github.com/botpress/botpress/commit/462b1cc))
- **gulp:** fixed command to link module assets when developing ([f3ada55](https://github.com/botpress/botpress/commit/f3ada55))
- **hitl:** main bugs ([d07b5df](https://github.com/botpress/botpress/commit/d07b5df))
- **hitl:** main bugs ([06431ea](https://github.com/botpress/botpress/commit/06431ea))
- **nlu:** extract API endpoint ([ee1cb2f](https://github.com/botpress/botpress/commit/ee1cb2f))
- **nlu:** fix slot issues (no color, can't pick) ([64083c7](https://github.com/botpress/botpress/commit/64083c7))
- **nlu:** slot tagger clustering ([b074a1b](https://github.com/botpress/botpress/commit/b074a1b))
- **qna:** automatically remove duplicated questions ([78e3bff](https://github.com/botpress/botpress/commit/78e3bff))
- **sdk:** dialogEngine processEvent return type ([51133d4](https://github.com/botpress/botpress/commit/51133d4))
- **single_choice:** parse answer with nlu ([f75c085](https://github.com/botpress/botpress/commit/f75c085))
- **single_choice:** parse answer with nlu ([fb90fc5](https://github.com/botpress/botpress/commit/fb90fc5))
- **skill-choice:** comparison issue for some events ([8595b63](https://github.com/botpress/botpress/commit/8595b63))
- **studio:** CMS buttons unresponsive in flow editor ([ea4c056](https://github.com/botpress/botpress/commit/ea4c056))
- **studio:** emulator better reset shortcut ([b9e9812](https://github.com/botpress/botpress/commit/b9e9812))
- **studio:** react warnings ([6cdfc8d](https://github.com/botpress/botpress/commit/6cdfc8d))
- **web:** injection delay before adding css ([2501b27](https://github.com/botpress/botpress/commit/2501b27))
- **webchat:** reduced size of bundle by 1mb ([fbbc861](https://github.com/botpress/botpress/commit/fbbc861))

### Features

- **admin:** added tab option to use the full page width ([5aed5ed](https://github.com/botpress/botpress/commit/5aed5ed))
- **admin:** added tab option to use the full page width ([eb99b72](https://github.com/botpress/botpress/commit/eb99b72))
- **alerting:** triggers a hook when threshold exceeded ([18dbb0e](https://github.com/botpress/botpress/commit/18dbb0e))
- **alerting:** triggers a hook when threshold exceeded ([d69742f](https://github.com/botpress/botpress/commit/d69742f))
- **bot:** added more configuration options & details ([2c584ed](https://github.com/botpress/botpress/commit/2c584ed))
- **bot:** added more configuration options & details ([2c6f090](https://github.com/botpress/botpress/commit/2c6f090))
- **channel-web:** added custom components support ([732f2b6](https://github.com/botpress/botpress/commit/732f2b6))
- **channel-web:** added custom components support ([9640d15](https://github.com/botpress/botpress/commit/9640d15))
- **channel-web:** added methods to override visual components ([2cfeeb5](https://github.com/botpress/botpress/commit/2cfeeb5))
- **channels:** initial telegram implementation ([f231ee3](https://github.com/botpress/botpress/commit/f231ee3))
- **core:** add proxy support for external calls ([c3432ec](https://github.com/botpress/botpress/commit/c3432ec))
- **core:** add proxy support for external calls ([56dc84d](https://github.com/botpress/botpress/commit/56dc84d))
- **core:** added to 'flowGenerator' second parameter with metadata ([bc7640b](https://github.com/botpress/botpress/commit/bc7640b))
- **core:** added to 'flowGenerator' second parameter with metadata ([d04d0ff](https://github.com/botpress/botpress/commit/d04d0ff))
- **core:** change 'flowGenerator' to async method ([6e0330c](https://github.com/botpress/botpress/commit/6e0330c))
- **core:** change 'flowGenerator' to async method ([cdf4bf2](https://github.com/botpress/botpress/commit/cdf4bf2))
- **core:** native extensions allow for multiple distributions ([41b1d24](https://github.com/botpress/botpress/commit/41b1d24))
- **credentials:** added external auth support for secure communication ([ccaa3b6](https://github.com/botpress/botpress/commit/ccaa3b6))
- **credentials:** added external auth support for secure communication ([52a7776](https://github.com/botpress/botpress/commit/52a7776))
- **emulator:** added possibility to send raw payload ([fb45615](https://github.com/botpress/botpress/commit/fb45615))
- **logs:** added file output for logs ([f65ea28](https://github.com/botpress/botpress/commit/f65ea28))
- **logs:** added file output for logs ([8426e02](https://github.com/botpress/botpress/commit/8426e02))
- **monitoring:** added multi-node monitoring system ([f4ebfd5](https://github.com/botpress/botpress/commit/f4ebfd5))
- **monitoring:** added multi-node monitoring system ([9308b58](https://github.com/botpress/botpress/commit/9308b58))
- **nlu:** added a couple of pretrained language models ([b27f68c](https://github.com/botpress/botpress/commit/b27f68c))
- **nlu:** added confusion mapping ([24359c8](https://github.com/botpress/botpress/commit/24359c8))
- **nlu:** backend impl of confusion matrix ([ba9da63](https://github.com/botpress/botpress/commit/ba9da63))
- **nlu:** fastText overrides ([66193c3](https://github.com/botpress/botpress/commit/66193c3))
- **nlu:** masking sensitive text for entities ([3b8a910](https://github.com/botpress/botpress/commit/3b8a910))
- **nlu:** masking sensitive text for entities ([cd3312a](https://github.com/botpress/botpress/commit/cd3312a))
- **nlu:** using pretrained word vectors ([135083d](https://github.com/botpress/botpress/commit/135083d))
- conditional http session ([29cb4ca](https://github.com/botpress/botpress/commit/29cb4ca))
- enable templating in content element formData ([9911217](https://github.com/botpress/botpress/commit/9911217))
- **reboot:** added method & config to reboot server ([7b38b6e](https://github.com/botpress/botpress/commit/7b38b6e))
- **reboot:** added method & config to reboot server ([9c596f7](https://github.com/botpress/botpress/commit/9c596f7))
- **sdk:** file manager is exposed via the sdk ([08edf20](https://github.com/botpress/botpress/commit/08edf20))
- **security:** logging security events ([3973cc7](https://github.com/botpress/botpress/commit/3973cc7))
- **security:** logging security events ([e35bcd0](https://github.com/botpress/botpress/commit/e35bcd0))
- **web:** customizable css ([f9d3358](https://github.com/botpress/botpress/commit/f9d3358))
- **web:** implemented timezone (resolve [#1415](https://github.com/botpress/botpress/issues/1415)) ([24e7793](https://github.com/botpress/botpress/commit/24e7793))
- **web:** implemented timezone (resolve [#1415](https://github.com/botpress/botpress/issues/1415)) ([d376b87](https://github.com/botpress/botpress/commit/d376b87))
- **webchat:** start page ([41c661b](https://github.com/botpress/botpress/commit/41c661b))

## [11.5.1](https://github.com/botpress/botpress/compare/v11.4.2...v11.5.1) (2019-02-21)

### Bug Fixes

- **actions:** added missing shortcuts when parsing actions ([3a2730d](https://github.com/botpress/botpress/commit/3a2730d))
- **actions:** random issue where no metadata in cache ([4bdc28c](https://github.com/botpress/botpress/commit/4bdc28c))
- **admin:** update license key when use on this server ([a226324](https://github.com/botpress/botpress/commit/a226324))
- **admin-ui:** on invalid token, logout user ([581126b](https://github.com/botpress/botpress/commit/581126b))
- **analytics:** upgrade module to work with 11.x ([3b92364](https://github.com/botpress/botpress/commit/3b92364))
- **builtin:** include actions folder ([d2d4c60](https://github.com/botpress/botpress/commit/d2d4c60))
- **builtins:** allow choices with 1 item ([6db2843](https://github.com/botpress/botpress/commit/6db2843))
- **cms:** added event argument for element rendering ([063af8e](https://github.com/botpress/botpress/commit/063af8e))
- **converse-api:** fixed unsecured converse api metadata ([2c790c1](https://github.com/botpress/botpress/commit/2c790c1))
- **converse-api:** proper filtering, documentation ([9551543](https://github.com/botpress/botpress/commit/9551543))
- **core:** added decision details to decision engine ([da8ab79](https://github.com/botpress/botpress/commit/da8ab79))
- **core:** builtins were not ghosted on startup ([c957984](https://github.com/botpress/botpress/commit/c957984))
- **core:** creating new flow broken ([843cac7](https://github.com/botpress/botpress/commit/843cac7))
- **core:** decision engine not continuing processing flow in QnA jumps ([1fb3682](https://github.com/botpress/botpress/commit/1fb3682))
- **core:** made all routes async ([5d385c6](https://github.com/botpress/botpress/commit/5d385c6))
- **core:** per-bot module config ([40625cb](https://github.com/botpress/botpress/commit/40625cb))
- **core:** rendering of mustache ([7b866a5](https://github.com/botpress/botpress/commit/7b866a5))
- **core:** rephrase cluster warning ([eee3d47](https://github.com/botpress/botpress/commit/eee3d47))
- **core:** standard customRouter for async routes ([6d490b8](https://github.com/botpress/botpress/commit/6d490b8))
- **decision:** fixed suggestions ordering before election ([f579a6d](https://github.com/botpress/botpress/commit/f579a6d))
- **dialog:** clear to fix inconsistent state + add missing arg ([da55219](https://github.com/botpress/botpress/commit/da55219))
- **docs:** version control admin url ([7b02e6a](https://github.com/botpress/botpress/commit/7b02e6a))
- **ghost:** reloading config from the ghost if enabled ([d04c4af](https://github.com/botpress/botpress/commit/d04c4af))
- **nlu:** adding the filename to show more context around empty intent ([ee11896](https://github.com/botpress/botpress/commit/ee11896))
- **nlu:** allow custom fasttext.node binding (resolve [#1171](https://github.com/botpress/botpress/issues/1171)) ([3a16249](https://github.com/botpress/botpress/commit/3a16249))
- **nlu:** background sync task ([12dac0c](https://github.com/botpress/botpress/commit/12dac0c))
- **nlu:** don't prefetch NLU models on init ([161963d](https://github.com/botpress/botpress/commit/161963d))
- **nlu:** fixed naming ([fd3e4e2](https://github.com/botpress/botpress/commit/fd3e4e2))
- **nlu:** floating promise race condition ([c140dc6](https://github.com/botpress/botpress/commit/c140dc6))
- **nlu:** intent election ([f1935a5](https://github.com/botpress/botpress/commit/f1935a5))
- **nlu:** loading of multi-model intents ([723b6d6](https://github.com/botpress/botpress/commit/723b6d6))
- **nlu:** prevent nlu processing if no text ([65cd6e0](https://github.com/botpress/botpress/commit/65cd6e0))
- **nlu:** queue multiple sync calls ([6023927](https://github.com/botpress/botpress/commit/6023927))
- **NLU:** sync & save nlu background sync ([76520f2](https://github.com/botpress/botpress/commit/76520f2))
- **qna:** correctly selecting global and ui ajustments ([f9faad6](https://github.com/botpress/botpress/commit/f9faad6))
- nlu cleanup of old models ([273d4a9](https://github.com/botpress/botpress/commit/273d4a9))
- **qna:** removed sync on mount and made non-blocking ([804f0ec](https://github.com/botpress/botpress/commit/804f0ec))
- **qna:** token wasn't refreshed for module ([f4727a5](https://github.com/botpress/botpress/commit/f4727a5))
- **studio:** nlu active link ([9285023](https://github.com/botpress/botpress/commit/9285023))
- **tests:** ghost service ([10959be](https://github.com/botpress/botpress/commit/10959be))
- **ui:** sidebar navlink ([10d9190](https://github.com/botpress/botpress/commit/10d9190))
- **ui:** window title includes bot name ([728be2a](https://github.com/botpress/botpress/commit/728be2a))

### Features

- **core:** implemented migration ([ccadf5f](https://github.com/botpress/botpress/commit/ccadf5f))

## [11.4.2](https://github.com/botpress/botpress/compare/v11.4.1...v11.4.2) (2019-02-02)

### Bug Fixes

- **admin:** nodes parsing & ensure fingerprint ([1670eb1](https://github.com/botpress/botpress/commit/1670eb1))
- **admin-ui:** better usage of firebase ([f14e8fb](https://github.com/botpress/botpress/commit/f14e8fb))
- **bot-templates:** added basic content types for empty bot ([13bbd48](https://github.com/botpress/botpress/commit/13bbd48))
- **bot-templates:** added basic content types for empty bot ([81c2bba](https://github.com/botpress/botpress/commit/81c2bba))
- **core:** ghost content on postgres ([9ccacc6](https://github.com/botpress/botpress/commit/9ccacc6))
- **flow:** now clearer that transition node is optional ([3af2e49](https://github.com/botpress/botpress/commit/3af2e49))
- **flow:** now clearer that transition node is optional ([3af8cbb](https://github.com/botpress/botpress/commit/3af8cbb))
- **nlu:** fixed unnecessary syncs ([54736d9](https://github.com/botpress/botpress/commit/54736d9))
- **nlu:** focus first box on enter ([9cd7e24](https://github.com/botpress/botpress/commit/9cd7e24))
- **qna:** added a check to prevent duplicated qna ([be359be](https://github.com/botpress/botpress/commit/be359be))
- **qna:** added a check to prevent duplicated qna ([9beeabd](https://github.com/botpress/botpress/commit/9beeabd))
- **qna:** default categories ([12a8c72](https://github.com/botpress/botpress/commit/12a8c72))
- **qna:** default categories ([0856e0e](https://github.com/botpress/botpress/commit/0856e0e))
- **qna:** styling fixes ([45ac054](https://github.com/botpress/botpress/commit/45ac054))
- **qna:** update references to a node when its name change ([4b7ecbc](https://github.com/botpress/botpress/commit/4b7ecbc))
- **ui:** display nb of catchalls in flow ([0b38455](https://github.com/botpress/botpress/commit/0b38455))

### Features

- **core:** notify the end-user when an error has occurred in the dialog engine ([ad78502](https://github.com/botpress/botpress/commit/ad78502))
- **emulator:** added shortcut to reset session ([7bfb405](https://github.com/botpress/botpress/commit/7bfb405))
- **emulator:** added shortcut to reset session ([805cd3a](https://github.com/botpress/botpress/commit/805cd3a))
- **emulator:** added shortcuts from emulator to intent/qna + flow ed ([9c1959c](https://github.com/botpress/botpress/commit/9c1959c))
- **emulator:** added shortcuts from emulator to intent/qna + flow ed ([7c542b6](https://github.com/botpress/botpress/commit/7c542b6))
- **emulator:** added toggle button for typing indicator ([c752a16](https://github.com/botpress/botpress/commit/c752a16))
- **emulator:** added toggle button for typing indicator ([55216af](https://github.com/botpress/botpress/commit/55216af))

## [11.4.1](https://github.com/botpress/botpress/compare/v11.3.0...v11.4.1) (2019-01-31)

### Bug Fixes

- **channel-web:** fixed event params and removed unnecessary db call ([17671fc](https://github.com/botpress/botpress/commit/17671fc))
- **channel-web:** fixed event params and removed unnecessary db call ([f0511ef](https://github.com/botpress/botpress/commit/f0511ef))
- **core:** check if bot is mounted ([19a5468](https://github.com/botpress/botpress/commit/19a5468))
- **core:** fastText fix on linux/docker ([7d8a84b](https://github.com/botpress/botpress/commit/7d8a84b))
- **core:** ghost syncs all dirs ([ab90df6](https://github.com/botpress/botpress/commit/ab90df6))
- **core:** jumpTo executes the target flow catchAll transitions ([6e70f4c](https://github.com/botpress/botpress/commit/6e70f4c))
- **core:** load non-required module config-keys from env-variables ([00d2c22](https://github.com/botpress/botpress/commit/00d2c22))
- **core:** pkg-fs copy files with dot ([bad858b](https://github.com/botpress/botpress/commit/bad858b))
- **core:** require modules and files.. fixes [#1258](https://github.com/botpress/botpress/issues/1258) fixes [#1252](https://github.com/botpress/botpress/issues/1252) ([1f23221](https://github.com/botpress/botpress/commit/1f23221))
- **db:** mem leak caused by wrong data type for channel user attributes ([b2c5017](https://github.com/botpress/botpress/commit/b2c5017))
- **db:** mem leak caused by wrong data type for channel user attributes ([f64197d](https://github.com/botpress/botpress/commit/f64197d))
- **dialog-engine:** skip transitions that contain the active node ([bd5f449](https://github.com/botpress/botpress/commit/bd5f449))
- **docs:** fix cross-links in docs (resolve [#1235](https://github.com/botpress/botpress/issues/1235)) ([234ea40](https://github.com/botpress/botpress/commit/234ea40))
- **docs:** fix cross-links in docs (resolve [#1235](https://github.com/botpress/botpress/issues/1235)) ([787300d](https://github.com/botpress/botpress/commit/787300d))
- **docs:** try fixing links in tutorial (ref [#1235](https://github.com/botpress/botpress/issues/1235)) ([5383372](https://github.com/botpress/botpress/commit/5383372))
- **docs:** try fixing links in tutorial (ref [#1235](https://github.com/botpress/botpress/issues/1235)) ([db828f3](https://github.com/botpress/botpress/commit/db828f3))
- **docs:** typo in README ([9bdd884](https://github.com/botpress/botpress/commit/9bdd884))
- **module-builder:** copy files starting with dot ([e2e308b](https://github.com/botpress/botpress/commit/e2e308b))
- **nlu:** better error on invalid JSON ([e9aa45e](https://github.com/botpress/botpress/commit/e9aa45e))
- **nlu:** faster faster faster ([453355b](https://github.com/botpress/botpress/commit/453355b))
- **nlu:** fix train on intent delete ([d6fb4cd](https://github.com/botpress/botpress/commit/d6fb4cd))
- **nlu:** logs on EPIPE error + instructions on fixing it ([2f01183](https://github.com/botpress/botpress/commit/2f01183))
- **nlu:** logs on EPIPE error + instructions on fixing it (fix [#1171](https://github.com/botpress/botpress/issues/1171)) ([b24ae2e](https://github.com/botpress/botpress/commit/b24ae2e))
- **nlu:** scrollbar styling ([176fa03](https://github.com/botpress/botpress/commit/176fa03))
- **NLU:** concurrent trainings ([83b9545](https://github.com/botpress/botpress/commit/83b9545))
- **NLU:** various fixes => see desc ([db04ed8](https://github.com/botpress/botpress/commit/db04ed8))
- **qna:** better error reporting ([9c86656](https://github.com/botpress/botpress/commit/9c86656))
- **qna:** fix qna train ([98a66fd](https://github.com/botpress/botpress/commit/98a66fd))
- **qna:** textual input bad ux ([5b9659e](https://github.com/botpress/botpress/commit/5b9659e))
- **qna:** textual input bad ux ([9c74674](https://github.com/botpress/botpress/commit/9c74674))
- **studio:** default status bar color ([1632f1d](https://github.com/botpress/botpress/commit/1632f1d))
- create bot using ghost to copy template files and bot config ([7135e83](https://github.com/botpress/botpress/commit/7135e83))
- tag slot on click ([6927123](https://github.com/botpress/botpress/commit/6927123))
- typo in bot template tsdoc ([8d81964](https://github.com/botpress/botpress/commit/8d81964))
- various ghost issues ([ef90bf6](https://github.com/botpress/botpress/commit/ef90bf6))

### Features

- **admin:** list collaborators by roles ([697a349](https://github.com/botpress/botpress/commit/697a349))
- **converse:** add secured route ([f838fa6](https://github.com/botpress/botpress/commit/f838fa6))
- **core:** add distributed job service ([2004e35](https://github.com/botpress/botpress/commit/2004e35))
- **core:** benchmark CLI tool ([b68f39a](https://github.com/botpress/botpress/commit/b68f39a))
- **core:** embedded contextual documentation ([abe4ad2](https://github.com/botpress/botpress/commit/abe4ad2))
- **core:** ghost pull from cli ([74cb15c](https://github.com/botpress/botpress/commit/74cb15c))
- **core:** migrate bots, users and roles to filesystem ([2aef7bb](https://github.com/botpress/botpress/commit/2aef7bb))
- **flow:** added builtin transitions ([8fc3710](https://github.com/botpress/botpress/commit/8fc3710))
- **flow:** added builtin transitions ([3ee982a](https://github.com/botpress/botpress/commit/3ee982a))
- **qna:** add multiline support, ux adjustments ([91cc5f4](https://github.com/botpress/botpress/commit/91cc5f4))
- **web:** added config var for message length (resolve [#1298](https://github.com/botpress/botpress/issues/1298)) ([a442b43](https://github.com/botpress/botpress/commit/a442b43))
- **web:** added config var for message length (resolve [#1298](https://github.com/botpress/botpress/issues/1298)) ([990d542](https://github.com/botpress/botpress/commit/990d542))
- **web-channel:** add an option to hide the conversations button ([d58158a](https://github.com/botpress/botpress/commit/d58158a))
- **web-channel:** add an option to hide the conversations button ([972b8a4](https://github.com/botpress/botpress/commit/972b8a4))

# [11.3.0](https://github.com/botpress/botpress/compare/v11.2.0...v11.3.0) (2018-12-19)

### Bug Fixes

- **dialog-engine:** return to calling node support ([d1f92c8](https://github.com/botpress/botpress/commit/d1f92c8))
- **dialog-engine:** return to calling node support ([f816be7](https://github.com/botpress/botpress/commit/f816be7))
- **nlu:** fix entity search ([8585f0a](https://github.com/botpress/botpress/commit/8585f0a))
- **nlu:** tests ([a85076f](https://github.com/botpress/botpress/commit/a85076f))
- **qna:** rename routes for restful ones ([b3856e4](https://github.com/botpress/botpress/commit/b3856e4))
- **qna:** support multiple answers in csv ([0400cb1](https://github.com/botpress/botpress/commit/0400cb1))
- **style:** emulator inspector background ([38e1926](https://github.com/botpress/botpress/commit/38e1926))

### Features

- **core:** added way to disable hook/action ([30436e9](https://github.com/botpress/botpress/commit/30436e9))
- **nlu:** added recast integration example and docs ([ebc18fe](https://github.com/botpress/botpress/commit/ebc18fe))
- **qna:** add multiple answers and UI revamp ([ac19bdb](https://github.com/botpress/botpress/commit/ac19bdb))
- **qna:** revamp ui and add answer variations ([7f1bf21](https://github.com/botpress/botpress/commit/7f1bf21))
- **studio:** New chat Emulator ([b73ca7c](https://github.com/botpress/botpress/commit/b73ca7c))

# [11.2.0](https://github.com/botpress/botpress/compare/v11.1.0...v11.2.0) (2018-12-12)

### Bug Fixes

- **core:** don't send suggested replies when in middle of flow ([5248bc2](https://github.com/botpress/botpress/commit/5248bc2))
- **docs:** typo in releas notes (resolve [#1181](https://github.com/botpress/botpress/issues/1181)) ([#1198](https://github.com/botpress/botpress/issues/1198)) ([1ada3c3](https://github.com/botpress/botpress/commit/1ada3c3))
- **knowledge:** changed answer template ([d28a4dd](https://github.com/botpress/botpress/commit/d28a4dd))
- **knowledge:** chmod +x ([7524624](https://github.com/botpress/botpress/commit/7524624))
- **knowledge:** FT parameters ([827124c](https://github.com/botpress/botpress/commit/827124c))
- **knowledge:** FT params ([f8c7f98](https://github.com/botpress/botpress/commit/f8c7f98))
- **knowledge:** multi-sample labels ([0188f23](https://github.com/botpress/botpress/commit/0188f23))
- **knowledge:** new line ([51693ac](https://github.com/botpress/botpress/commit/51693ac))
- **nlu:** crfsuite is silent ([514ab71](https://github.com/botpress/botpress/commit/514ab71))
- **studio:** upgrade react-router to 4.4.0-beta.6 due to NavLink issue ([874ba38](https://github.com/botpress/botpress/commit/874ba38))
- **studio:** upgrade react-router to 4.4.0-beta.6 due to NavLink issues ([5de371c](https://github.com/botpress/botpress/commit/5de371c))
- **tests:** failing kvs test ([fdebe39](https://github.com/botpress/botpress/commit/fdebe39))
- **tests:** seeding after creation and correctly cleanup after ([d4fa3c5](https://github.com/botpress/botpress/commit/d4fa3c5))
- **tests:** seeding after creation and correctly cleanup after ([d5f771a](https://github.com/botpress/botpress/commit/d5f771a))

### Features

- release v11.1 ([70b5020](https://github.com/botpress/botpress/commit/70b5020))
- **cms:** new manager, added modified on, small bug fix, cleanup ([af6fe86](https://github.com/botpress/botpress/commit/af6fe86))
- **cms:** new manager, added modified on, small bug fix, cleanup ([ce96e70](https://github.com/botpress/botpress/commit/ce96e70))
- **knowledge:** basic knowledge index of PDF ([da95bd3](https://github.com/botpress/botpress/commit/da95bd3))
- **nlu:** create custom entities ([64b3571](https://github.com/botpress/botpress/commit/64b3571))
- **state-manager:** now loading bot-specific variables automatically ([8761846](https://github.com/botpress/botpress/commit/8761846))
- **state-manager:** now loading bot-specific variables automatically ([61426f2](https://github.com/botpress/botpress/commit/61426f2))
- **studio:** add collapsible side bar ([acd794b](https://github.com/botpress/botpress/commit/acd794b))
- **studio:** add status bar and display nlu status ([d223aa8](https://github.com/botpress/botpress/commit/d223aa8))
- **templates:** added bot templates and features to modules ([f27f11b](https://github.com/botpress/botpress/commit/f27f11b))

# [11.1.0](https://github.com/botpress/botpress/compare/v11.0.4...v11.1.0) (2018-11-28)

### Bug Fixes

- **actions:** added metadata to hide actions in flow editor ([0708e0c](https://github.com/botpress/botpress/commit/0708e0c))
- **build:** watch studio was cleaning the build ([5c2cb4a](https://github.com/botpress/botpress/commit/5c2cb4a))
- **cache:** fixed paths and ajusted invalidator (ignored not working) ([2da8ced](https://github.com/botpress/botpress/commit/2da8ced))
- **channel-web:** avoir displaying undefined and visits in transcripts ([1ab9097](https://github.com/botpress/botpress/commit/1ab9097))
- **channel-web:** empty messages are no longer sent ([1767d75](https://github.com/botpress/botpress/commit/1767d75))
- **channel-web:** preventing the ui buttons from disappearing ([c82a347](https://github.com/botpress/botpress/commit/c82a347))
- **channel-web:** preventing the ui buttons from disappearing ([770dabb](https://github.com/botpress/botpress/commit/770dabb))
- **cms:** added missing where condition ([bc5fc85](https://github.com/botpress/botpress/commit/bc5fc85))
- **converse:** circular reference when there is a timeout ([cec0950](https://github.com/botpress/botpress/commit/cec0950))
- **converse:** circular reference when there is a timeout ([0840e3d](https://github.com/botpress/botpress/commit/0840e3d))
- **core:** bot routers await ([0130d46](https://github.com/botpress/botpress/commit/0130d46))
- **core:** issue when deleting a bot ([70e5998](https://github.com/botpress/botpress/commit/70e5998))
- **core:** performance boost & monitoring tools ([88cce21](https://github.com/botpress/botpress/commit/88cce21))
- **core:** reset nb of conversations after forget ([311ff48](https://github.com/botpress/botpress/commit/311ff48))
- **core:** reset nb of conversations after forget ([0a44c55](https://github.com/botpress/botpress/commit/0a44c55))
- **dialog-engine:** queue not processed correctly ([03bc2ab](https://github.com/botpress/botpress/commit/03bc2ab))
- **docs:** corrected path to assets ([0963d93](https://github.com/botpress/botpress/commit/0963d93))
- **docs:** corrected path to assets ([73235a1](https://github.com/botpress/botpress/commit/73235a1))
- **engine:** add wait for message support ([6e098ca](https://github.com/botpress/botpress/commit/6e098ca))
- **engine:** add wait for message support ([93758ff](https://github.com/botpress/botpress/commit/93758ff))
- **flow:** allow empty transition to node and clear error ([514eacb](https://github.com/botpress/botpress/commit/514eacb))
- **hooks:** removed hook from cached scripts ([6ecc36a](https://github.com/botpress/botpress/commit/6ecc36a))
- **http:** using environment port if defined ([e91a0fe](https://github.com/botpress/botpress/commit/e91a0fe))
- **http:** using environment port if defined ([851a686](https://github.com/botpress/botpress/commit/851a686))
- **login:** handleError was swallowing errors ([66ff4b3](https://github.com/botpress/botpress/commit/66ff4b3))
- **login:** handleError was swallowing errors ([b3acbee](https://github.com/botpress/botpress/commit/b3acbee))
- **login:** problem when logging in and password is expired ([394ed10](https://github.com/botpress/botpress/commit/394ed10))
- **login:** problem when logging in and password is expired ([6b82d58](https://github.com/botpress/botpress/commit/6b82d58))
- **misc:** minor fix to remove console warnings, and added keys ([f5b6abf](https://github.com/botpress/botpress/commit/f5b6abf))
- **nlu:** default confidence config ([b62f229](https://github.com/botpress/botpress/commit/b62f229))
- **nlu:** default confidence config ([1d49d55](https://github.com/botpress/botpress/commit/1d49d55))
- **nlu:** hidden intents checkbox now displayed correctly ([c8dd33e](https://github.com/botpress/botpress/commit/c8dd33e))
- **nlu-module:** fix rasa provider where q param is undefined ([481cc6a](https://github.com/botpress/botpress/commit/481cc6a))
- **nlu-module:** fix rasa provider where q param is undefined ([160c2cc](https://github.com/botpress/botpress/commit/160c2cc))
- **performance:** various adjustments for better perfs ([50fedce](https://github.com/botpress/botpress/commit/50fedce))
- **pro:** removed misleading license warning ([46407b8](https://github.com/botpress/botpress/commit/46407b8))
- **qna:** linked label to checkbox and added null check ([8f0f727](https://github.com/botpress/botpress/commit/8f0f727))
- **skill-choice:** changed actions name ([c59f0aa](https://github.com/botpress/botpress/commit/c59f0aa))
- **skill-choice:** fixed issue with skill choice ([6a01aff](https://github.com/botpress/botpress/commit/6a01aff))
- **skill-choice:** prevent skill from auto-linking to entry node ([9acc12a](https://github.com/botpress/botpress/commit/9acc12a))
- **studio:** skills are no longer displayed as subflows ([4a4cd1e](https://github.com/botpress/botpress/commit/4a4cd1e))
- **ui:** support formfeedback in bot edit and creation ([be62a77](https://github.com/botpress/botpress/commit/be62a77))
- **ux:** minor ajustments to different elements ([ad4f43d](https://github.com/botpress/botpress/commit/ad4f43d))

### Features

- **channel-web:** recall old messages with arrows ([e187d1e](https://github.com/botpress/botpress/commit/e187d1e))
- **channel-web:** recall old messages with arrows ([b34c688](https://github.com/botpress/botpress/commit/b34c688))
- **config:** added a way to configure an external url ([be33fa8](https://github.com/botpress/botpress/commit/be33fa8))
- **config:** added a way to configure an external url ([55ba887](https://github.com/botpress/botpress/commit/55ba887))
- **core:** add converse api ([de098dd](https://github.com/botpress/botpress/commit/de098dd))
- **core:** add the converse api ([1e89a88](https://github.com/botpress/botpress/commit/1e89a88))
- **decision-engine:** added suggested replies ([d82b49a](https://github.com/botpress/botpress/commit/d82b49a))
- **decision-engine:** added suggested replies ([7fdc49d](https://github.com/botpress/botpress/commit/7fdc49d))
- **decision-engine:** cycle through suggested replies when the result is not what was expected ([466a148](https://github.com/botpress/botpress/commit/466a148))
- **misc:** delete shortcut for flow and displaying more content items ([f2ab084](https://github.com/botpress/botpress/commit/f2ab084))
- **storage:** implement expiration date for user attributes ([7d2b9a0](https://github.com/botpress/botpress/commit/7d2b9a0))
- **storage:** implement expiration date for user attributes ([6e05023](https://github.com/botpress/botpress/commit/6e05023))

## [11.0.4](https://github.com/botpress/botpress/compare/v11.0.2...v11.0.4) (2018-11-13)

### Bug Fixes

- **build:** update commands ([18a7c2c](https://github.com/botpress/botpress/commit/18a7c2c))
- **build:** update commands ([85cce0e](https://github.com/botpress/botpress/commit/85cce0e))

## [11.0.2](https://github.com/botpress/botpress/compare/v11.0.1...v11.0.2) (2018-11-13)

### Bug Fixes

- **admin:** update bot route was wrong ([65af202](https://github.com/botpress/botpress/commit/65af202))
- **build:** added core before building admins ([afe12cf](https://github.com/botpress/botpress/commit/afe12cf))
- **build:** added core before building admins ([1c1b71c](https://github.com/botpress/botpress/commit/1c1b71c))
- **build:** making sure that the folder exists before writing ([3cabbe2](https://github.com/botpress/botpress/commit/3cabbe2))
- **build:** optimized for packaging ([bf81a44](https://github.com/botpress/botpress/commit/bf81a44))
- **build:** remove unused gitmodule ([e6cdade](https://github.com/botpress/botpress/commit/e6cdade))
- **build:** remove unused gitmodule ([40b9280](https://github.com/botpress/botpress/commit/40b9280))
- **build:** starting docker daemon ([9c6caf7](https://github.com/botpress/botpress/commit/9c6caf7))
- **channel-web:** axios config not set correctly ([0919140](https://github.com/botpress/botpress/commit/0919140))

## [11.0.1](https://github.com/botpress/botpress/compare/v11.0.0...v11.0.1) (2018-11-13)

### Bug Fixes

- **actions:** added process.env to actions vm ([d4cf0d3](https://github.com/botpress/botpress/commit/d4cf0d3))
- **actions:** added process.env to actions vm ([daafb19](https://github.com/botpress/botpress/commit/daafb19))
- **analytics:** upgraded recharts ([2b92db7](https://github.com/botpress/botpress/commit/2b92db7))
- **build:** added missing step for studio when bootstrapping ([3fc054d](https://github.com/botpress/botpress/commit/3fc054d))
- **build:** cleaning studio assets to remove symlink ([48a74c3](https://github.com/botpress/botpress/commit/48a74c3))
- **build:** common was required in ui before it was built ([c397535](https://github.com/botpress/botpress/commit/c397535))
- **build:** common was required in ui before it was built ([5a7a88e](https://github.com/botpress/botpress/commit/5a7a88e))
- seems like merge conflict stuff ([121d177](https://github.com/botpress/botpress/commit/121d177))
- **build:** fixed codebuild and dockerfile ([f8e6b8e](https://github.com/botpress/botpress/commit/f8e6b8e))
- **build:** packaging in production mode ([0154783](https://github.com/botpress/botpress/commit/0154783))
- **ci:** chmod codebuild-extras ([dbafd7c](https://github.com/botpress/botpress/commit/dbafd7c))
- **core:** default to verbose when not in production ([277f1e1](https://github.com/botpress/botpress/commit/277f1e1))
- **core:** jumpTo was not reloading flows ([922d7c3](https://github.com/botpress/botpress/commit/922d7c3))
- **core:** jumpTo was not reloading flows ([1b0fb47](https://github.com/botpress/botpress/commit/1b0fb47))
- **core:** log watcher errors instead of crashing ([f7e955f](https://github.com/botpress/botpress/commit/f7e955f))
- **core:** log watcher errors instead of crashing ([a1b3831](https://github.com/botpress/botpress/commit/a1b3831))
- **core:** outgoing queue causes a bottleneck with await ([99688b4](https://github.com/botpress/botpress/commit/99688b4))
- **core:** outgoing queue causes a bottleneck with await ([3d5a56e](https://github.com/botpress/botpress/commit/3d5a56e))
- **core:** restore commintlint rules ([8f7f546](https://github.com/botpress/botpress/commit/8f7f546))
- **core:** restore commintlint rules ([99ad932](https://github.com/botpress/botpress/commit/99ad932))
- **docs:** missing trailing slash ([a07f5b9](https://github.com/botpress/botpress/commit/a07f5b9))
- **docs:** put back CHANGELOG.md (resolve [#1063](https://github.com/botpress/botpress/issues/1063)) ([#1066](https://github.com/botpress/botpress/issues/1066)) ([b1cb313](https://github.com/botpress/botpress/commit/b1cb313))
- **ghost:** fixed ghost w/o proxy ([ce5afff](https://github.com/botpress/botpress/commit/ce5afff))
- **nlu:** adding EOL to fix nlu prediction issue ([35d7cd4](https://github.com/botpress/botpress/commit/35d7cd4))
- **nlu:** adding EOL to fix nlu prediction issue ([06e0835](https://github.com/botpress/botpress/commit/06e0835))
- **nlu:** changed training parameters ([b6bf8a0](https://github.com/botpress/botpress/commit/b6bf8a0))
- **nlu:** changed training parameters ([6dad642](https://github.com/botpress/botpress/commit/6dad642))
- **pro:** removed proxy reference ([6b232ac](https://github.com/botpress/botpress/commit/6b232ac))
- **queue:** fix outgoing queue ([694dafc](https://github.com/botpress/botpress/commit/694dafc))
- **queue:** users are now in their own queue ([c1a76a9](https://github.com/botpress/botpress/commit/c1a76a9))
- **router:** added async handler for skill routes ([ffcde57](https://github.com/botpress/botpress/commit/ffcde57))
- **studio:** compiled studio as production ([7795a45](https://github.com/botpress/botpress/commit/7795a45))
- **studio:** compiled studio as production ([cec1261](https://github.com/botpress/botpress/commit/cec1261))
- **studio:** fixed path to admin panel ([5134795](https://github.com/botpress/botpress/commit/5134795))
- **studio:** removed external dependencies and fixed paths ([dcc211b](https://github.com/botpress/botpress/commit/dcc211b))
- bot ID generation ([efd9694](https://github.com/botpress/botpress/commit/efd9694))
- docs path on s3 ([4c7f9e5](https://github.com/botpress/botpress/commit/4c7f9e5))
- trim last hyphen on create bot ([d784d22](https://github.com/botpress/botpress/commit/d784d22))
- **tests:** dispose the memory queue after tests ([42e3444](https://github.com/botpress/botpress/commit/42e3444))

### Features

- **core:** actions/hooks vm have access to host/port ([fc29a45](https://github.com/botpress/botpress/commit/fc29a45))
- **http:** now serving studio and admin from assets folder ([d5311b1](https://github.com/botpress/botpress/commit/d5311b1))
- **sdk:** added method to delete shortlink ([13f97dd](https://github.com/botpress/botpress/commit/13f97dd))
- **skills:** modules can register multiple skills ([8012f1f](https://github.com/botpress/botpress/commit/8012f1f))

# [11.0.0](https://github.com/botpress/botpress/compare/v10.50.0...v11.0.0) (2018-11-01)

### Bug Fixes

- add label for login-password modal ([911b12f](https://github.com/botpress/botpress/commit/911b12f))
- add label for login-password modal ([16c2c95](https://github.com/botpress/botpress/commit/16c2c95))
- change btn create bot now -> create bot ([93a6267](https://github.com/botpress/botpress/commit/93a6267))
- change btn create bot now -> create bot ([e7082f9](https://github.com/botpress/botpress/commit/e7082f9))
- remove unused method ([bbfbc6b](https://github.com/botpress/botpress/commit/bbfbc6b))
- **analytics:** return empty object when analytics are not yet compiled ([c280298](https://github.com/botpress/botpress/commit/c280298))
- **core:** issue on windows with sqlite journal ([3d7e89f](https://github.com/botpress/botpress/commit/3d7e89f))
- **docs:** updated paths ([1abe1be](https://github.com/botpress/botpress/commit/1abe1be))
- **ui-admin:** disabled licensing in CE ([b88f894](https://github.com/botpress/botpress/commit/b88f894))

# [10.50.0](https://github.com/botpress/botpress/compare/v10.49.0...v10.50.0) (2018-10-31)

### Bug Fixes

- unlicensed in sidebarfooter ([8660a84](https://github.com/botpress/botpress/commit/8660a84))
- unlicensed in sidebarfooter ([2446ef0](https://github.com/botpress/botpress/commit/2446ef0))
- **hitl:** swallow quick reply message type ([b74d928](https://github.com/botpress/botpress/commit/b74d928))

### Features

- **qna:** add typing time when bot answer to a question ([b97d074](https://github.com/botpress/botpress/commit/b97d074))

# [10.49.0](https://github.com/botpress/botpress/compare/v10.48.5...v10.49.0) (2018-10-30)

### Bug Fixes

- **hitl:** using insertAndRetrieve for hitl sessions ([52892a7](https://github.com/botpress/botpress/commit/52892a7))
- **lifecycle:** on services loaded lifecycle event ([1dee516](https://github.com/botpress/botpress/commit/1dee516))
- **logger:** display stack trace even on debug ([58bb7c9](https://github.com/botpress/botpress/commit/58bb7c9))
- add admin link, move select bot, fix help btn ([1ebf8f3](https://github.com/botpress/botpress/commit/1ebf8f3))
- add admin link, move select bot, fix help btn ([1775808](https://github.com/botpress/botpress/commit/1775808))
- **xx:** added admin link and hidden menu when not xx ([fdd676b](https://github.com/botpress/botpress/commit/fdd676b))
- **xx:** minor ajustment for notifications ([74d9ae0](https://github.com/botpress/botpress/commit/74d9ae0))
- **xx:** when receiving a new notification, others are disappearing ([35e87e4](https://github.com/botpress/botpress/commit/35e87e4))

### Features

- **web:** add filterQuickReplies option into snippet ([964557e](https://github.com/botpress/botpress/commit/964557e))
- **xx:** notification support ([3cbfaac](https://github.com/botpress/botpress/commit/3cbfaac))

## [10.48.5](https://github.com/botpress/botpress/compare/v10.48.4...v10.48.5) (2018-10-19)

### Bug Fixes

- **core:** fix rerunning module migrations ([ec6279b](https://github.com/botpress/botpress/commit/ec6279b))
- **hitl:** display event inside conversation for hitl module ([21b7749](https://github.com/botpress/botpress/commit/21b7749))
- **hitl:** display messages of type quick_reply in hitl module ([e8ae668](https://github.com/botpress/botpress/commit/e8ae668))
- **hitl:** reset hitl_messages pg sequence (resolve [#1007](https://github.com/botpress/botpress/issues/1007)) ([eb8bf71](https://github.com/botpress/botpress/commit/eb8bf71))

## [10.48.4](https://github.com/botpress/botpress/compare/v10.48.3...v10.48.4) (2018-10-17)

### Bug Fixes

- **core:** fix ghost-content uniq index migration for sqlite ([#1033](https://github.com/botpress/botpress/issues/1033)) ([aef783b](https://github.com/botpress/botpress/commit/aef783b))

## [10.48.3](https://github.com/botpress/botpress/compare/v10.48.2...v10.48.3) (2018-10-17)

### Bug Fixes

- **core:** create missing files/folder during ghost-sync (resolve [#996](https://github.com/botpress/botpress/issues/996)) ([#1031](https://github.com/botpress/botpress/issues/1031)) ([8463aa2](https://github.com/botpress/botpress/commit/8463aa2))

## [10.48.2](https://github.com/botpress/botpress/compare/v10.48.1...v10.48.2) (2018-10-17)

### Bug Fixes

- **core:** fix missing migration error for existing bots (resolve [#1025](https://github.com/botpress/botpress/issues/1025)) ([#1029](https://github.com/botpress/botpress/issues/1029)) ([aa8fb30](https://github.com/botpress/botpress/commit/aa8fb30))

## [10.48.1](https://github.com/botpress/botpress/compare/v10.48.0...v10.48.1) (2018-10-17)

### Bug Fixes

- **core:** update tests on user list tags ([#1028](https://github.com/botpress/botpress/issues/1028)) ([055cbe4](https://github.com/botpress/botpress/commit/055cbe4))
- **qna:** fix deleting questions for QnA-maker ([#1027](https://github.com/botpress/botpress/issues/1027)) ([3ed1788](https://github.com/botpress/botpress/commit/3ed1788))

# [10.48.0](https://github.com/botpress/botpress/compare/v10.47.1...v10.48.0) (2018-10-16)

### Bug Fixes

- **core:** fix fetching users' tags ([#1023](https://github.com/botpress/botpress/issues/1023)) ([afba620](https://github.com/botpress/botpress/commit/afba620))
- **core:** remove ghost file uniq index migration (resolve [#1017](https://github.com/botpress/botpress/issues/1017)) ([#1018](https://github.com/botpress/botpress/issues/1018)) ([d91ee40](https://github.com/botpress/botpress/commit/d91ee40))
- **web:** add padding to greeting message ([#1019](https://github.com/botpress/botpress/issues/1019)) ([5510176](https://github.com/botpress/botpress/commit/5510176))

### Features

- **analytics:** add table type to graphs ([#1021](https://github.com/botpress/botpress/issues/1021)) ([6dbe9c3](https://github.com/botpress/botpress/commit/6dbe9c3))
- **xx:** ghost content export ([101ab0e](https://github.com/botpress/botpress/commit/101ab0e))

## [10.47.1](https://github.com/botpress/botpress/compare/v10.47.0...v10.47.1) (2018-10-15)

### Bug Fixes

- **qna:** fix accessing storage in async-functions (resolve [#1004](https://github.com/botpress/botpress/issues/1004)) ([#1015](https://github.com/botpress/botpress/issues/1015)) ([0da2824](https://github.com/botpress/botpress/commit/0da2824))
- **ui:** bot select dropdown styling ([ed2d485](https://github.com/botpress/botpress/commit/ed2d485))

# [10.47.0](https://github.com/botpress/botpress/compare/v10.46.5...v10.47.0) (2018-10-10)

### Bug Fixes

- **core:** remove 'buttons' fields when actions empty (ref [#690](https://github.com/botpress/botpress/issues/690)) ([#1000](https://github.com/botpress/botpress/issues/1000)) ([c671043](https://github.com/botpress/botpress/commit/c671043))
- **webchat:** render unsupported messages and extensions ([#1001](https://github.com/botpress/botpress/issues/1001)) ([5f4cb6e](https://github.com/botpress/botpress/commit/5f4cb6e))

### Features

- **messenger:** get hostname from BOTPRESS_URL (resolve [#910](https://github.com/botpress/botpress/issues/910)) ([#997](https://github.com/botpress/botpress/issues/997)) ([3f9ddda](https://github.com/botpress/botpress/commit/3f9ddda))

## [10.46.5](https://github.com/botpress/botpress/compare/v10.46.4...v10.46.5) (2018-10-06)

### Bug Fixes

- **builtins:** action-buttons showed <unsupported action> (fix [#970](https://github.com/botpress/botpress/issues/970)) ([#994](https://github.com/botpress/botpress/issues/994)) ([a2913dc](https://github.com/botpress/botpress/commit/a2913dc))

## [10.46.4](https://github.com/botpress/botpress/compare/v10.46.3...v10.46.4) (2018-10-06)

### Bug Fixes

- **core:** make DB initialization in all modules in init() block ([bf241ab](https://github.com/botpress/botpress/commit/bf241ab))

## [10.46.3](https://github.com/botpress/botpress/compare/v10.46.2...v10.46.3) (2018-10-05)

### Bug Fixes

- ci not caching bp packages ([5b6534c](https://github.com/botpress/botpress/commit/5b6534c))
- instruction queue test ([a94f0a3](https://github.com/botpress/botpress/commit/a94f0a3))
- **qna:** fix pagination not appearing on initial render ([#992](https://github.com/botpress/botpress/issues/992)) ([87fba19](https://github.com/botpress/botpress/commit/87fba19))
- set ci cache checksum on package.json instead of yarn.lock ([ca7a04c](https://github.com/botpress/botpress/commit/ca7a04c))
- **core:** title field is required (author dmk23 resolve [#883](https://github.com/botpress/botpress/issues/883)) ([#982](https://github.com/botpress/botpress/issues/982)) ([ff63de7](https://github.com/botpress/botpress/commit/ff63de7))
- use well known flag in after incoming middleware hook ([4496af7](https://github.com/botpress/botpress/commit/4496af7))
- **docs:** jekyll vulnerability fix ([#993](https://github.com/botpress/botpress/issues/993)) ([94d4a25](https://github.com/botpress/botpress/commit/94d4a25))
- **messenger:** improve rate limit (author dmk23 resolve [#884](https://github.com/botpress/botpress/issues/884)) ([#986](https://github.com/botpress/botpress/issues/986)) ([cc682a5](https://github.com/botpress/botpress/commit/cc682a5))
- **qna:** categories can be provided as config-variable ([#989](https://github.com/botpress/botpress/issues/989)) ([a30f18d](https://github.com/botpress/botpress/commit/a30f18d))
- **qna:** fix qna-module errors when using NLU (resolve [#973](https://github.com/botpress/botpress/issues/973)) ([#988](https://github.com/botpress/botpress/issues/988)) ([eb8c30d](https://github.com/botpress/botpress/commit/eb8c30d))
- **slack:** added user obj to slack umm for analytics (resolve [#983](https://github.com/botpress/botpress/issues/983)) ([#987](https://github.com/botpress/botpress/issues/987)) ([f7f4c7c](https://github.com/botpress/botpress/commit/f7f4c7c))

## [10.46.2](https://github.com/botpress/botpress/compare/v10.46.1...v10.46.2) (2018-10-03)

### Bug Fixes

- **hitl:** hitl bug with outgoing message to slack (resolve [#924](https://github.com/botpress/botpress/issues/924)) ([#978](https://github.com/botpress/botpress/issues/978)) ([e8dbe80](https://github.com/botpress/botpress/commit/e8dbe80))
- **qna:** questions-filter is case-insensitive ([#980](https://github.com/botpress/botpress/issues/980)) ([03fa755](https://github.com/botpress/botpress/commit/03fa755))

## [10.46.1](https://github.com/botpress/botpress/compare/v10.46.0...v10.46.1) (2018-10-03)

### Bug Fixes

- run tests in band ([3570a14](https://github.com/botpress/botpress/commit/3570a14))
- **qna:** close qna-form on submit ([#981](https://github.com/botpress/botpress/issues/981)) ([d137e88](https://github.com/botpress/botpress/commit/d137e88))
- **qna:** fix validating QNA-items ([#979](https://github.com/botpress/botpress/issues/979)) ([92b186f](https://github.com/botpress/botpress/commit/92b186f))

# [10.46.0](https://github.com/botpress/botpress/compare/v10.45.0...v10.46.0) (2018-10-03)

### Bug Fixes

- **core:** replace all (?) to (\?) (author mdk23 resolve [#880](https://github.com/botpress/botpress/issues/880)) ([#976](https://github.com/botpress/botpress/issues/976)) ([e74c0d8](https://github.com/botpress/botpress/commit/e74c0d8))
- **nlu:** force coherent nlu native values (resolve [#971](https://github.com/botpress/botpress/issues/971)) ([#975](https://github.com/botpress/botpress/issues/975)) ([991d9fb](https://github.com/botpress/botpress/commit/991d9fb))
- **qna:** fix qna-form not displaying item data ([#974](https://github.com/botpress/botpress/issues/974)) ([ca8e2eb](https://github.com/botpress/botpress/commit/ca8e2eb))

### Features

- **core:** implemneted migration for every modules ([#972](https://github.com/botpress/botpress/issues/972)) ([c771e34](https://github.com/botpress/botpress/commit/c771e34))

# [10.45.0](https://github.com/botpress/botpress/compare/v10.44.2...v10.45.0) (2018-10-01)

### Bug Fixes

- **channel-web:** allow tildas in user-ids ([#963](https://github.com/botpress/botpress/issues/963)) ([b69e88c](https://github.com/botpress/botpress/commit/b69e88c))
- **core:** disallow transitions to same node (resolve [#900](https://github.com/botpress/botpress/issues/900)) ([#962](https://github.com/botpress/botpress/issues/962)) ([cdfcd26](https://github.com/botpress/botpress/commit/cdfcd26))
- **core:** fix test running fresh bot ([a2969dc](https://github.com/botpress/botpress/commit/a2969dc))
- **core:** increase insertAndRetrieve test timeout ([676f5a5](https://github.com/botpress/botpress/commit/676f5a5))

### Features

- **nlu:** added age entity for LUIS ([d775214](https://github.com/botpress/botpress/commit/d775214))
- **nlu:** added age entity for LUIS ([acbd2e0](https://github.com/botpress/botpress/commit/acbd2e0))
- **nlu:** added unit property to LUIS entity ([0591136](https://github.com/botpress/botpress/commit/0591136))
- **nlu:** added unit property to LUIS entity ([bcce650](https://github.com/botpress/botpress/commit/bcce650))
- **qna:** new interface for QnA-module ([9b8ee56](https://github.com/botpress/botpress/commit/9b8ee56)), closes [#903](https://github.com/botpress/botpress/issues/903) [#903](https://github.com/botpress/botpress/issues/903) [#902](https://github.com/botpress/botpress/issues/902) [#902](https://github.com/botpress/botpress/issues/902) [#902](https://github.com/botpress/botpress/issues/902)

## [10.44.2](https://github.com/botpress/botpress/compare/v10.44.1...v10.44.2) (2018-09-28)

### Bug Fixes

- **channel-web:** handle missing payload.data ([13b296f](https://github.com/botpress/botpress/commit/13b296f))

## [10.44.1](https://github.com/botpress/botpress/compare/v10.44.0...v10.44.1) (2018-09-28)

### Bug Fixes

- **messenger:** made profiles fields option for FB (resolve [#829](https://github.com/botpress/botpress/issues/829)) ([ed74212](https://github.com/botpress/botpress/commit/ed74212))
- **nlu:** native-NLU values should be in 0..1 interval (resolve [#865](https://github.com/botpress/botpress/issues/865)) ([82acb3a](https://github.com/botpress/botpress/commit/82acb3a))
- **qna:** reverse qna-questions for consistency ([0043fee](https://github.com/botpress/botpress/commit/0043fee))

# [10.44.0](https://github.com/botpress/botpress/compare/v10.43.0...v10.44.0) (2018-09-27)

### Bug Fixes

- **builtins:** catch unique constraint violation ([a89942c](https://github.com/botpress/botpress/commit/a89942c))
- **builtins:** log tagging errors ([0f60fe8](https://github.com/botpress/botpress/commit/0f60fe8))
- **channel-web:** add todo about message insertion batching ([01a2e36](https://github.com/botpress/botpress/commit/01a2e36))
- **channel-web:** extract frequently used regex ([f22d357](https://github.com/botpress/botpress/commit/f22d357))
- **channel-web:** fix users caching ([c56ceb0](https://github.com/botpress/botpress/commit/c56ceb0))
- **core:** added env.VAR for correct testing ([3db498d](https://github.com/botpress/botpress/commit/3db498d))
- **qna:** fix answers ordering (came from c21d0ac) ([#954](https://github.com/botpress/botpress/issues/954)) ([1f4ddba](https://github.com/botpress/botpress/commit/1f4ddba))

### Features

- **channel-web:** added ensureUserExists method ([3e5d23c](https://github.com/botpress/botpress/commit/3e5d23c))
- **core:** automatically open the admin at startup in development ([#936](https://github.com/botpress/botpress/issues/936)) ([09db0e6](https://github.com/botpress/botpress/commit/09db0e6))

# [10.43.0](https://github.com/botpress/botpress/compare/v10.42.0...v10.43.0) (2018-09-26)

### Bug Fixes

- **qna:** qna-maker score ordering ([c21d0ac](https://github.com/botpress/botpress/commit/c21d0ac))

### Features

- **web:** implemented 'Greeting Screen' (ref [#808](https://github.com/botpress/botpress/issues/808)) ([#869](https://github.com/botpress/botpress/issues/869)) ([a066c90](https://github.com/botpress/botpress/commit/a066c90))

# [10.42.0](https://github.com/botpress/botpress/compare/v10.41.1...v10.42.0) (2018-09-26)

### Bug Fixes

- **channel-web:** login_prompt renderer styles were crashing webchat ([#943](https://github.com/botpress/botpress/issues/943)) ([620360f](https://github.com/botpress/botpress/commit/620360f))
- **core:** fix typo in sqlite-connection (resolve [#932](https://github.com/botpress/botpress/issues/932), ref [#497](https://github.com/botpress/botpress/issues/497)) ([#940](https://github.com/botpress/botpress/issues/940)) ([7aa9dd1](https://github.com/botpress/botpress/commit/7aa9dd1))
- **qna:** fix qna import-modal crashing ([#938](https://github.com/botpress/botpress/issues/938)) ([3edfe2e](https://github.com/botpress/botpress/commit/3edfe2e))
- **qna:** reverse results obtained from QNA-Maker ([#934](https://github.com/botpress/botpress/issues/934)) ([#941](https://github.com/botpress/botpress/issues/941)) ([448f54d](https://github.com/botpress/botpress/commit/448f54d))

### Features

- **core:** Add bot creation ui and default template ([20b267f](https://github.com/botpress/botpress/commit/20b267f))

## [10.41.1](https://github.com/botpress/botpress/compare/v10.41.0...v10.41.1) (2018-09-23)

# [10.41.0](https://github.com/botpress/botpress/compare/v10.40.0...v10.41.0) (2018-09-23)

### Bug Fixes

- **core-ui:** returnTo pathname based on router context ([340de33](https://github.com/botpress/botpress/commit/340de33))
- missing timestamps on some tables ([b833dcc](https://github.com/botpress/botpress/commit/b833dcc))
- redirect to /admin on root ([cf0a483](https://github.com/botpress/botpress/commit/cf0a483))
- **qna:** reverse results obtained from QNA-Maker ([#934](https://github.com/botpress/botpress/issues/934)) ([3bd9a45](https://github.com/botpress/botpress/commit/3bd9a45))

### Features

- **core:** Add multi-bot support in the UI ([507bd34](https://github.com/botpress/botpress/commit/507bd34))
- **core-ui:** lite views support multi-bot ([460892a](https://github.com/botpress/botpress/commit/460892a))
- **core-ui:** lite views support multi-bot ([b6c6f69](https://github.com/botpress/botpress/commit/b6c6f69))
- **webchat:** added 'flow to' action button ([e0120ca](https://github.com/botpress/botpress/commit/e0120ca))
- **webchat:** added 'flow to' action button ([b3a545c](https://github.com/botpress/botpress/commit/b3a545c))
- **xx:** disabled login screen in XX ([fb8ddeb](https://github.com/botpress/botpress/commit/fb8ddeb))

# [10.40.0](https://github.com/botpress/botpress/compare/v10.39.0...v10.40.0) (2018-09-20)

### Bug Fixes

- wrap bot select in nav item ([68b1501](https://github.com/botpress/botpress/commit/68b1501))
- **qna:** handle IME-composing in QNA-form ([#930](https://github.com/botpress/botpress/issues/930)) ([8493314](https://github.com/botpress/botpress/commit/8493314))

### Features

- **core:** add bot select for botpress-xx ([c932b3d](https://github.com/botpress/botpress/commit/c932b3d))
- **core:** implemented bot switch ([99e9287](https://github.com/botpress/botpress/commit/99e9287))

# [10.39.0](https://github.com/botpress/botpress/compare/v10.38.0...v10.39.0) (2018-09-19)

### Bug Fixes

- fix ts and proxy ([3414774](https://github.com/botpress/botpress/commit/3414774))
- **core:** added support for path prefixes ([b9c9aa7](https://github.com/botpress/botpress/commit/b9c9aa7))
- **core:** improve bot test for circleci ([#925](https://github.com/botpress/botpress/issues/925)) ([3932353](https://github.com/botpress/botpress/commit/3932353))
- **messenger:** added new point of Getting Started ([#918](https://github.com/botpress/botpress/issues/918)) ([43019cc](https://github.com/botpress/botpress/commit/43019cc))
- **ui:** restore version reporting ([b451dc9](https://github.com/botpress/botpress/commit/b451dc9))

### Features

- **core:** new configs to silence logs and disable cluster mode ([61e7293](https://github.com/botpress/botpress/commit/61e7293))
- **core:** new configs to silence logs and disable cluster mode ([7be9a1b](https://github.com/botpress/botpress/commit/7be9a1b))
- **core:** security for bot routes ([9743783](https://github.com/botpress/botpress/commit/9743783))
- **ui:** update to 10.37.1 ([b251ec8](https://github.com/botpress/botpress/commit/b251ec8))
- **ui:** working login ([10b2501](https://github.com/botpress/botpress/commit/10b2501))

# [10.38.0](https://github.com/botpress/botpress/compare/v10.37.1...v10.38.0) (2018-09-12)

### Bug Fixes

- **core:** uniq index ghost_content on file-folder (resolve [#791](https://github.com/botpress/botpress/issues/791)) ([0206e9d](https://github.com/botpress/botpress/commit/0206e9d))
- **docs:** security-upgrade nokogiri and rubyzip ([f7ba290](https://github.com/botpress/botpress/commit/f7ba290))
- **slack:** added callback_id to attachment (resolve [#876](https://github.com/botpress/botpress/issues/876)) ([5474761](https://github.com/botpress/botpress/commit/5474761))

### Features

- **core:** implemented test for checking bot efficiency ([4c81a1c](https://github.com/botpress/botpress/commit/4c81a1c))
- **core:** Logger persister ([2fe748d](https://github.com/botpress/botpress/commit/2fe748d))

## [10.37.1](https://github.com/botpress/botpress/compare/v10.36.1...v10.37.1) (2018-09-11)

### Features

- **core:** add the hook to switch the UI to editable username ([d2a6eab](https://github.com/botpress/botpress/commit/d2a6eab))

## [10.36.1](https://github.com/botpress/botpress/compare/v10.36.0...v10.36.1) (2018-09-10)

# [10.36.0](https://github.com/botpress/botpress/compare/v10.35.1...v10.36.0) (2018-09-10)

### Bug Fixes

- **qna:** added converting to global app encoding (resolve [#901](https://github.com/botpress/botpress/issues/901)) ([6b311a0](https://github.com/botpress/botpress/commit/6b311a0))
- sessionId is now channel, user, threadId ([b1b2bd6](https://github.com/botpress/botpress/commit/b1b2bd6))
- **telegram:** action promises were never resolved ([dfe0996](https://github.com/botpress/botpress/commit/dfe0996))
- **telegram:** update README.md ([3f1da72](https://github.com/botpress/botpress/commit/3f1da72))

### Features

- **telegram:** support action buttons and single-choice ([ff5211f](https://github.com/botpress/botpress/commit/ff5211f))
- **telegram:** support image builtin type ([b1ecac6](https://github.com/botpress/botpress/commit/b1ecac6))
- **ui:** report the proper bp version ([f848a66](https://github.com/botpress/botpress/commit/f848a66))

## [10.35.1](https://github.com/botpress/botpress/compare/v10.35.0...v10.35.1) (2018-09-05)

### Bug Fixes

- **docs:** upgrade jekyll to omit vulnerable deps ([076e2b5](https://github.com/botpress/botpress/commit/076e2b5))
- **web:** improve path to customStylesheet ([8faa833](https://github.com/botpress/botpress/commit/8faa833))

# [10.35.0](https://github.com/botpress/botpress/compare/v10.34.0...v10.35.0) (2018-09-04)

### Bug Fixes

- **admin:** fix bot creation ([888bd21](https://github.com/botpress/botpress/commit/888bd21))
- **admin:** fix import path ([a5bf8d5](https://github.com/botpress/botpress/commit/a5bf8d5))
- **admin:** fix joining the team ([f143d81](https://github.com/botpress/botpress/commit/f143d81))
- **admin:** fix role editing ([bbe501b](https://github.com/botpress/botpress/commit/bbe501b))
- added note about postgres minimal valid value ([dd57575](https://github.com/botpress/botpress/commit/dd57575))
- updated node-sass package ([8064701](https://github.com/botpress/botpress/commit/8064701))

### Features

- **audience:** various improvement to the Audience admin view ([41fed12](https://github.com/botpress/botpress/commit/41fed12))
- show toast message for qna and nlu (resolve [#790](https://github.com/botpress/botpress/issues/790)) ([53822eb](https://github.com/botpress/botpress/commit/53822eb))
- **web:** implemented custom stylesheet (ref [#808](https://github.com/botpress/botpress/issues/808)) ([3a060ac](https://github.com/botpress/botpress/commit/3a060ac))

# [10.34.0](https://github.com/botpress/botpress/compare/v10.33.2...v10.34.0) (2018-08-30)

### Bug Fixes

- **admin:** cleanu 'cloud' rhetorics ([f5c09e6](https://github.com/botpress/botpress/commit/f5c09e6))
- move proper env loading to the launcher ([24688a4](https://github.com/botpress/botpress/commit/24688a4))
- **admin:** cleanup pairing copy ([1975ed9](https://github.com/botpress/botpress/commit/1975ed9))
- **admin:** serve index.html by default ([d878381](https://github.com/botpress/botpress/commit/d878381))
- **admin:** use window.location for invite links ([eb6c9c3](https://github.com/botpress/botpress/commit/eb6c9c3))
- **core:** make admin routes prefixed with ([84f3604](https://github.com/botpress/botpress/commit/84f3604))
- fix module refs to work with npm ([0679912](https://github.com/botpress/botpress/commit/0679912))
- **core:** make the page header color darker ([c429afe](https://github.com/botpress/botpress/commit/c429afe))
- **core, admin:** various auth and admin fixes ([c2e448e](https://github.com/botpress/botpress/commit/c2e448e))
- **docs:** add note to use developer token for Recast ([43a6bf5](https://github.com/botpress/botpress/commit/43a6bf5))
- **slack:** fix slack avatar (ref [#880](https://github.com/botpress/botpress/issues/880)) ([47a46f1](https://github.com/botpress/botpress/commit/47a46f1))
- **ui:** allow to change socket url ([b1e317e](https://github.com/botpress/botpress/commit/b1e317e))
- **util:** short-circuit tests ([1c26649](https://github.com/botpress/botpress/commit/1c26649))
- **web:** change order in web channel (resolve [#848](https://github.com/botpress/botpress/issues/848)) ([3e1805e](https://github.com/botpress/botpress/commit/3e1805e))

### Features

- **admin:** admin-related web APIs ([34cdf69](https://github.com/botpress/botpress/commit/34cdf69))
- **admin:** signup page and some cleanup ([aaeac57](https://github.com/botpress/botpress/commit/aaeac57))
- **auth:** migrated auth tables ([f7b04da](https://github.com/botpress/botpress/commit/f7b04da))
- **core:** improve notifications empty state ([30becc8](https://github.com/botpress/botpress/commit/30becc8))
- **qna:** qna maker integration ([f8e2764](https://github.com/botpress/botpress/commit/f8e2764))

## [10.33.2](https://github.com/botpress/botpress/compare/v10.33.1...v10.33.2) (2018-08-24)

### Bug Fixes

- **channel-web:** fixed message sanitization ([269025a](https://github.com/botpress/botpress/commit/269025a))

## [10.33.1](https://github.com/botpress/botpress/compare/v10.33.0...v10.33.1) (2018-08-24)

### Bug Fixes

- **builtins:** change text rendering (resolve [#832](https://github.com/botpress/botpress/issues/832)) ([b33a711](https://github.com/botpress/botpress/commit/b33a711))
- **channel-web:** fix build ([f98cd1b](https://github.com/botpress/botpress/commit/f98cd1b))
- **channel-web:** last_heard_on ([b6fcda9](https://github.com/botpress/botpress/commit/b6fcda9))
- **channel-web:** last_heard_on ([a6fb50f](https://github.com/botpress/botpress/commit/a6fb50f))
- **core:** fixed imports filename case ([377572c](https://github.com/botpress/botpress/commit/377572c))
- **core:** flow-level timeoutNode property persists ([d143384](https://github.com/botpress/botpress/commit/d143384))
- **core:** flow-level timeoutNode property persists ([9d16c4e](https://github.com/botpress/botpress/commit/9d16c4e))
- **core:** increase node-version to 10 in new bot-template ([77d72a6](https://github.com/botpress/botpress/commit/77d72a6))
- **docs:** typo in skills ([f9bf04c](https://github.com/botpress/botpress/commit/f9bf04c))
- **event-engine:** loading now sync ([bef288e](https://github.com/botpress/botpress/commit/bef288e))
- **event-engine:** loading now sync ([50b945e](https://github.com/botpress/botpress/commit/50b945e))
- **nlu:** dialogflow isn't required (resolve [#860](https://github.com/botpress/botpress/issues/860)) ([0bf3bb2](https://github.com/botpress/botpress/commit/0bf3bb2))
- fix admin panel package names ([4fe4b38](https://github.com/botpress/botpress/commit/4fe4b38))
- **nlu:** improve way for handling error (resolve [#790](https://github.com/botpress/botpress/issues/790)) ([d32b74d](https://github.com/botpress/botpress/commit/d32b74d))
- **nlu:** skip empty utterances on sync (resolve [#859](https://github.com/botpress/botpress/issues/859)) ([6d62700](https://github.com/botpress/botpress/commit/6d62700))

# [10.33.0](https://github.com/botpress/botpress/compare/v10.32.0...v10.33.0) (2018-08-17)

### Bug Fixes

- **core:** add queue.isEmpty and make tests async ([74ad1a7](https://github.com/botpress/botpress/commit/74ad1a7))
- support tests outside test folder ([6b27411](https://github.com/botpress/botpress/commit/6b27411))
- **core:** improve CLI messages about version ([c919412](https://github.com/botpress/botpress/commit/c919412))
- **core:** make the page header color darker ([ba8951e](https://github.com/botpress/botpress/commit/ba8951e))
- **messenger:** added possibility to set text ([33f9096](https://github.com/botpress/botpress/commit/33f9096))
- **messenger:** added possibility to set text ([aeb390e](https://github.com/botpress/botpress/commit/aeb390e))
- **nlu:** added scroll for intents list (resolve [#846](https://github.com/botpress/botpress/issues/846)) ([52ca905](https://github.com/botpress/botpress/commit/52ca905))
- **nlu:** added scroll for intents list (resolve [#846](https://github.com/botpress/botpress/issues/846)) ([b85d3c3](https://github.com/botpress/botpress/commit/b85d3c3))
- **web:** carousel btn as payload (resolve [#845](https://github.com/botpress/botpress/issues/845)) ([91dc91e](https://github.com/botpress/botpress/commit/91dc91e))
- **web:** carousel btn as payload (resolve [#845](https://github.com/botpress/botpress/issues/845)) ([c3e90d5](https://github.com/botpress/botpress/commit/c3e90d5))

### Features

- **channel-web:** allow extra messages sanitizing ([7d6033f](https://github.com/botpress/botpress/commit/7d6033f))
- **core:** Add dialog engine ([3158a9f](https://github.com/botpress/botpress/commit/3158a9f))
- **core:** Add event engine ([e508815](https://github.com/botpress/botpress/commit/e508815))
- **core:** Add hook service ([aa1cabb](https://github.com/botpress/botpress/commit/aa1cabb))
- **core:** improve notifications empty state ([f58a695](https://github.com/botpress/botpress/commit/f58a695))
- **core:** queue implementation ([684e282](https://github.com/botpress/botpress/commit/684e282))

# [10.32.0](https://github.com/botpress/botpress/compare/v10.31.0...v10.32.0) (2018-08-15)

### Bug Fixes

- **core:** fix ghost disk driver typings ([7bb8b50](https://github.com/botpress/botpress/commit/7bb8b50))
- **url:** fixed the image url for my GIF ([c8b6cd9](https://github.com/botpress/botpress/commit/c8b6cd9))
- fix watch command ([79fe6d1](https://github.com/botpress/botpress/commit/79fe6d1))
- undo using composite projects ([a895f21](https://github.com/botpress/botpress/commit/a895f21))

### Features

- **core:** queue implementation ([8db823b](https://github.com/botpress/botpress/commit/8db823b))
- **dialogManager:** Add flow service ([4b393ae](https://github.com/botpress/botpress/commit/4b393ae))
- **qna:** display upload CSV status ([efa96ed](https://github.com/botpress/botpress/commit/efa96ed))

# [10.31.0](https://github.com/botpress/botpress/compare/v10.30.0...v10.31.0) (2018-08-08)

### Bug Fixes

- **core:** remove global variable rewriting ([4c833ef](https://github.com/botpress/botpress/commit/4c833ef))
- **docs:** tour shouldn't mention botpress-messenger (ref [#827](https://github.com/botpress/botpress/issues/827)) ([0aa1616](https://github.com/botpress/botpress/commit/0aa1616))
- **messenger:** GET_STARTED response (resolve [#589](https://github.com/botpress/botpress/issues/589)) ([f9c31cb](https://github.com/botpress/botpress/commit/f9c31cb))
- **qna:** display row number in processing error ([c88128a](https://github.com/botpress/botpress/commit/c88128a))
- **qna:** don't duplicate questions when reuploading same file ([08b5888](https://github.com/botpress/botpress/commit/08b5888))
- **qna:** paginate questions/answer ([f349899](https://github.com/botpress/botpress/commit/f349899))

### Features

- **builtins:** added ability to hide choice elements ([5919705](https://github.com/botpress/botpress/commit/5919705))
- **qna:** customizable encoding for exported csv ([de1a2d1](https://github.com/botpress/botpress/commit/de1a2d1))
- **skill-choice:** added support for NLU ([fa15d06](https://github.com/botpress/botpress/commit/fa15d06))

# [10.30.0](https://github.com/botpress/botpress/compare/v10.29.0...v10.30.0) (2018-08-08)

### Bug Fixes

- **nlu:** LUIS custom entity resolution ([d813233](https://github.com/botpress/botpress/commit/d813233))

### Features

- **CMS:** Add all CMS functionalities ([6054f80](https://github.com/botpress/botpress/commit/6054f80))

# [10.29.0](https://github.com/botpress/botpress/compare/v10.28.0...v10.29.0) (2018-08-07)

### Bug Fixes

- followup ([332940b](https://github.com/botpress/botpress/commit/332940b))
- list bot content types ([dd203bf](https://github.com/botpress/botpress/commit/dd203bf))
- **web:** unused code ([832a3db](https://github.com/botpress/botpress/commit/832a3db))
- wip ([c36ab78](https://github.com/botpress/botpress/commit/c36ab78))
- **core:** improve long strings readability ([904f784](https://github.com/botpress/botpress/commit/904f784))
- **core:** remove global variable rewriting ([6fce6de](https://github.com/botpress/botpress/commit/6fce6de))
- **nlu:** custom entity names ([8e04763](https://github.com/botpress/botpress/commit/8e04763))
- **nlu:** DialogFlow moved to optional deps ([a05202a](https://github.com/botpress/botpress/commit/a05202a))
- **nlu:** fixes loading of custom entities ([f63cfab](https://github.com/botpress/botpress/commit/f63cfab))
- **qna:** display row number in processing error ([3c692ea](https://github.com/botpress/botpress/commit/3c692ea))
- **webchat:** conversations list last message postgres query ([4657efa](https://github.com/botpress/botpress/commit/4657efa))
- **webchat:** createConvo btn color is configurable ([b7eba94](https://github.com/botpress/botpress/commit/b7eba94))

### Features

- **core:** implemented validation fot bp module version (resolve [#663](https://github.com/botpress/botpress/issues/663)) ([596528d](https://github.com/botpress/botpress/commit/596528d))
- **web:** implemented btn for create convo (ref [#804](https://github.com/botpress/botpress/issues/804)) ([f7cb473](https://github.com/botpress/botpress/commit/f7cb473))
- **web:** implemented btn for create convo (ref [#804](https://github.com/botpress/botpress/issues/804)) ([ae42664](https://github.com/botpress/botpress/commit/ae42664))

# [10.28.0](https://github.com/botpress/botpress/compare/v10.27.1...v10.28.0) (2018-08-03)

### Bug Fixes

- **hitl:** sqlite alert ([544aa41](https://github.com/botpress/botpress/commit/544aa41))
- **web:** added config options for showAvatar and showUserName ([c90ff5a](https://github.com/botpress/botpress/commit/c90ff5a))
- **web:** default config ([6f7fe72](https://github.com/botpress/botpress/commit/6f7fe72))
- **web:** download transcript config ([fe1a1c4](https://github.com/botpress/botpress/commit/fe1a1c4))
- **webchat:** display user's avatar and name if available (resolve [#803](https://github.com/botpress/botpress/issues/803)) ([7a57186](https://github.com/botpress/botpress/commit/7a57186))
- **webchat:** display user's avatar and name if available (resolve [#803](https://github.com/botpress/botpress/issues/803)) ([2bc7f34](https://github.com/botpress/botpress/commit/2bc7f34))

### Features

- **channel-web:** implement the new message type ([49f3159](https://github.com/botpress/botpress/commit/49f3159))
- **channel-web:** implement the new message type ([68cfbc9](https://github.com/botpress/botpress/commit/68cfbc9)), closes [#780](https://github.com/botpress/botpress/issues/780)
- **web:** implemented downloading conversation (resolve [#802](https://github.com/botpress/botpress/issues/802)) ([ee8ec8a](https://github.com/botpress/botpress/commit/ee8ec8a))
- **webchat:** start new feature on timeout (resovle [#805](https://github.com/botpress/botpress/issues/805)) ([5b6f89d](https://github.com/botpress/botpress/commit/5b6f89d))
- **webchat:** start new feature on timeout (resovle [#805](https://github.com/botpress/botpress/issues/805)) ([f64fde1](https://github.com/botpress/botpress/commit/f64fde1))

## [10.27.1](https://github.com/botpress/botpress/compare/v10.27.0...v10.27.1) (2018-08-01)

### Bug Fixes

- **nlu:** LUIS should fetch not only top-scored one ([ba0e034](https://github.com/botpress/botpress/commit/ba0e034))

# [10.27.0](https://github.com/botpress/botpress/compare/v10.26.0...v10.27.0) (2018-07-31)

### Bug Fixes

- resolve broken links (resolve [#783](https://github.com/botpress/botpress/issues/783)) ([#785](https://github.com/botpress/botpress/issues/785)) ([b745daa](https://github.com/botpress/botpress/commit/b745daa))
- **core:** export entry-point from bot's index.js (resolve [#796](https://github.com/botpress/botpress/issues/796)) ([a83724a](https://github.com/botpress/botpress/commit/a83724a))
- **hitl:** made text column longer (resolve [#578](https://github.com/botpress/botpress/issues/578)) ([fe3ad87](https://github.com/botpress/botpress/commit/fe3ad87))

### Features

- **core:** var in Execute code can merge {{var}} with str(resolve [#530](https://github.com/botpress/botpress/issues/530)) ([74512bb](https://github.com/botpress/botpress/commit/74512bb))

# [10.26.0](https://github.com/botpress/botpress/compare/v10.25.2...v10.26.0) (2018-07-31)

### Bug Fixes

- **flow:** change state initializing and ver-control path (resolve [#633](https://github.com/botpress/botpress/issues/633)) ([75a599a](https://github.com/botpress/botpress/commit/75a599a))
- **logs:** fix logs ordering ([62c2679](https://github.com/botpress/botpress/commit/62c2679))
- **logs:** safely serialize objects with cyclic refs ([270a7e4](https://github.com/botpress/botpress/commit/270a7e4))
- **nlu:** provide default nlu interface (resolve [#685](https://github.com/botpress/botpress/issues/685)) ([62b9ba6](https://github.com/botpress/botpress/commit/62b9ba6))

### Features

- **core:** support Phusion Passenger (resolve [#671](https://github.com/botpress/botpress/issues/671)) ([ab4098b](https://github.com/botpress/botpress/commit/ab4098b))

## [10.25.2](https://github.com/botpress/botpress/compare/v10.25.1...v10.25.2) (2018-07-26)

### Bug Fixes

- **nlu:** don't throw if intent to delete not found ([1731f43](https://github.com/botpress/botpress/commit/1731f43))

## [10.25.1](https://github.com/botpress/botpress/compare/v10.25.0...v10.25.1) (2018-07-26)

### Bug Fixes

- **lerna:** use yarn instead of npm ([fd6089e](https://github.com/botpress/botpress/commit/fd6089e))
- added missing definitions file ([b3d5bc1](https://github.com/botpress/botpress/commit/b3d5bc1))
- project bootstrap ([26eb699](https://github.com/botpress/botpress/commit/26eb699))
- serving bundled static UI ([37279bd](https://github.com/botpress/botpress/commit/37279bd))
- **module-loader:** Botpress configuration files were not copied to dist/ ([892b642](https://github.com/botpress/botpress/commit/892b642))
- **module-loader:** Configuration files were not copied to dist ([b5f1bdc](https://github.com/botpress/botpress/commit/b5f1bdc))
- **nlu:** don't sync luis if syncing in progress ([961312c](https://github.com/botpress/botpress/commit/961312c))
- **nlu:** don't throw if intent to delete is absent ([ce88c93](https://github.com/botpress/botpress/commit/ce88c93))

### Features

- IoC container, partial work toward db ([9317151](https://github.com/botpress/botpress/commit/9317151))

# [10.25.0](https://github.com/botpress/botpress/compare/v10.24.4...v10.25.0) (2018-07-23)

### Bug Fixes

- cleanup ([bdd769b](https://github.com/botpress/botpress/commit/bdd769b))
- **channel-web:** don't set last_heard_on for new convos ([3448fc3](https://github.com/botpress/botpress/commit/3448fc3))
- **channel-web:** import bluebird ([dc5359d](https://github.com/botpress/botpress/commit/dc5359d))
- **channel-web:** init new convo with last_heard_on ([16e0816](https://github.com/botpress/botpress/commit/16e0816))
- **channel-web:** set last_heard_on for new convos ([6c05b92](https://github.com/botpress/botpress/commit/6c05b92))
- **core:** fix \_findNode check ([85795a4](https://github.com/botpress/botpress/commit/85795a4))
- **core:** fix dialog engine ([b8cd753](https://github.com/botpress/botpress/commit/b8cd753))
- **core:** keep choice-skills' links on skill edit (resolve [#693](https://github.com/botpress/botpress/issues/693)) ([8e5a96b](https://github.com/botpress/botpress/commit/8e5a96b))
- **core:** keep choice-skills' links on skill edit (resolve [#693](https://github.com/botpress/botpress/issues/693)) ([b2a91ce](https://github.com/botpress/botpress/commit/b2a91ce))

### Features

- **logs:** implement minimum log level ([5f160d8](https://github.com/botpress/botpress/commit/5f160d8))
- **nlu:** limit requests per hour ([f81873f](https://github.com/botpress/botpress/commit/f81873f))

## [10.24.4](https://github.com/botpress/botpress/compare/v10.24.0...v10.24.4) (2018-07-20)

### Bug Fixes

- **core:** copy botpress README before publishing (resovle [#729](https://github.com/botpress/botpress/issues/729)) ([4e50546](https://github.com/botpress/botpress/commit/4e50546))
- **core:** copy README on compiling botpress ([c6ccddb](https://github.com/botpress/botpress/commit/c6ccddb))
- **core:** fix prepublish script ([45cce40](https://github.com/botpress/botpress/commit/45cce40))
- **core:** just use new README for now ([90362e5](https://github.com/botpress/botpress/commit/90362e5))

# [10.24.0](https://github.com/botpress/botpress/compare/v10.23.0...v10.24.0) (2018-07-20)

### Bug Fixes

- **builtins:** change card presentation (ref [#734](https://github.com/botpress/botpress/issues/734)) ([3057446](https://github.com/botpress/botpress/commit/3057446))
- **core:** async renderers should keep messages order (resolve [#736](https://github.com/botpress/botpress/issues/736)) ([8e9449e](https://github.com/botpress/botpress/commit/8e9449e))
- **core:** correctly get author information from bots ([3cfacda](https://github.com/botpress/botpress/commit/3cfacda))
- **core:** correctly get author information from bots ([8f286b7](https://github.com/botpress/botpress/commit/8f286b7)), closes [/github.com/sindresorhus/is/blob/b2bb3e7d3717de9734a3881156b1f8ab00236fe9/package.json#L7-L11](https://github.com//github.com/sindresorhus/is/blob/b2bb3e7d3717de9734a3881156b1f8ab00236fe9/package.json/issues/L7-L11)
- **docs:** added tutorial for messenger configuration ([732d2e5](https://github.com/botpress/botpress/commit/732d2e5))
- **docs:** added tutorial for messenger configuration ([280cdbf](https://github.com/botpress/botpress/commit/280cdbf))
- **slack:** added method for update config (resolve [#705](https://github.com/botpress/botpress/issues/705)) ([fb96afd](https://github.com/botpress/botpress/commit/fb96afd))
- **telegram:** fix telegram load (resolve [#733](https://github.com/botpress/botpress/issues/733)) ([a726c9c](https://github.com/botpress/botpress/commit/a726c9c))
- **telegram:** fix telegram load (resolve [#733](https://github.com/botpress/botpress/issues/733)) ([83bb88c](https://github.com/botpress/botpress/commit/83bb88c))
- **telegram:** improve stateId for telegram (resolve [#715](https://github.com/botpress/botpress/issues/715)) ([d52745f](https://github.com/botpress/botpress/commit/d52745f))
- **telegram:** improve stateId from telegram (resolve [#715](https://github.com/botpress/botpress/issues/715)) ([50580af](https://github.com/botpress/botpress/commit/50580af))

### Features

- **chat:** added 'ref' query into [host]/s/chat (resolve [#721](https://github.com/botpress/botpress/issues/721)) ([f26e77e](https://github.com/botpress/botpress/commit/f26e77e))
- **qna:** bp.qna.getQuestion function ([fbbcb23](https://github.com/botpress/botpress/commit/fbbcb23))
- **qna:** qna interception can be customized via hook ([bace4c0](https://github.com/botpress/botpress/commit/bace4c0))

# [10.23.0](https://github.com/botpress/botpress/compare/v10.22.4...v10.23.0) (2018-07-13)

### Bug Fixes

- **qna:** on flow deletion or rename, QNA still works ([efd75d6](https://github.com/botpress/botpress/commit/efd75d6))
- **webpack:** change chunk spliting and improve config (resolve [#725](https://github.com/botpress/botpress/issues/725)) ([541d5fd](https://github.com/botpress/botpress/commit/541d5fd))

### Features

- **core:** added toast to module view props (resolve [#40](https://github.com/botpress/botpress/issues/40)) ([63c6361](https://github.com/botpress/botpress/commit/63c6361))
- **qna:** added "text_redirect" action type ([644188a](https://github.com/botpress/botpress/commit/644188a))
- **qna:** added "text_redirect" action type ([d8e6825](https://github.com/botpress/botpress/commit/d8e6825))

## [10.22.4](https://github.com/botpress/botpress/compare/v10.22.3...v10.22.4) (2018-07-11)

### Bug Fixes

- improper new calls ([3e7ed8f](https://github.com/botpress/botpress/commit/3e7ed8f))
- **skill:** pull choices (resolve [#711](https://github.com/botpress/botpress/issues/711)) ([d439f0a](https://github.com/botpress/botpress/commit/d439f0a))
- restore log archive loading using axios ([0534fac](https://github.com/botpress/botpress/commit/0534fac))
- restore log archive loading using axios ([d088fc8](https://github.com/botpress/botpress/commit/d088fc8))
- **core:** ghost-sync ignores deleting missing files ([f8f7f27](https://github.com/botpress/botpress/commit/f8f7f27))
- **core:** remove now unneeded evals ([f718d92](https://github.com/botpress/botpress/commit/f718d92))
- **flow:** change a text el to an action ([474c362](https://github.com/botpress/botpress/commit/474c362))
- **logs:** remove now unneeded logs secret key ([3c57c06](https://github.com/botpress/botpress/commit/3c57c06))
- **logs:** remove now unneeded logs secret key ([18b4971](https://github.com/botpress/botpress/commit/18b4971))
- **slack:** made readme up to date ([3278e04](https://github.com/botpress/botpress/commit/3278e04))
- **template:** change .gitignore (resolve [#601](https://github.com/botpress/botpress/issues/601)) ([5018009](https://github.com/botpress/botpress/commit/5018009))

### Features

- **chat:** added 'ref' query into [host]/s/chat (resolve [#721](https://github.com/botpress/botpress/issues/721)) ([c5525c7](https://github.com/botpress/botpress/commit/c5525c7))

## [10.22.3](https://github.com/botpress/botpress/compare/v10.22.2...v10.22.3) (2018-07-05)

### Bug Fixes

- **dialog:** handle race conditions ([481314d](https://github.com/botpress/botpress/commit/481314d))
- **dialog:** handle race conditions ([9113f60](https://github.com/botpress/botpress/commit/9113f60))
- **docs:** jumps recipe should 'await' jumping to node ([7f774cb](https://github.com/botpress/botpress/commit/7f774cb))

## [10.22.2](https://github.com/botpress/botpress/compare/v10.22.1...v10.22.2) (2018-07-03)

### Bug Fixes

- opts might not be a function ([22cf41f](https://github.com/botpress/botpress/commit/22cf41f))

## [10.22.1](https://github.com/botpress/botpress/compare/v10.22.0...v10.22.1) (2018-07-03)

### Bug Fixes

- options not always defined across multiple botpress envs ([108d371](https://github.com/botpress/botpress/commit/108d371))

# [10.22.0](https://github.com/botpress/botpress/compare/v10.21.0...v10.22.0) (2018-07-03)

# [10.21.0](https://github.com/botpress/botpress/compare/v10.20.1...v10.21.0) (2018-07-03)

### Bug Fixes

- **cli:** botpress init --yes inits bot in current dir (resolve [#623](https://github.com/botpress/botpress/issues/623)) ([50a1d3a](https://github.com/botpress/botpress/commit/50a1d3a))
- **core:** content-widget placeholder shows selected item (resolve [#673](https://github.com/botpress/botpress/issues/673)) ([39c5b2c](https://github.com/botpress/botpress/commit/39c5b2c))
- **core:** renderers for carousel/action-btns (resolve [#697](https://github.com/botpress/botpress/issues/697) [#634](https://github.com/botpress/botpress/issues/634)) ([a6e7cc0](https://github.com/botpress/botpress/commit/a6e7cc0))
- **core:** renderers for carousel/action-btns (resolve [#697](https://github.com/botpress/botpress/issues/697) [#634](https://github.com/botpress/botpress/issues/634)) ([a139890](https://github.com/botpress/botpress/commit/a139890))
- **docs:** jumps recipe should 'await' jumping to node ([3ad8619](https://github.com/botpress/botpress/commit/3ad8619))
- **docs:** upgrade sprockets to avoid vulnerability ([2bf9204](https://github.com/botpress/botpress/commit/2bf9204))
- **flow:** close button in create content form (resolve [#672](https://github.com/botpress/botpress/issues/672)) ([fc0a0b1](https://github.com/botpress/botpress/commit/fc0a0b1))
- **janitor:** adjusted log levels ([7cd6753](https://github.com/botpress/botpress/commit/7cd6753))
- **logger:** migrations run fully before using logger ([8f2dd66](https://github.com/botpress/botpress/commit/8f2dd66))
- **logs:** prevent logs from jumping when loading more lines ([da34cfd](https://github.com/botpress/botpress/commit/da34cfd))
- **logs:** various fixes ([c63b22c](https://github.com/botpress/botpress/commit/c63b22c))

### Features

- **cli:** implement --inspect|-i flags for start (resolve [#91](https://github.com/botpress/botpress/issues/91)) ([e209ea1](https://github.com/botpress/botpress/commit/e209ea1))
- **core:** async renderers (resolve [#349](https://github.com/botpress/botpress/issues/349)) ([46e479c](https://github.com/botpress/botpress/commit/46e479c))
- **core:** async renderers (resolve [#349](https://github.com/botpress/botpress/issues/349)) ([bb512ab](https://github.com/botpress/botpress/commit/bb512ab))
- **logger:** batch insert logs ([50f1052](https://github.com/botpress/botpress/commit/50f1052))
- **logs:** add logs janitor ([89ba1e8](https://github.com/botpress/botpress/commit/89ba1e8))
- **logs:** store logs in the database ([2a8031a](https://github.com/botpress/botpress/commit/2a8031a))
- **qna:** csv import/export ([394a922](https://github.com/botpress/botpress/commit/394a922))
- **scheduler:** action can be async function ([ab1832a](https://github.com/botpress/botpress/commit/ab1832a))
- **scheduler:** expose bp.scheduler.add/remove ([2172f70](https://github.com/botpress/botpress/commit/2172f70))

### BREAKING CHANGES

- **logs:** it fails on the old botfile
  and requires manual migration.
  It also ignores the old log files.

## [10.20.1](https://github.com/botpress/botpress/compare/v10.20.0...v10.20.1) (2018-06-21)

### Bug Fixes

- **bench:** package.json -> private = true ([7538a44](https://github.com/botpress/botpress/commit/7538a44))
- **botfile:** added default value for hiddenHeroSection (resolve [#647](https://github.com/botpress/botpress/issues/647)) ([9d5cf80](https://github.com/botpress/botpress/commit/9d5cf80))
- **botfile:** added default value for hiddenHeroSection (resolve [#647](https://github.com/botpress/botpress/issues/647)) ([91dfd92](https://github.com/botpress/botpress/commit/91dfd92))
- **core:** enable modules config watching (resolve [#519](https://github.com/botpress/botpress/issues/519)) ([e2cbfad](https://github.com/botpress/botpress/commit/e2cbfad))
- **core:** enable modules config watching (resolve [#519](https://github.com/botpress/botpress/issues/519)) ([8e7393f](https://github.com/botpress/botpress/commit/8e7393f))
- **core:** make sqlite3 optional and warn if using node v10 (ref [#526](https://github.com/botpress/botpress/issues/526)) ([42ac146](https://github.com/botpress/botpress/commit/42ac146))
- **core:** make sqlite3 optional and warn if using node v10 (ref [#526](https://github.com/botpress/botpress/issues/526)) ([a5cf727](https://github.com/botpress/botpress/commit/a5cf727))
- **docs:** sorting versions in docs header (resolve [#660](https://github.com/botpress/botpress/issues/660)) ([6d40e38](https://github.com/botpress/botpress/commit/6d40e38))
- **docs:** sorting versions in docs header (resolve [#660](https://github.com/botpress/botpress/issues/660)) ([662dda0](https://github.com/botpress/botpress/commit/662dda0))
- **webchat:** keyframes anymation fallback for ie (resolve [#657](https://github.com/botpress/botpress/issues/657)) ([5dce355](https://github.com/botpress/botpress/commit/5dce355))
- **webchat:** keyframes anymation fallback for ie (resolve [#657](https://github.com/botpress/botpress/issues/657)) ([a9d201f](https://github.com/botpress/botpress/commit/a9d201f))

### Features

- **bench:** initial benchmark script ([43c736d](https://github.com/botpress/botpress/commit/43c736d))
- **bench:** initial benchmark script ([0537e26](https://github.com/botpress/botpress/commit/0537e26))

# [10.20.0](https://github.com/botpress/botpress/compare/v10.19.0...v10.20.0) (2018-06-20)

### Bug Fixes

- **core:** fix for the user with id === 0 ([05ad1ce](https://github.com/botpress/botpress/commit/05ad1ce))
- **core:** flowbuilder imports should match filenames ([cfebba5](https://github.com/botpress/botpress/commit/cfebba5))
- **ghost:** fix content manager ([2234b40](https://github.com/botpress/botpress/commit/2234b40))
- **licensing:** fix the license name in the footer ([beff44c](https://github.com/botpress/botpress/commit/beff44c))
- **webpack:** change path to js files (resolve [#648](https://github.com/botpress/botpress/issues/648)) ([352e009](https://github.com/botpress/botpress/commit/352e009))
- **webpack:** change path to js files (resolve [#648](https://github.com/botpress/botpress/issues/648)) ([8a2564d](https://github.com/botpress/botpress/commit/8a2564d))

### Features

- **cloud-roles:** bot media read-only mode ([ede9d73](https://github.com/botpress/botpress/commit/ede9d73))
- **cloud-roles:** content read-only mode ([8e49720](https://github.com/botpress/botpress/commit/8e49720))
- **cloud-roles:** flows read-only mode ([a8d89d3](https://github.com/botpress/botpress/commit/a8d89d3))
- **cloud-roles:** ghost-content read-only mode ([1799803](https://github.com/botpress/botpress/commit/1799803))
- **cloud-roles:** hide skill edit button based on perm ([492377e](https://github.com/botpress/botpress/commit/492377e))
- **cloud-roles:** hide skills dropdown according to perms ([8431799](https://github.com/botpress/botpress/commit/8431799))

# [10.19.0](https://github.com/botpress/botpress/compare/v10.18.0...v10.19.0) (2018-06-19)

### Bug Fixes

- **messenger:** fixes error 400 upon bot start ([306cf4b](https://github.com/botpress/botpress/commit/306cf4b))

### Features

- **core:** implement auto pick content (resolve [#517](https://github.com/botpress/botpress/issues/517)) ([68364cf](https://github.com/botpress/botpress/commit/68364cf))

# [10.18.0](https://github.com/botpress/botpress/compare/v10.17.3...v10.18.0) (2018-06-19)

### Bug Fixes

- **core:** timeout-flow should be triggered (ref [#628](https://github.com/botpress/botpress/issues/628)) ([be433db](https://github.com/botpress/botpress/commit/be433db))
- **messenger:** fixes error 400 upon bot start ([48117f9](https://github.com/botpress/botpress/commit/48117f9))
- **webpack:** improve build performance (resolve [#399](https://github.com/botpress/botpress/issues/399)) ([361181b](https://github.com/botpress/botpress/commit/361181b))
- **webpack:** improve build performance (resolve [#399](https://github.com/botpress/botpress/issues/399)) ([5616277](https://github.com/botpress/botpress/commit/5616277))

### Features

- **botfile:** added variable hideHeroSection (resolve [#29](https://github.com/botpress/botpress/issues/29)) ([be060b1](https://github.com/botpress/botpress/commit/be060b1))
- **botfile:** added variable hideHeroSection (resolve [#29](https://github.com/botpress/botpress/issues/29)) ([f9caf5f](https://github.com/botpress/botpress/commit/f9caf5f))
- **core:** added confirm when user want go out from flow(resolve [#516](https://github.com/botpress/botpress/issues/516)) ([b7841c1](https://github.com/botpress/botpress/commit/b7841c1))
- **core:** added confirm when user want go out from flows(resolve[#516](https://github.com/botpress/botpress/issues/516)) ([7349e7f](https://github.com/botpress/botpress/commit/7349e7f))
- **core:** hostname bot listens to can be customized (resolve [#644](https://github.com/botpress/botpress/issues/644)) ([e94c33c](https://github.com/botpress/botpress/commit/e94c33c))
- **core:** hostname bot listens to can be customized (resolve [#644](https://github.com/botpress/botpress/issues/644)) ([fb9c4de](https://github.com/botpress/botpress/commit/fb9c4de))
- **core:** implement auto pick content (resolve [#517](https://github.com/botpress/botpress/issues/517)) ([d100d87](https://github.com/botpress/botpress/commit/d100d87))
- **release:** v10 release 🎉 ([536c297](https://github.com/botpress/botpress/commit/536c297))

## [10.17.3](https://github.com/botpress/botpress/compare/v10.17.2...v10.17.3) (2018-06-15)

### Bug Fixes

- **code:** empty dashboard when user signed in (resolve [#635](https://github.com/botpress/botpress/issues/635)) ([41283de](https://github.com/botpress/botpress/commit/41283de))
- **content:** blank page (ref [#620](https://github.com/botpress/botpress/issues/620)) ([ecbbeda](https://github.com/botpress/botpress/commit/ecbbeda))
- **core:** fix utc (resolve [#494](https://github.com/botpress/botpress/issues/494)) ([780b4f2](https://github.com/botpress/botpress/commit/780b4f2))
- **core:** use bot's NODE_ENV not botpress's(resolve [#591](https://github.com/botpress/botpress/issues/591)) ([6699aa1](https://github.com/botpress/botpress/commit/6699aa1))

## [10.17.2](https://github.com/botpress/botpress/compare/v10.17.1...v10.17.2) (2018-06-13)

### Bug Fixes

- **cloud-roles:** fix permissions for anonymous users ([c8a2653](https://github.com/botpress/botpress/commit/c8a2653))
- **cloud-roles:** updated client-side checks ([4793423](https://github.com/botpress/botpress/commit/4793423))
- **nlu:** fixed LUIS intent resolution ([168aa9b](https://github.com/botpress/botpress/commit/168aa9b))

## [10.17.1](https://github.com/botpress/botpress/compare/v10.17.0...v10.17.1) (2018-06-11)

### Bug Fixes

- docs ([e447cf4](https://github.com/botpress/botpress/commit/e447cf4))
- **util-roles:** can't find ./resources (resolve [#625](https://github.com/botpress/botpress/issues/625)) ([1d4c28e](https://github.com/botpress/botpress/commit/1d4c28e))

# [10.17.0](https://github.com/botpress/botpress/compare/v10.16.0...v10.17.0) (2018-06-10)

### Bug Fixes

- **botpress-terminal:** add missing dependencies (resolve [#618](https://github.com/botpress/botpress/issues/618)) ([442ae9c](https://github.com/botpress/botpress/commit/442ae9c))
- **docs:** restored API Reference ([6479e17](https://github.com/botpress/botpress/commit/6479e17))
- **docs:** restored API Reference ([7635f3d](https://github.com/botpress/botpress/commit/7635f3d))

# [10.16.0](https://github.com/botpress/botpress/compare/v10.15.0...v10.16.0) (2018-06-10)

### Bug Fixes

- **auth:** disable auth check when login not enabled ([11347d4](https://github.com/botpress/botpress/commit/11347d4))
- **botpress-terminal:** add missing dependencies (resolve [#618](https://github.com/botpress/botpress/issues/618)) ([f71e4bf](https://github.com/botpress/botpress/commit/f71e4bf))
- **cloud-roles:** fix operation name and add more checks ([d3186d9](https://github.com/botpress/botpress/commit/d3186d9))
- **cloud-roles:** improve roles fetch throttling ([888e8c8](https://github.com/botpress/botpress/commit/888e8c8))
- **dashboard:** infinite loop fix & refresh issue ([9455970](https://github.com/botpress/botpress/commit/9455970))
- **login:** should not log auth failure as an error ([f1adcae](https://github.com/botpress/botpress/commit/f1adcae))
- **logs:** logs view & download archive ([c4d304a](https://github.com/botpress/botpress/commit/c4d304a))
- **rules:** all bot rules start with `bot.` ([98643a0](https://github.com/botpress/botpress/commit/98643a0))
- **util-roles:** add convenience 2nd level wildcards ([704c4f5](https://github.com/botpress/botpress/commit/704c4f5))

### Features

- **cloud-roles:** middlewares read-only mode ([1cbc084](https://github.com/botpress/botpress/commit/1cbc084))
- **cloud-roles:** server-side check for cloud permissions ([be7cc76](https://github.com/botpress/botpress/commit/be7cc76))
- **cloud-roles:** server-side check for cloud permissions ([919e68c](https://github.com/botpress/botpress/commit/919e68c))
- **messenger:** support custom graph version ([#599](https://github.com/botpress/botpress/issues/599)) ([e5054c6](https://github.com/botpress/botpress/commit/e5054c6))
- **roles:** client-side permissions checks in the sidebar and header ([af772e5](https://github.com/botpress/botpress/commit/af772e5))

# [10.15.0](https://github.com/botpress/botpress/compare/v10.14.2...v10.15.0) (2018-06-07)

### Bug Fixes

- **npmignore:** fix ignore nested folders ([64b797b](https://github.com/botpress/botpress/commit/64b797b))

## [10.14.2](https://github.com/botpress/botpress/compare/v10.14.1...v10.14.2) (2018-06-07)

### Bug Fixes

- **util-roles:** missing babel config change ([bd7bb07](https://github.com/botpress/botpress/commit/bd7bb07))

## [10.14.1](https://github.com/botpress/botpress/compare/v10.14.0...v10.14.1) (2018-06-07)

### Bug Fixes

- **util-roles:** fix resources export ([22a4732](https://github.com/botpress/botpress/commit/22a4732))

# [10.14.0](https://github.com/botpress/botpress/compare/v10.13.4...v10.14.0) (2018-06-07)

### Bug Fixes

- **content-manager:** action-button form should open correctly ([2062d30](https://github.com/botpress/botpress/commit/2062d30))
- **core:** improve .npmignore (ref [#513](https://github.com/botpress/botpress/issues/513)) ([d647813](https://github.com/botpress/botpress/commit/d647813))
- **core:** umm depr warning doesn't appear on start (resolve [#593](https://github.com/botpress/botpress/issues/593)) ([6512246](https://github.com/botpress/botpress/commit/6512246))
- **init:** added readme to init-tamplate (ref [#31](https://github.com/botpress/botpress/issues/31)) ([a514d38](https://github.com/botpress/botpress/commit/a514d38))
- **util-roles:** don't use parcel as its output is not es6-compatible ([25d84fb](https://github.com/botpress/botpress/commit/25d84fb))
- **util-roles:** gracefully handle null for rules ([3b47ab7](https://github.com/botpress/botpress/commit/3b47ab7))

### Features

- **roles:** describe available resources ([364d6f5](https://github.com/botpress/botpress/commit/364d6f5))
- **roles:** rename resources to follow dot-separated scheme ([9469877](https://github.com/botpress/botpress/commit/9469877))
- **util-roles:** export resources with fully qualified name ([5eabd5c](https://github.com/botpress/botpress/commit/5eabd5c))

## [10.13.4](https://github.com/botpress/botpress/compare/v10.13.3...v10.13.4) (2018-06-01)

### Bug Fixes

- publish script fixes ([c7d7c60](https://github.com/botpress/botpress/commit/c7d7c60))
- **messenger:** queue: userId for messenger channel ([460c026](https://github.com/botpress/botpress/commit/460c026))

## [10.13.3](https://github.com/botpress/botpress/compare/v10.11.3...v10.13.3) (2018-06-01)

### Bug Fixes

- **core:** fill computed data upon loading content items ([4e874fe](https://github.com/botpress/botpress/commit/4e874fe))
- **core:** jumpTo jumps to the right node when specified ([e8c2455](https://github.com/botpress/botpress/commit/e8c2455))
- **docs:** docs on botpress-analytics usage ([469b317](https://github.com/botpress/botpress/commit/469b317))
- **qna:** added configuration to readme ([9666c7d](https://github.com/botpress/botpress/commit/9666c7d))
- **qna:** allow fast typing with Enter adding new question ([0de70e7](https://github.com/botpress/botpress/commit/0de70e7))
- **qna:** autofocus the initial question form ([546f9a2](https://github.com/botpress/botpress/commit/546f9a2))
- **qna:** cleanup dependencies ([99c02bb](https://github.com/botpress/botpress/commit/99c02bb))
- **qna:** cleanup log ([6518bdc](https://github.com/botpress/botpress/commit/6518bdc))
- **qna:** don't allow deleting the only question ([b16f3a8](https://github.com/botpress/botpress/commit/b16f3a8))
- **qna:** jump to node ([9c2fbe4](https://github.com/botpress/botpress/commit/9c2fbe4))
- **qna:** properly process the redirect node ([d513f24](https://github.com/botpress/botpress/commit/d513f24))
- **qna:** text renderer can be changed in config ([5111234](https://github.com/botpress/botpress/commit/5111234))
- **templates:** typo in utterance (resolve [#592](https://github.com/botpress/botpress/issues/592)) ([9a57c22](https://github.com/botpress/botpress/commit/9a57c22))

### Features

- **nlu:** hide hidden intents by default ([077da1f](https://github.com/botpress/botpress/commit/077da1f))
- **qna:** bulk import for the questions ([0d83a89](https://github.com/botpress/botpress/commit/0d83a89))
- **qna:** filter question ([70d54a6](https://github.com/botpress/botpress/commit/70d54a6))
- **qna:** Q&A module ([f79e2e8](https://github.com/botpress/botpress/commit/f79e2e8))
- **qna:** redirect to node, middleware not working yet ([d93949b](https://github.com/botpress/botpress/commit/d93949b))
- **qna:** slightly more aesthetic UI ([3617ac1](https://github.com/botpress/botpress/commit/3617ac1))

## [10.11.3](https://github.com/botpress/botpress/compare/v10.11.2...v10.11.3) (2018-05-30)

### Bug Fixes

- **skill-choice:** compare payload if it's present ([3ebb82e](https://github.com/botpress/botpress/commit/3ebb82e))

## [10.11.2](https://github.com/botpress/botpress/compare/v10.11.1...v10.11.2) (2018-05-30)

### Bug Fixes

- **docs:** contributing ([c324dc4](https://github.com/botpress/botpress/commit/c324dc4))
- **init:** added missing empty "content" directory ([74a026c](https://github.com/botpress/botpress/commit/74a026c))
- **skill-choice:** compare user's payload with keywords, not only text ([317dbba](https://github.com/botpress/botpress/commit/317dbba))

### Features

- **microsoft:** microsoft channel supports quick_replies ([9be0edc](https://github.com/botpress/botpress/commit/9be0edc))

## [10.11.1](https://github.com/botpress/botpress/compare/v10.11.0...v10.11.1) (2018-05-29)

### Bug Fixes

- **docs:** contributing ([2e82d0f](https://github.com/botpress/botpress/commit/2e82d0f))
- **nlu:** using custom stemmer when provided ([f7f6ab5](https://github.com/botpress/botpress/commit/f7f6ab5))

# [10.11.0](https://github.com/botpress/botpress/compare/v10.10.0...v10.11.0) (2018-05-29)

### Bug Fixes

- WordPress typo ([697b7a3](https://github.com/botpress/botpress/commit/697b7a3))
- **builtins:** allow $ in variable names ([916cdaf](https://github.com/botpress/botpress/commit/916cdaf))
- **builtins:** allow $ in variable names ([4818d2e](https://github.com/botpress/botpress/commit/4818d2e))
- **core:** botpress shouldn't change cwd (resolves [#52](https://github.com/botpress/botpress/issues/52)) ([14ed105](https://github.com/botpress/botpress/commit/14ed105))
- **core:** hide webchat on logout from admin-panel (resolve [#554](https://github.com/botpress/botpress/issues/554)) ([8d05b69](https://github.com/botpress/botpress/commit/8d05b69))
- **docs:** deploy tutorial link (resolve [#498](https://github.com/botpress/botpress/issues/498)) ([8308f0d](https://github.com/botpress/botpress/commit/8308f0d))
- **docs:** deploy tutorial link (resolve [#498](https://github.com/botpress/botpress/issues/498)) ([111279f](https://github.com/botpress/botpress/commit/111279f))
- **docs:** WordPress misspelling ([1a354d8](https://github.com/botpress/botpress/commit/1a354d8))

### Features

- **analytics:** graph accepts fnAvg to customize avgValue calculation ([8e8c4f6](https://github.com/botpress/botpress/commit/8e8c4f6))
- **channel-web:** carousel acts as quick-replies ([7ac1f6c](https://github.com/botpress/botpress/commit/7ac1f6c))
- **channel-web:** carousel acts as quick-replies ([6377576](https://github.com/botpress/botpress/commit/6377576))

# [10.10.0](https://github.com/botpress/botpress/compare/v10.9.4...v10.10.0) (2018-05-24)

### Bug Fixes

- expand folders ([6c0387e](https://github.com/botpress/botpress/commit/6c0387e))
- fix filtering skills from the flows list ([9dcf01d](https://github.com/botpress/botpress/commit/9dcf01d))
- invalid jsdoc for CLI ([51424c9](https://github.com/botpress/botpress/commit/51424c9))
- prevent tree menu from activating the node ([f914da0](https://github.com/botpress/botpress/commit/f914da0))
- properly maintain toggled state when switching between flows ([b80ee96](https://github.com/botpress/botpress/commit/b80ee96))
- refactor ([94ddd87](https://github.com/botpress/botpress/commit/94ddd87))
- **docs:** readme ([aa97d16](https://github.com/botpress/botpress/commit/aa97d16))
- **docs:** removed global "type" in docs ([b32430d](https://github.com/botpress/botpress/commit/b32430d))
- **flows:** support slashes in URL ([2fe290f](https://github.com/botpress/botpress/commit/2fe290f))

### Features

- **content:** allow transparently batching content items requests ([bb31197](https://github.com/botpress/botpress/commit/bb31197))
- **flows:** hide the Skills list from the sidebar ([e299cf5](https://github.com/botpress/botpress/commit/e299cf5))
- **flows:** menu items ([12605b0](https://github.com/botpress/botpress/commit/12605b0))
- **flows:** sample flows in directories ([ab818ac](https://github.com/botpress/botpress/commit/ab818ac))
- **flows:** tree view ([06358de](https://github.com/botpress/botpress/commit/06358de))
- **nlu:** added ability to provide custom stemmer ([217ebe5](https://github.com/botpress/botpress/commit/217ebe5))

## [10.9.4](https://github.com/botpress/botpress/compare/v10.9.3...v10.9.4) (2018-05-16)

### Bug Fixes

- **builtins:** allow to change output var ([c711edb](https://github.com/botpress/botpress/commit/c711edb))

## [10.9.3](https://github.com/botpress/botpress/compare/v10.9.2...v10.9.3) (2018-05-15)

### Bug Fixes

- **skill-choice:** pointing to the right version ([07d3e6c](https://github.com/botpress/botpress/commit/07d3e6c))

## [10.9.2](https://github.com/botpress/botpress/compare/v10.9.1...v10.9.2) (2018-05-15)

### Bug Fixes

- **cli:** make the init command cancelable ([b8ebaff](https://github.com/botpress/botpress/commit/b8ebaff))
- **cli:** make the init command cancelable ([a56fed7](https://github.com/botpress/botpress/commit/a56fed7))

## [10.9.1](https://github.com/botpress/botpress/compare/v10.8.0...v10.9.1) (2018-05-15)

### Features

- **core:** created [@botpress](https://github.com/botpress)/util-sdk to help develop modules ([96d30a3](https://github.com/botpress/botpress/commit/96d30a3))
- **skill-choice:** rewrote the skill to work with builtin content ([e04e1ba](https://github.com/botpress/botpress/commit/e04e1ba))

# [10.8.0](https://github.com/botpress/botpress/compare/v10.7.0...v10.8.0) (2018-05-14)

### Bug Fixes

- fixed UMM deprecation notice ([ce4c229](https://github.com/botpress/botpress/commit/ce4c229))
- make flow iter keys content-dependent ([2f17c26](https://github.com/botpress/botpress/commit/2f17c26))
- **core:** content manager doesn't yell when missing elements file ([35ab5de](https://github.com/botpress/botpress/commit/35ab5de))
- **nlu:** removed beta annotation ([cd920aa](https://github.com/botpress/botpress/commit/cd920aa))
- **web:** using builtin config file ([888beb3](https://github.com/botpress/botpress/commit/888beb3))

### Features

- **actions:** actions dropdown shows action metadata ([21af29d](https://github.com/botpress/botpress/commit/21af29d))
- **core:** actions GUI to show available metadata ([a328ea6](https://github.com/botpress/botpress/commit/a328ea6))
- **core:** moved CLI template to separate folder at root ([6e6e205](https://github.com/botpress/botpress/commit/6e6e205))
- **flows:** move node / flow props to a separate modal ([466cb69](https://github.com/botpress/botpress/commit/466cb69))
- **flows:** move node / flow props to a separate modal ([0dc327e](https://github.com/botpress/botpress/commit/0dc327e))
- **flows:** tabbed interface ([1c1108f](https://github.com/botpress/botpress/commit/1c1108f))
- **templates:** provided a "basic" bot template ([f872b77](https://github.com/botpress/botpress/commit/f872b77))

# [10.7.0](https://github.com/botpress/botpress/compare/v10.6.2...v10.7.0) (2018-05-11)

### Bug Fixes

- added reference building to CI ([c480316](https://github.com/botpress/botpress/commit/c480316))
- invalid jsdoc ([06f613b](https://github.com/botpress/botpress/commit/06f613b))
- version extraction ([74525c1](https://github.com/botpress/botpress/commit/74525c1))
- **cli:** fixes botpress cloud ghost-sync ([0387467](https://github.com/botpress/botpress/commit/0387467))
- **core:** getTag with details when there is no prior value ([d29fda9](https://github.com/botpress/botpress/commit/d29fda9))
- **docs:** fixed TOC nav height ([5301eb0](https://github.com/botpress/botpress/commit/5301eb0))
- **docs:** removed private APIs ([a91afbf](https://github.com/botpress/botpress/commit/a91afbf))
- **web:** variable names containing special chars (like $, @) ([e9c7ff2](https://github.com/botpress/botpress/commit/e9c7ff2))

### Features

- **builtin:** new users actions ([b068be3](https://github.com/botpress/botpress/commit/b068be3))
- **builtin:** storage actions ([e09af56](https://github.com/botpress/botpress/commit/e09af56))
- **core:** actions registration and metadata provider ([1b5f643](https://github.com/botpress/botpress/commit/1b5f643))
- **core:** added dialog engine hooks APIs ([5e214ff](https://github.com/botpress/botpress/commit/5e214ff))
- **core:** getTag() can now return more details like the tagging time ([43d725c](https://github.com/botpress/botpress/commit/43d725c))
- **core:** partial progress toward built-in actions ([2eddbec](https://github.com/botpress/botpress/commit/2eddbec))

## [10.6.2](https://github.com/botpress/botpress/compare/v10.6.1...v10.6.2) (2018-05-04)

### Bug Fixes

- **core:** allow the use of private org ([c1c3745](https://github.com/botpress/botpress/commit/c1c3745))

## [10.6.1](https://github.com/botpress/botpress/compare/v10.6.0...v10.6.1) (2018-05-04)

### Bug Fixes

- **nlu:** zscore dependency ([cd44ea1](https://github.com/botpress/botpress/commit/cd44ea1))

# [10.6.0](https://github.com/botpress/botpress/compare/v10.5.0...v10.6.0) (2018-05-04)

### Bug Fixes

- **core:** content rendering of arrays ([259c027](https://github.com/botpress/botpress/commit/259c027))
- **media:** fixed static media link ([5c65596](https://github.com/botpress/botpress/commit/5c65596))
- **web:** set max height to carousel image on web ([36f9e98](https://github.com/botpress/botpress/commit/36f9e98))

### Features

- **configuration:** add ability to make flow-editor read-only ([cfe9149](https://github.com/botpress/botpress/commit/cfe9149))
- **core:** built-in content renderers for the built-in content elements ([d1bf4f7](https://github.com/botpress/botpress/commit/d1bf4f7))
- **core:** built-in content types ([613ac02](https://github.com/botpress/botpress/commit/613ac02))
- **core:** exposed recomputeCategoriesMetadata in contentManager ([30d7fae](https://github.com/botpress/botpress/commit/30d7fae))
- **nlu:** native NLU has better ranking and false-positive detection ([6c8e8c8](https://github.com/botpress/botpress/commit/6c8e8c8))

# [10.5.0](https://github.com/botpress/botpress/compare/v10.4.0...v10.5.0) (2018-05-01)

### Bug Fixes

- removed usage of deprecated `bp.db.kvs` ([d5cef13](https://github.com/botpress/botpress/commit/d5cef13))
- **audience:** audiance module working properly ([d96c62a](https://github.com/botpress/botpress/commit/d96c62a))
- **hitl:** getUserSession returns a promise ([58dc349](https://github.com/botpress/botpress/commit/58dc349))
- **hitl:** hitl now works with webchat ([a3415d4](https://github.com/botpress/botpress/commit/a3415d4))

### Features

- added "update" CLI command ([f9c3143](https://github.com/botpress/botpress/commit/f9c3143))

# [10.4.0](https://github.com/botpress/botpress/compare/v10.3.1...v10.4.0) (2018-04-29)

### Bug Fixes

- **messenger:** updated to new config, removed GUI ([b8db37e](https://github.com/botpress/botpress/commit/b8db37e))

### Features

- **configuration:** module configuration manager ([1c432e3](https://github.com/botpress/botpress/commit/1c432e3))
- throw if there's missing mandatory config keys ([7635b27](https://github.com/botpress/botpress/commit/7635b27))

## [10.3.1](https://github.com/botpress/botpress/compare/v10.2.1...v10.3.1) (2018-04-28)

### Bug Fixes

- **login:** cloud getUserIdentity() allows proof tokens ([e6bcc2b](https://github.com/botpress/botpress/commit/e6bcc2b))

### Features

- **kvs:** kvs is now directly accessible via `bp.kvs` ([f12b1b8](https://github.com/botpress/botpress/commit/f12b1b8))

## [10.2.1](https://github.com/botpress/botpress/compare/v10.2.0...v10.2.1) (2018-04-25)

### Bug Fixes

- **docs:** bad substitution in buildspec ([4464ad5](https://github.com/botpress/botpress/commit/4464ad5))
- **docs:** require versions ([2395e36](https://github.com/botpress/botpress/commit/2395e36))
- fixed source_version.sh ([62c4ca0](https://github.com/botpress/botpress/commit/62c4ca0))
- **security:** fixed all secured routes ([20ae421](https://github.com/botpress/botpress/commit/20ae421))
- baseurl in config.prod.yml ([edb6e2d](https://github.com/botpress/botpress/commit/edb6e2d))
- building from source on circleci ([a92d425](https://github.com/botpress/botpress/commit/a92d425))
- buildspec script ([850942b](https://github.com/botpress/botpress/commit/850942b))
- fixed call to PACKAGE_VERSION ([bf5d57a](https://github.com/botpress/botpress/commit/bf5d57a))
- force rebuild on circleci ([858aaf0](https://github.com/botpress/botpress/commit/858aaf0))
- licensing returns empty object instead of undefined ([4f06028](https://github.com/botpress/botpress/commit/4f06028))
- **ui:** missing import in profile dropdown ([18eca31](https://github.com/botpress/botpress/commit/18eca31))
- removed leftover console.log ([046d8ce](https://github.com/botpress/botpress/commit/046d8ce))
- removed trailing slash in docs baseurl ([68ec137](https://github.com/botpress/botpress/commit/68ec137))
- yaml format ([e60397d](https://github.com/botpress/botpress/commit/e60397d))
- **tests:** fixed isSameDay test ([60a089a](https://github.com/botpress/botpress/commit/60a089a))

# [10.2.0](https://github.com/botpress/botpress/compare/v10.1.2...v10.2.0) (2018-04-18)

### Features

- **core:** high-level API to manipulate the dialog manager ([6ea72db](https://github.com/botpress/botpress/commit/6ea72db))

## [10.1.2](https://github.com/botpress/botpress/compare/v10.1.1...v10.1.2) (2018-04-17)

### Bug Fixes

- **auth:** check decoded.aud only for cloud-paired bots ([c323d18](https://github.com/botpress/botpress/commit/c323d18))
- **auth:** check decoded.aud only for cloud-paired bots ([faad07e](https://github.com/botpress/botpress/commit/faad07e))

## [10.1.1](https://github.com/botpress/botpress/compare/v10.1.0...v10.1.1) (2018-04-17)

### Bug Fixes

- **style:** default font weight is a bit bolder ([4c97d74](https://github.com/botpress/botpress/commit/4c97d74))
- botId of undefined ([4332ba8](https://github.com/botpress/botpress/commit/4332ba8))

# [10.1.0](https://github.com/botpress/botpress/compare/v10.0.16...v10.1.0) (2018-04-17)

### Features

- **login:** cli authentication to cloud bots ([84e6ca5](https://github.com/botpress/botpress/commit/84e6ca5))

## [10.0.16](https://github.com/botpress/botpress/compare/v10.0.15...v10.0.16) (2018-04-17)

### Bug Fixes

- **login:** fixes the "bp-cloup" not found error ([696a133](https://github.com/botpress/botpress/commit/696a133))

## [10.0.15](https://github.com/botpress/botpress/compare/v10.0.14...v10.0.15) (2018-04-17)

## [10.0.14](https://github.com/botpress/botpress/compare/v10.0.12...v10.0.14) (2018-04-17)

### Bug Fixes

- reading 'isBinary' of undefined ([b187378](https://github.com/botpress/botpress/commit/b187378))
- **cli:** botpress cloud can be disabled with ENV ([3882d15](https://github.com/botpress/botpress/commit/3882d15))
- **login:** fixed blank dashboard upon initial login to Botpress Cloud ([e0f12e5](https://github.com/botpress/botpress/commit/e0f12e5))

## [10.0.12](https://github.com/botpress/botpress/compare/v10.0.8...v10.0.12) (2018-04-13)

### Bug Fixes

- **changelog:** reformatted changelog ([7af81be](https://github.com/botpress/botpress/commit/7af81be))

## [10.0.8](https://github.com/botpress/botpress/compare/v10.0.6...v10.0.8) (2018-03-23)

## [10.0.6](https://github.com/botpress/botpress/compare/v10.0.5...v10.0.6) (2018-03-08)

## [10.0.5](https://github.com/botpress/botpress/compare/v10.0.2...v10.0.5) (2018-03-07)

## [10.0.2](https://github.com/botpress/botpress/compare/v10.0.1...v10.0.2) (2018-02-25)

## [10.0.1](https://github.com/botpress/botpress/compare/v10.0.0...v10.0.1) (2018-02-23)

# [10.0.0](https://github.com/botpress/botpress/compare/v2.0.2...v10.0.0) (2018-02-23)

## [2.0.2](https://github.com/botpress/botpress/compare/v2.0.1...v2.0.2) (2018-02-22)

## [2.0.1](https://github.com/botpress/botpress/compare/v2.0.0-beta.23...v2.0.1) (2018-02-15)

# [2.0.0-beta.23](https://github.com/botpress/botpress/compare/v2.0.0-beta.21...v2.0.0-beta.23) (2018-02-07)

# [2.0.0-beta.21](https://github.com/botpress/botpress/compare/v2.0.0-beta.20...v2.0.0-beta.21) (2018-02-07)

# [2.0.0-beta.20](https://github.com/botpress/botpress/compare/v1.1.13...v2.0.0-beta.20) (2018-02-03)

## [1.1.13](https://github.com/botpress/botpress/compare/v1.1.12...v1.1.13) (2018-01-17)

## [1.1.12](https://github.com/botpress/botpress/compare/v1.1.10...v1.1.12) (2018-01-04)

## [1.1.10](https://github.com/botpress/botpress/compare/v1.1.9...v1.1.10) (2017-11-06)

## [1.1.9](https://github.com/botpress/botpress/compare/v1.1.8...v1.1.9) (2017-11-06)

## [1.1.8](https://github.com/botpress/botpress/compare/v1.1.7...v1.1.8) (2017-11-06)

## [1.1.7](https://github.com/botpress/botpress/compare/v1.1.6...v1.1.7) (2017-11-06)

## [1.1.6](https://github.com/botpress/botpress/compare/v1.1.5...v1.1.6) (2017-11-02)

## [1.1.5](https://github.com/botpress/botpress/compare/v1.1.4...v1.1.5) (2017-11-02)

## [1.1.4](https://github.com/botpress/botpress/compare/v1.1.3...v1.1.4) (2017-11-02)

## [1.1.3](https://github.com/botpress/botpress/compare/v1.1.2...v1.1.3) (2017-11-02)

## [1.1.2](https://github.com/botpress/botpress/compare/v1.1.1...v1.1.2) (2017-10-04)

## [1.1.1](https://github.com/botpress/botpress/compare/v1.1.0...v1.1.1) (2017-10-04)

# [1.1.0](https://github.com/botpress/botpress/compare/v1.0.31...v1.1.0) (2017-10-04)

## [1.0.31](https://github.com/botpress/botpress/compare/v1.0.30...v1.0.31) (2017-09-18)

## [1.0.30](https://github.com/botpress/botpress/compare/v1.0.28...v1.0.30) (2017-09-12)

## [1.0.28](https://github.com/botpress/botpress/compare/v1.0.27...v1.0.28) (2017-08-31)

## [1.0.27](https://github.com/botpress/botpress/compare/v1.0.26...v1.0.27) (2017-08-23)

## [1.0.26](https://github.com/botpress/botpress/compare/v1.0.25...v1.0.26) (2017-08-22)

## [1.0.25](https://github.com/botpress/botpress/compare/v1.0.24...v1.0.25) (2017-08-18)

## [1.0.24](https://github.com/botpress/botpress/compare/v1.0.23...v1.0.24) (2017-08-18)

## [1.0.23](https://github.com/botpress/botpress/compare/v1.0.22...v1.0.23) (2017-08-14)

## [1.0.22](https://github.com/botpress/botpress/compare/v1.0.21...v1.0.22) (2017-08-14)

## [1.0.21](https://github.com/botpress/botpress/compare/v1.0.20...v1.0.21) (2017-08-13)

## [1.0.20](https://github.com/botpress/botpress/compare/v1.0.19...v1.0.20) (2017-08-13)

## [1.0.19](https://github.com/botpress/botpress/compare/v1.0.18...v1.0.19) (2017-08-06)

## [1.0.18](https://github.com/botpress/botpress/compare/v1.0.17...v1.0.18) (2017-08-02)

## [1.0.17](https://github.com/botpress/botpress/compare/v1.0.16...v1.0.17) (2017-08-02)

## [1.0.16](https://github.com/botpress/botpress/compare/v1.0.15...v1.0.16) (2017-08-02)

## [1.0.15](https://github.com/botpress/botpress/compare/v1.0.14...v1.0.15) (2017-07-25)

## [1.0.14](https://github.com/botpress/botpress/compare/v1.0.13...v1.0.14) (2017-07-17)

## [1.0.13](https://github.com/botpress/botpress/compare/v1.0.12...v1.0.13) (2017-07-08)

## [1.0.12](https://github.com/botpress/botpress/compare/v1.0.11...v1.0.12) (2017-07-06)

## [1.0.11](https://github.com/botpress/botpress/compare/v1.0.9...v1.0.11) (2017-07-05)

## [1.0.9](https://github.com/botpress/botpress/compare/v1.0.8...v1.0.9) (2017-06-23)

## [1.0.8](https://github.com/botpress/botpress/compare/v1.0.7...v1.0.8) (2017-06-21)

## [1.0.7](https://github.com/botpress/botpress/compare/v1.0.6...v1.0.7) (2017-06-20)

## [1.0.6](https://github.com/botpress/botpress/compare/v1.0.5...v1.0.6) (2017-06-19)

## [1.0.5](https://github.com/botpress/botpress/compare/v1.0.4...v1.0.5) (2017-06-07)

## [1.0.4](https://github.com/botpress/botpress/compare/v1.0.0...v1.0.4) (2017-06-07)

# [1.0.0](https://github.com/botpress/botpress/compare/v0.2.5...v1.0.0) (2017-06-02)

## [0.2.5](https://github.com/botpress/botpress/compare/v0.2.4...v0.2.5) (2017-05-31)

## [0.2.4](https://github.com/botpress/botpress/compare/v0.2.3...v0.2.4) (2017-05-09)

## [0.2.3](https://github.com/botpress/botpress/compare/v0.1.10...v0.2.3) (2017-05-08)

## [0.1.10](https://github.com/botpress/botpress/compare/v0.1.9...v0.1.10) (2017-04-23)

## [0.1.9](https://github.com/botpress/botpress/compare/v0.1.8...v0.1.9) (2017-04-14)

## [0.1.8](https://github.com/botpress/botpress/compare/v0.1.7...v0.1.8) (2017-04-12)

## [0.1.7](https://github.com/botpress/botpress/compare/v0.1.6...v0.1.7) (2017-03-22)

## [0.1.6](https://github.com/botpress/botpress/compare/v0.1.5...v0.1.6) (2017-03-16)

## [0.1.5](https://github.com/botpress/botpress/compare/v0.1.4...v0.1.5) (2017-03-15)

## [0.1.4](https://github.com/botpress/botpress/compare/v0.1.3...v0.1.4) (2017-03-07)

## [0.1.3](https://github.com/botpress/botpress/compare/v0.1.2...v0.1.3) (2017-03-01)

## [0.1.2](https://github.com/botpress/botpress/compare/v0.1.1...v0.1.2) (2017-03-01)

## [0.1.1](https://github.com/botpress/botpress/compare/v0.0.42-beta...v0.1.1) (2017-03-01)

## 0.0.42-beta (2017-01-10)
