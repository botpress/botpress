## [12.30.7](https://github.com/botpress/botpress/compare/v12.30.6...v12.30.7) (2023-02-08)


### Bug Fixes

* **channel-web:** carousel after reopening chat ([#12449](https://github.com/botpress/botpress/issues/12449)) ([f4cb0b1](https://github.com/botpress/botpress/commit/f4cb0b1c658cb377a965c42096946e7b21549037))
* **core:** improved timeout behavior ([#12470](https://github.com/botpress/botpress/issues/12470)) ([21d4bc0](https://github.com/botpress/botpress/commit/21d4bc055d31addc285edf0f2a7c942e5bdbbb56))
* **core:** upgrade ioredis to fix cluster ([#12299](https://github.com/botpress/botpress/issues/12299)) ([416eb49](https://github.com/botpress/botpress/commit/416eb499f37d0404183217fb3d7a6b649b54f78c))
* **web-channel:** race condition from visit event ([#12435](https://github.com/botpress/botpress/issues/12435)) ([a04f4e4](https://github.com/botpress/botpress/commit/a04f4e4b22b261f13ab737be730b3cdc0bad8e60))



## [12.30.6](https://github.com/botpress/botpress/compare/v12.30.5...v12.30.6) (2022-12-01)


### Bug Fixes

* **core:** qna with transitions source details ([#12216](https://github.com/botpress/botpress/issues/12216)) ([36f8d44](https://github.com/botpress/botpress/commit/36f8d441e6422a4fa1a57760d8695e390c4a998c)), closes [#11748](https://github.com/botpress/botpress/issues/11748)
* **hitlnext:** expire cache while updating tags ([#12341](https://github.com/botpress/botpress/issues/12341)) ([cdc6ab6](https://github.com/botpress/botpress/commit/cdc6ab65ff5671889d19ed339d6e453011cc860a))
* **web-channel:** prevent error on null choice ([#12228](https://github.com/botpress/botpress/issues/12228)) ([1a47643](https://github.com/botpress/botpress/commit/1a476435edff9a553e762e08851c85481169df2d))


### Features

* **channel-web:** allow choices below message ([#12224](https://github.com/botpress/botpress/issues/12224)) ([435b5c5](https://github.com/botpress/botpress/commit/435b5c55c959552c9aff49d07e11098fd65d35a0))
* **studio:** multilingual captions for skill transitions ([#12240](https://github.com/botpress/botpress/issues/12240)) ([2b9c496](https://github.com/botpress/botpress/commit/2b9c4964137f12ced0376bb6534bf861fa09aff2))
* **web:** allow to force scrolldown on messages ([#12247](https://github.com/botpress/botpress/issues/12247)) ([5f9e7a5](https://github.com/botpress/botpress/commit/5f9e7a5a200bf33c2cfdc72b889e01d061f75d8d))



## [12.30.5](https://github.com/botpress/botpress/compare/v12.30.4...v12.30.5) (2022-11-02)


### Bug Fixes

* **web-channel:** crash on empty message list ([#12225](https://github.com/botpress/botpress/issues/12225)) ([c175498](https://github.com/botpress/botpress/commit/c175498c3310d020bcad486e362bf4b5a8abc409))



## [12.30.4](https://github.com/botpress/botpress/compare/v12.30.3...v12.30.4) (2022-10-26)


### Bug Fixes

* **admin:** rm bot exists chec in security mw ([#12192](https://github.com/botpress/botpress/issues/12192)) ([2e52b57](https://github.com/botpress/botpress/commit/2e52b57bf2cab4415fd3ec1454299139b69228c8))
* **builtin:** fix crash on converse api ([#12205](https://github.com/botpress/botpress/issues/12205)) ([0c9450e](https://github.com/botpress/botpress/commit/0c9450e7ea9a6b3f96231733c8a6fccfc23a1a55))
* **channel-web:** don't use full lodash ([#12204](https://github.com/botpress/botpress/issues/12204)) ([5e4ca8a](https://github.com/botpress/botpress/commit/5e4ca8a458bfd1ece4d46485e7aa48713926eb46))
* **channel-web:** inconsistent scrolling behavior ([#12193](https://github.com/botpress/botpress/issues/12193)) ([c2f158c](https://github.com/botpress/botpress/commit/c2f158cc1cf8812118d5e42dc92cf2eb5b062f46)), closes [#12034](https://github.com/botpress/botpress/issues/12034)



## [12.30.3](https://github.com/botpress/botpress/compare/v12.30.2...v12.30.3) (2022-10-20)


### Bug Fixes

* **channel-web:** use avatar from last message ([#12178](https://github.com/botpress/botpress/issues/12178)) ([a71a6fb](https://github.com/botpress/botpress/commit/a71a6fb296389f2b63d365fdeb896f97b67260c4)), closes [#12049](https://github.com/botpress/botpress/issues/12049)
* **core:** resolve 'undefined' workspace ([#12138](https://github.com/botpress/botpress/issues/12138)) ([f0b31d1](https://github.com/botpress/botpress/commit/f0b31d15ad6ba2bf118a8c40bc7a04f49f3d2dc5))
* **google-speech:** allow multiline SSML content ([#12139](https://github.com/botpress/botpress/issues/12139)) ([c99521f](https://github.com/botpress/botpress/commit/c99521fe88fea3bee2d3e71c9adf113ec2df8310))
* **hitlnext:** issue with history and re-queue ([#12150](https://github.com/botpress/botpress/issues/12150)) ([80b0179](https://github.com/botpress/botpress/commit/80b0179d967094df98f5ac55295ba458b18321cc))



## [12.30.2](https://github.com/botpress/botpress/compare/v12.30.1...v12.30.2) (2022-09-14)


### Bug Fixes

* **admin:** fix bot workspace scoping ([#12123](https://github.com/botpress/botpress/issues/12123)) ([63bfa0d](https://github.com/botpress/botpress/commit/63bfa0d261e0b9642988f371ac04f6215819e85e))
* **core:** prevent infinite recursive call ([#12133](https://github.com/botpress/botpress/issues/12133)) ([306e7ff](https://github.com/botpress/botpress/commit/306e7ffa473d07def4c6ef1097ac5ebe17b3f65f))
* upgrade nlu to 1.0.2 ([#12127](https://github.com/botpress/botpress/issues/12127)) ([d13adc4](https://github.com/botpress/botpress/commit/d13adc43904d53b8ca3aba24c75ee5299d4e9163))



## [12.30.1](https://github.com/botpress/botpress/compare/v12.30.0...v12.30.1) (2022-09-01)


### Bug Fixes

* **channel-web:** focus composer when single choice btn is clicked ([#12111](https://github.com/botpress/botpress/issues/12111)) ([f07a7e9](https://github.com/botpress/botpress/commit/f07a7e9b5e82a65a7aa31a3dcfe007f5000581c3))
* skills rendering ([#12113](https://github.com/botpress/botpress/issues/12113)) ([b2c4d4f](https://github.com/botpress/botpress/commit/b2c4d4fe3e562cb3733e34492fe7fc854b5dd300))



# [12.30.0](https://github.com/botpress/botpress/compare/v12.29.1...v12.30.0) (2022-08-26)


### Bug Fixes

* **channel-web:** dropdown should disable composer ([#12102](https://github.com/botpress/botpress/issues/12102)) ([4c9924b](https://github.com/botpress/botpress/commit/4c9924be0b3e16e7fe03d7fca772be964d6146e0))
* **dockerfile:** revert workaround and use proper solution ([#12103](https://github.com/botpress/botpress/issues/12103)) ([3d2bf51](https://github.com/botpress/botpress/commit/3d2bf5177e8fe9b727957c66968c0ce15f7874a3))
* **docker:** fix passing env vars to running shell ([#12051](https://github.com/botpress/botpress/issues/12051)) ([9e8f3a1](https://github.com/botpress/botpress/commit/9e8f3a1b5c3236e6831899b5e298a3e735f80eb4))
* **google-speech:** error when detecting SSML ([#12070](https://github.com/botpress/botpress/issues/12070)) ([c08a86e](https://github.com/botpress/botpress/commit/c08a86e2f04d8c0cfd910f34dc9c6bd4a0f028ec))
* **security:** only Super Admins can reboot the server ([#12100](https://github.com/botpress/botpress/issues/12100)) ([39e2e0f](https://github.com/botpress/botpress/commit/39e2e0f03007fba27b3f8f287c7fc33332afe594))


### Features

* **hitlnext:** Adds spanish language support ([#12056](https://github.com/botpress/botpress/issues/12056)) ([a2dc4ec](https://github.com/botpress/botpress/commit/a2dc4ec3524c580a08a247db30078320c799a04d))



## [12.29.1](https://github.com/botpress/botpress/compare/v12.29.0...v12.29.1) (2022-08-01)


### Bug Fixes

* **docker:** revert changes ([#12052](https://github.com/botpress/botpress/issues/12052)) ([0742113](https://github.com/botpress/botpress/commit/074211345e197203ad3d375908a17625f779e078))



# [12.29.0](https://github.com/botpress/botpress/compare/v12.28.1...v12.29.0) (2022-07-26)


### Bug Fixes

* **admin:** log the user out when account is locked out on pass change ([#11997](https://github.com/botpress/botpress/issues/11997)) ([5ba4d32](https://github.com/botpress/botpress/commit/5ba4d3260f3f4e547cf04f9e654a4e6931912744))
* **basic-skills:** reused choice will not start with fresh variables ([#11949](https://github.com/botpress/botpress/issues/11949)) ([93b3fc0](https://github.com/botpress/botpress/commit/93b3fc09355906ea55e9c48dff669f1022719132))
* **code-editor:** remove current value from env var typings ([#11990](https://github.com/botpress/botpress/issues/11990)) ([e4c0fdd](https://github.com/botpress/botpress/commit/e4c0fdd908d1857f8e2de26072130d902278b4cc))
* **hitl-next:** prevent triggering webhook without a url ([#12033](https://github.com/botpress/botpress/issues/12033)) ([7aa347f](https://github.com/botpress/botpress/commit/7aa347f095d06e9aeb986b85fac2e9933e4bc43f))
* **security:** validate bot access ([#11978](https://github.com/botpress/botpress/issues/11978)) ([4277f5c](https://github.com/botpress/botpress/commit/4277f5c79acc621cd24e0c83371a2ac0afd473b3))
* **webchat:** add aria labels to header buttons for screen readers ([8c6ebb8](https://github.com/botpress/botpress/commit/8c6ebb8b65ad70417b68e66645b2b570d21774be))


### Features

* **docker:** configure botpress user for the docker image ([#11937](https://github.com/botpress/botpress/issues/11937)) ([b5b6492](https://github.com/botpress/botpress/commit/b5b649244e7109978aafb0f0ce2c8d60212dcbb7))
* **google-speech:** support SSML ([#12031](https://github.com/botpress/botpress/issues/12031)) ([b53ddce](https://github.com/botpress/botpress/commit/b53ddce30e059cad73c8d2ba99c454236f5eb576))
* **hitl-next:** create endpoint to reject handoffs ([#12002](https://github.com/botpress/botpress/issues/12002)) ([1f01d7f](https://github.com/botpress/botpress/commit/1f01d7f86502907391fe2db7405b71eebcaec7ec))
* **hitl-next:** create webhook for hitlnext events ([#11976](https://github.com/botpress/botpress/issues/11976)) ([9ac31fb](https://github.com/botpress/botpress/commit/9ac31fbfcf81104b5b719d648b6f9c2d1ce37895))



## [12.28.1](https://github.com/botpress/botpress/compare/v12.28.0...v12.28.1) (2022-07-12)


### Bug Fixes

* **auth:** auth strategies ignore subpath ([#11917](https://github.com/botpress/botpress/issues/11917)) ([ce0f4c9](https://github.com/botpress/botpress/commit/ce0f4c9f4d0ae353b9410e1c907286e7b1e286ac)), closes [#11848](https://github.com/botpress/botpress/issues/11848)
* **channel-web:** escape html chars from messages ([#11948](https://github.com/botpress/botpress/issues/11948)) ([4584679](https://github.com/botpress/botpress/commit/4584679d42550395375015a0a666babf5a3c2494))
* **channel-web:** glitch animations opening/closing chat ([#11925](https://github.com/botpress/botpress/issues/11925)) ([1d64af7](https://github.com/botpress/botpress/commit/1d64af7accfea70a44d215de9e6f5775d186c315)), closes [#11819](https://github.com/botpress/botpress/issues/11819)
* **core:** make sure 1 node times out sessions ([#11968](https://github.com/botpress/botpress/issues/11968)) ([a095f6d](https://github.com/botpress/botpress/commit/a095f6de0ff253fb8ade4b0e05599d0afc2ad315))
* **core:** use same cors config as server for socket.io ([#11971](https://github.com/botpress/botpress/issues/11971)) ([3251e22](https://github.com/botpress/botpress/commit/3251e22bad92e5e29a35e47f18ebb25cae276099))
* **debugger:** escape html chars from logs ([#11934](https://github.com/botpress/botpress/issues/11934)) ([62a4df7](https://github.com/botpress/botpress/commit/62a4df7268d10f1e4cd6492d295301c492565df3))
* **hitlnext:** do not to create a handoff when event comes from converse ([#11922](https://github.com/botpress/botpress/issues/11922)) ([4085a2a](https://github.com/botpress/botpress/commit/4085a2ae404c5be06e25b20e141ac6c7b4a74d06))
* **hitlnext:** fix error when creating handoff from converse ([#11921](https://github.com/botpress/botpress/issues/11921)) ([6ac9f47](https://github.com/botpress/botpress/commit/6ac9f4726cf78e1bae93c15f35b3a7255a701e55))


### Features

* **core:** adopt zxcvbn score as pwd policy ([#11939](https://github.com/botpress/botpress/issues/11939)) ([adf67e2](https://github.com/botpress/botpress/commit/adf67e272993ac192997397f44bf1f731b51163b))
* **ui-admin:** password strength indicator ([#11957](https://github.com/botpress/botpress/issues/11957)) ([985cc81](https://github.com/botpress/botpress/commit/985cc8194651851f39259a8fac0276dc576596fe))



# [12.28.0](https://github.com/botpress/botpress/compare/v12.27.0...v12.28.0) (2022-06-16)


### Bug Fixes

* **admin:** add id to NPS, support white labeling ([#11770](https://github.com/botpress/botpress/issues/11770)) ([30815fe](https://github.com/botpress/botpress/commit/30815fefad6a378990f5a73b902216c43f2d2495))
* **builtin:** fix action for storing files locally ([#11798](https://github.com/botpress/botpress/issues/11798)) ([a07ff53](https://github.com/botpress/botpress/commit/a07ff5304e9e5ab94696a9d9de025708863cc65f))
* **core:** fix export with dotted folder ([#11780](https://github.com/botpress/botpress/issues/11780)) ([8e8f45a](https://github.com/botpress/botpress/commit/8e8f45ad0ac8d2d35e9ecb16fe30f619b8771596))
* **nlu:** trainset hash is computed from sorted datastructure ([#11878](https://github.com/botpress/botpress/issues/11878)) ([c8a4566](https://github.com/botpress/botpress/commit/c8a4566d52a236fca40cc991d931f7329c69955f))
* **redis:** improved error handling when redis is down ([#11885](https://github.com/botpress/botpress/issues/11885)) ([a83d345](https://github.com/botpress/botpress/commit/a83d3452b84effc93dfd3e7d4c599a8b9d4e6127)), closes [#11738](https://github.com/botpress/botpress/issues/11738)


### Features

* **hitlnext:** add skill, fix lang & expired handoff ([#11775](https://github.com/botpress/botpress/issues/11775)) ([a67bf73](https://github.com/botpress/botpress/commit/a67bf73abda1f364ef6b75618649904bf98eb7dd))



# [12.27.0](https://github.com/botpress/botpress/compare/v12.26.12...v12.27.0) (2022-04-26)


### Bug Fixes

* **admin:** fix wrong doc links ([#11668](https://github.com/botpress/botpress/issues/11668)) ([50cf119](https://github.com/botpress/botpress/commit/50cf119ab0a757d6ba950436c4f25fc9bd454489))
* **code-editor:** allow creating hooks with hook type as name ([#11698](https://github.com/botpress/botpress/issues/11698)) ([fd96a81](https://github.com/botpress/botpress/commit/fd96a81a87a5a98c7d0dddc3ec6d4ebaf6291295)), closes [#5768](https://github.com/botpress/botpress/issues/5768)
* **core:** fix SAML SLO config as environment variables ([#11757](https://github.com/botpress/botpress/issues/11757)) ([ba75d9f](https://github.com/botpress/botpress/commit/ba75d9f5fd0c1b1f6ef77f655cff5a0a5ac5f0ec))
* **messaging-service:** add lock ([#11733](https://github.com/botpress/botpress/issues/11733)) ([7946c9d](https://github.com/botpress/botpress/commit/7946c9d117925f2713d54f692cbe94932c3c8f1e))
* **testing:** create new session before recording ([#11693](https://github.com/botpress/botpress/issues/11693)) ([05e0a86](https://github.com/botpress/botpress/commit/05e0a868c332236d66cf1f2e09fd718922e01238)), closes [#3880](https://github.com/botpress/botpress/issues/3880)
* **testing:** fix testing module not working ([#11687](https://github.com/botpress/botpress/issues/11687)) ([5804000](https://github.com/botpress/botpress/commit/5804000edfac78db93c81584880c9f3c901d7f08)), closes [#11541](https://github.com/botpress/botpress/issues/11541)
* **workspaces:** display warning if workspace has no authStrategies ([#11679](https://github.com/botpress/botpress/issues/11679)) ([52c4e95](https://github.com/botpress/botpress/commit/52c4e95d386a0cdcba5f7e35f54a2cecb3451e37)), closes [#11536](https://github.com/botpress/botpress/issues/11536)


### Features

* **channels:** add channel configuration page ([#11646](https://github.com/botpress/botpress/issues/11646)) ([e85bb34](https://github.com/botpress/botpress/commit/e85bb341d7bf6e66434819c62ac4b9dd0079c415))
* **messaging:** expose LOGGING_ENABLED ([#11656](https://github.com/botpress/botpress/issues/11656)) ([e30b90d](https://github.com/botpress/botpress/commit/e30b90d34ba75343a4d4b82336a50e767e851ab1))
* **monitoring:** report status of messaging and nlu ([#11716](https://github.com/botpress/botpress/issues/11716)) ([a7b6b86](https://github.com/botpress/botpress/commit/a7b6b868e17501f2eff5f64604d71add24c93d1c)), closes [#11658](https://github.com/botpress/botpress/issues/11658)



## [12.26.12](https://github.com/botpress/botpress/compare/v12.26.11...v12.26.12) (2022-03-21)


### Bug Fixes

* **pro:** point to proper commit ([#11651](https://github.com/botpress/botpress/issues/11651)) ([0554099](https://github.com/botpress/botpress/commit/055409952b21d6cb31f96b2d479de614f22f3d23))



## [12.26.11](https://github.com/botpress/botpress/compare/v12.26.10...v12.26.11) (2022-03-17)


### Bug Fixes

* **builtin:** smalltalk qnas have no contexts ([#11533](https://github.com/botpress/botpress/issues/11533)) ([cc398ad](https://github.com/botpress/botpress/commit/cc398ad81ca4e21a67496e2e94d93e3cfe4a5a8b))
* **channel-web:** focus on composer when it gets unlocked ([#11616](https://github.com/botpress/botpress/issues/11616)) ([94bc6df](https://github.com/botpress/botpress/commit/94bc6df1c019b7656c848679cb942ca83d694789))
* **code-editor:** minor ux issues ([#11598](https://github.com/botpress/botpress/issues/11598)) ([bcaefe5](https://github.com/botpress/botpress/commit/bcaefe55a6b02e03cf10e123e171655ce463ba78))
* **core:** add version to connection name ([#11573](https://github.com/botpress/botpress/issues/11573)) ([e28ebb4](https://github.com/botpress/botpress/commit/e28ebb4e83cc2e88c10aee84bfd1c1dd10166baa))
* **core:** change default timeout ([#11562](https://github.com/botpress/botpress/issues/11562)) ([7d7f84f](https://github.com/botpress/botpress/commit/7d7f84f833b810f05941671610e7dbcd839bc82c))
* **core:** fix caching issue in CMS between studio and bp ([#11631](https://github.com/botpress/botpress/issues/11631)) ([e3c0c54](https://github.com/botpress/botpress/commit/e3c0c5441f3d1576210581a75ba4fae5153ec4a0)), closes [#5769](https://github.com/botpress/botpress/issues/5769)
* **core:** revert vm2 ([#11581](https://github.com/botpress/botpress/issues/11581)) ([6b488fe](https://github.com/botpress/botpress/commit/6b488fe1b4b71c4a3f85e7c95287a6be8d09e48f))
* **core:** small changes to diagnostics ([#11563](https://github.com/botpress/botpress/issues/11563)) ([a34619a](https://github.com/botpress/botpress/commit/a34619a1c90624405599556113b9552c765d7e11))
* **core:** variable in config ([#11548](https://github.com/botpress/botpress/issues/11548)) ([5052058](https://github.com/botpress/botpress/commit/5052058fe81f4b2a0845dcaad069ab351cc1e23a))
* **messaging:** conversation.started skip dialog engine ([#11551](https://github.com/botpress/botpress/issues/11551)) ([2a65649](https://github.com/botpress/botpress/commit/2a6564968147acf6aa531e8a1cdee98d20a06d93))
* **messaging:** fix issue with path on external url ([#11574](https://github.com/botpress/botpress/issues/11574)) ([884d164](https://github.com/botpress/botpress/commit/884d164f6b5efcb171f3596ddffd863586dac450))


### Features

* **auth:** implement SAML SLO ([#11599](https://github.com/botpress/botpress/issues/11599)) ([368addd](https://github.com/botpress/botpress/commit/368addd3e6c9db5ebc23d1ffa023eaf3de15a9ba))
* **web:** allow fullscreen mode with embedded ([#11607](https://github.com/botpress/botpress/issues/11607)) ([3f656ec](https://github.com/botpress/botpress/commit/3f656ec29bd9ea1c8273c261ebcc4dcaef9ec8cd))



## [12.26.10](https://github.com/botpress/botpress/compare/v12.26.9...v12.26.10) (2022-02-09)


### Bug Fixes

* **admin:** fix admin debug pane not working ([#11421](https://github.com/botpress/botpress/issues/11421)) ([ada9d1f](https://github.com/botpress/botpress/commit/ada9d1f55343e1b161d0d52bb016c8be54a183dd)), closes [#11343](https://github.com/botpress/botpress/issues/11343)
* **admin:** update branding assets ([#11248](https://github.com/botpress/botpress/issues/11248)) ([73d60c4](https://github.com/botpress/botpress/commit/73d60c4d2db5dc6061368ae64d8c6133a896eec3))
* **bot:** fix unmounting bot before writing files when overwriting ([#11370](https://github.com/botpress/botpress/issues/11370)) ([ea97ccb](https://github.com/botpress/botpress/commit/ea97ccbaaee9e9fab914d282e5728fb2c1c22109))
* **bot:** we now delete old file when overwriting a bot ([#11371](https://github.com/botpress/botpress/issues/11371)) ([b0bf68e](https://github.com/botpress/botpress/commit/b0bf68ee9ba4ab0eb7b8de2bcfa5b53064d7dcf5)), closes [#5754](https://github.com/botpress/botpress/issues/5754)
* **builtin:** added removeVariable action ([#11364](https://github.com/botpress/botpress/issues/11364)) ([bb3e132](https://github.com/botpress/botpress/commit/bb3e132a5b90099719bdb0a91f2604126d8e16ea))
* **channel-web:** fetch last message for each convo ([#11288](https://github.com/botpress/botpress/issues/11288)) ([822a8cd](https://github.com/botpress/botpress/commit/822a8cdad7558fb566e24637924e0319df1acd6a))
* **code-editor:** admin should be able to edit bot config ([#11339](https://github.com/botpress/botpress/issues/11339)) ([248cec7](https://github.com/botpress/botpress/commit/248cec7eee5b0bdd1de70f0d8e454dd443f031f3))
* **code-editor:** prevent "undefined" content in files ([#11435](https://github.com/botpress/botpress/issues/11435)) ([ba22305](https://github.com/botpress/botpress/commit/ba22305d4330bcd74cd238bbe6167ca5b3cb302c))
* **core:** session state not persisted during before_session_timeout hook ([#5702](https://github.com/botpress/botpress/issues/5702)) ([28221d2](https://github.com/botpress/botpress/commit/28221d2798e27f0a5f295a90fbb545b440269ace))
* **core:** show correct status ([#11449](https://github.com/botpress/botpress/issues/11449)) ([030c21a](https://github.com/botpress/botpress/commit/030c21ab27050f95636e0391dd7ffd3d4df3d1da))
* **id:** unique ids for all elements ([#11346](https://github.com/botpress/botpress/issues/11346)) ([d8602aa](https://github.com/botpress/botpress/commit/d8602aa81f8d3af170b299e0ab82814b831b4597))
* **module:** we now delete old files when overwriting an existing module ([#11384](https://github.com/botpress/botpress/issues/11384)) ([41c432e](https://github.com/botpress/botpress/commit/41c432e78b086718ce320664a139243aff968ef8)), closes [#5755](https://github.com/botpress/botpress/issues/5755)
* **pipeline:** fix copying copying bot in pipeline ([#11391](https://github.com/botpress/botpress/issues/11391)) ([868af5d](https://github.com/botpress/botpress/commit/868af5de28a7718c6fc038f52a317977a73985a9))
* **tests:** fix flaky number test ([#11443](https://github.com/botpress/botpress/issues/11443)) ([9c12f7b](https://github.com/botpress/botpress/commit/9c12f7b22aa35f64229b1b308aa664eacfc75c89))
* **ui:** fix 1px of whitespace issue ([#11353](https://github.com/botpress/botpress/issues/11353)) ([2b0df4d](https://github.com/botpress/botpress/commit/2b0df4df882a47b60083dbe6421730c130fae7e4))
* **webchat:** changing language also updates ui ([#11442](https://github.com/botpress/botpress/issues/11442)) ([29cc38a](https://github.com/botpress/botpress/commit/29cc38a5f5a1221a714a849fab036e5b06376d3c))


### Features

* **admin:** added net promoter score in botpress ([#11202](https://github.com/botpress/botpress/issues/11202)) ([fbbf064](https://github.com/botpress/botpress/commit/fbbf064eb561f7a92504c1f7cadd898a53bcaeb5))



## [12.26.9](https://github.com/botpress/botpress/compare/v12.26.8...v12.26.9) (2022-01-17)


### Bug Fixes

* **admin:** create bot from template is fast again ([#11218](https://github.com/botpress/botpress/issues/11218)) ([3ed45c1](https://github.com/botpress/botpress/commit/3ed45c1))
* **channel-web:** fix messaging tables schema in channel-web migration ([#5760](https://github.com/botpress/botpress/issues/5760)) ([f52411e](https://github.com/botpress/botpress/commit/f52411e))
* **channel-web:** fix switching user language ([#5753](https://github.com/botpress/botpress/issues/5753)) ([5ccebcf](https://github.com/botpress/botpress/commit/5ccebcf))
* **dialog:** find flow now case insensitive ([#5771](https://github.com/botpress/botpress/issues/5771)) ([dae17aa](https://github.com/botpress/botpress/commit/dae17aa))
* **dx:** fix failing tests ([#5739](https://github.com/botpress/botpress/issues/5739)) ([84a0bf5](https://github.com/botpress/botpress/commit/84a0bf5))
* **hitl:** add support for all types of messages ([#5736](https://github.com/botpress/botpress/issues/5736)) ([dac5e3e](https://github.com/botpress/botpress/commit/dac5e3e))
* **misunderstood:** strip slots for amend screen ([#11214](https://github.com/botpress/botpress/issues/11214)) ([bcf4bbd](https://github.com/botpress/botpress/commit/bcf4bbd))
* **ui:** fix typos in ui ([#11206](https://github.com/botpress/botpress/issues/11206)) ([32daa69](https://github.com/botpress/botpress/commit/32daa69))


### Features

* **messaging:** support receiving proactive messages ([#5728](https://github.com/botpress/botpress/issues/5728)) ([57c20f3](https://github.com/botpress/botpress/commit/57c20f3))
* **misunderstood:** add support for all types of messages  ([#5731](https://github.com/botpress/botpress/issues/5731)) ([8c6adff](https://github.com/botpress/botpress/commit/8c6adff)), closes [#5734](https://github.com/botpress/botpress/issues/5734)



## [12.26.8](https://github.com/botpress/botpress/compare/v12.26.3...v12.26.8) (2021-12-02)


### Bug Fixes

* **1002:** make embed chat icon less weird in iframe ([#5640](https://github.com/botpress/botpress/issues/5640)) ([99b1a9b](https://github.com/botpress/botpress/commit/99b1a9b))
* **admin:** DEV-1238: Hide/Show Button admin panel ([#5634](https://github.com/botpress/botpress/issues/5634)) ([9ed29d3](https://github.com/botpress/botpress/commit/9ed29d3))
* **admin:** fix user management ([#5623](https://github.com/botpress/botpress/issues/5623)) ([eda1c43](https://github.com/botpress/botpress/commit/eda1c43))
* **admin:** increase module upload timeout ([#5684](https://github.com/botpress/botpress/issues/5684)) ([b44b45c](https://github.com/botpress/botpress/commit/b44b45c))
* **auth:** remove add to ws in user creation ([#5686](https://github.com/botpress/botpress/issues/5686)) ([6ed8f6d](https://github.com/botpress/botpress/commit/6ed8f6d))
* **basic-skills:** added some form validation ([28e5609](https://github.com/botpress/botpress/commit/28e5609))
* **basic-skills:** added some form validation ([c0f6392](https://github.com/botpress/botpress/commit/c0f6392))
* **channel-web:** disable autoscroll when user scroll manually ([#5694](https://github.com/botpress/botpress/issues/5694)) ([391ef90](https://github.com/botpress/botpress/commit/391ef90))
* **channel-web:** display feedback actions on all q&a answers ([#5662](https://github.com/botpress/botpress/issues/5662)) ([7d342f9](https://github.com/botpress/botpress/commit/7d342f9))
* **channel-web:** fix image path when using custom url ([#5689](https://github.com/botpress/botpress/issues/5689)) ([8c29b47](https://github.com/botpress/botpress/commit/8c29b47))
* **channel-web:** fix migrating large number of conversations: ([#5712](https://github.com/botpress/botpress/issues/5712)) ([9d922fe](https://github.com/botpress/botpress/commit/9d922fe))
* **channel-web:** handle RTL text direction ([6642d74](https://github.com/botpress/botpress/commit/6642d74))
* **channel-web:** resent on enter ([8bb3480](https://github.com/botpress/botpress/commit/8bb3480))
* **channel-web:** reset on ctrl enter ([3cb2f3f](https://github.com/botpress/botpress/commit/3cb2f3f))
* **code-editor:** allow folder in file names ([#5620](https://github.com/botpress/botpress/issues/5620)) ([0bc6b1a](https://github.com/botpress/botpress/commit/0bc6b1a))
* **code-editor:** DEV-1964: DX improvement. Have the same behavior as VSCODE ([#5642](https://github.com/botpress/botpress/issues/5642)) ([be5eae0](https://github.com/botpress/botpress/commit/be5eae0))
* **core:** fix auth service for channels ([#5637](https://github.com/botpress/botpress/issues/5637)) ([68eda02](https://github.com/botpress/botpress/commit/68eda02))
* **core:** fix createdOn save order ([#5629](https://github.com/botpress/botpress/issues/5629)) ([b8b86a2](https://github.com/botpress/botpress/commit/b8b86a2))
* **core:** partial fix for bp push ([#5652](https://github.com/botpress/botpress/issues/5652)) ([b24bc3f](https://github.com/botpress/botpress/commit/b24bc3f))
* **core:** wait for cache invaliation after update/set attributes ([#5711](https://github.com/botpress/botpress/issues/5711)) ([472cd2d](https://github.com/botpress/botpress/commit/472cd2d))
* **dx:** fix e2e tests ([#5697](https://github.com/botpress/botpress/issues/5697)) ([a472ac4](https://github.com/botpress/botpress/commit/a472ac4))
* **emulator:** implicitly handle text direction ([d23e7a1](https://github.com/botpress/botpress/commit/d23e7a1))
* **launch:** added instructions for newbies ([#5653](https://github.com/botpress/botpress/issues/5653)) ([b949540](https://github.com/botpress/botpress/commit/b949540))
* **migrations:** fix TESTMIG_ALL ([#5631](https://github.com/botpress/botpress/issues/5631)) ([fb6cfcf](https://github.com/botpress/botpress/commit/fb6cfcf))
* **nlu:** adding modelId to output ([#5650](https://github.com/botpress/botpress/issues/5650)) ([6c00bc6](https://github.com/botpress/botpress/commit/6c00bc6))
* **realtime:** allow to use websocket without sticky sessions ([#5688](https://github.com/botpress/botpress/issues/5688)) ([5181340](https://github.com/botpress/botpress/commit/5181340)), closes [#5693](https://github.com/botpress/botpress/issues/5693)
* **skills:** dialog overflow on too many params, fixes [#149](https://github.com/botpress/botpress/issues/149) ([#5614](https://github.com/botpress/botpress/issues/5614)) ([817e21c](https://github.com/botpress/botpress/commit/817e21c))
* **skills:** fix subsequent call api ([#5628](https://github.com/botpress/botpress/issues/5628)) ([4f53ce8](https://github.com/botpress/botpress/commit/4f53ce8))
* **webchat:** fixed bug of allowing user to send more than the max utterance length ([#5633](https://github.com/botpress/botpress/issues/5633)) ([1f18201](https://github.com/botpress/botpress/commit/1f18201))
* add env variables to list ([#5625](https://github.com/botpress/botpress/issues/5625)) ([4b1ca70](https://github.com/botpress/botpress/commit/4b1ca70))
* **admin:** error "BP_0044" when there is disabled bots in the bot list ([#5618](https://github.com/botpress/botpress/issues/5618)) ([a04c5d4](https://github.com/botpress/botpress/commit/a04c5d4))
* **code-editor:** bug selecting file of same name ([#5632](https://github.com/botpress/botpress/issues/5632)) ([88175a4](https://github.com/botpress/botpress/commit/88175a4))
* **webchat:** mic icon overlaid on button ([#5626](https://github.com/botpress/botpress/issues/5626)) ([b3955fe](https://github.com/botpress/botpress/commit/b3955fe))


### Features




## [12.26.7](https://github.com/botpress/botpress/compare/v12.26.3...v12.26.7) (2021-11-10)


### Bug Fixes

* **channel-web:** fix custom user id in events ([#5591](https://github.com/botpress/botpress/issues/5591)) ([dbe9e2e](https://github.com/botpress/botpress/commit/dbe9e2e)), closes [#5658](https://github.com/botpress/botpress/issues/5658)
* **core:** fix chat auth expiry with messaging ([#5679](https://github.com/botpress/botpress/issues/5679)) ([63f15d5](https://github.com/botpress/botpress/commit/63f15d5))
* **e2e:** change pwd test does not reuse same pwd ([#5665](https://github.com/botpress/botpress/issues/5665)) ([7d5dc75](https://github.com/botpress/botpress/commit/7d5dc75))
* **hitlnext:** use common storage deserialisation ([#5600](https://github.com/botpress/botpress/issues/5600)) ([d2dc154](https://github.com/botpress/botpress/commit/d2dc154))
* **nlu:** nlu client set proxy false when querying localhost ([#5598](https://github.com/botpress/botpress/issues/5598)) ([7ba42dc](https://github.com/botpress/botpress/commit/7ba42dc))
* **nlu:** nlu module returns 404 when nlu server is unreachable ([#5622](https://github.com/botpress/botpress/issues/5622)) ([256ae57](https://github.com/botpress/botpress/commit/256ae57))
* **strategy-basic:** disallow reusing previous password ([#5619](https://github.com/botpress/botpress/issues/5619)) ([544320e](https://github.com/botpress/botpress/commit/544320e))
* small eslint warnings ([7ba6bbf](https://github.com/botpress/botpress/commit/7ba6bbf))


### Features

* **core:** allow disabling file listeners for dumb deployments ([#5664](https://github.com/botpress/botpress/issues/5664)) ([b81c761](https://github.com/botpress/botpress/commit/b81c761))
* adds Segment integration ([#5608](https://github.com/botpress/botpress/issues/5608)) ([24d7ad5](https://github.com/botpress/botpress/commit/24d7ad5))



## [12.26.6](https://github.com/botpress/botpress/compare/v12.26.3...v12.26.6) (2021-10-22)


### Bug Fixes

* **auth:** allow first user to register with pro strategies ([#5564](https://github.com/botpress/botpress/issues/5564)) ([cf93a16](https://github.com/botpress/botpress/commit/cf93a16))
* **basic-skills:** slot filling issues if using validation function  ([#5573](https://github.com/botpress/botpress/issues/5573)) ([1d8a232](https://github.com/botpress/botpress/commit/1d8a232))
* **bp:** attach error in logger.error in action strategy ([#5588](https://github.com/botpress/botpress/issues/5588)) ([b2a555b](https://github.com/botpress/botpress/commit/b2a555b))
* **channel-web:** fix display of carousels in emulator ([#5558](https://github.com/botpress/botpress/issues/5558)) ([2827cde](https://github.com/botpress/botpress/commit/2827cde))
* **channel-web:** fix display of carousels on wide screens ([#5563](https://github.com/botpress/botpress/issues/5563)) ([6005917](https://github.com/botpress/botpress/commit/6005917))
* **channel-web:** fix user creation when user mapping exists ([#5566](https://github.com/botpress/botpress/issues/5566)) ([eaec03a](https://github.com/botpress/botpress/commit/eaec03a))
* **channel-web:** init api when ready ([#5570](https://github.com/botpress/botpress/issues/5570)) ([154f4c7](https://github.com/botpress/botpress/commit/154f4c7))
* **code-editor:** actions and hooks comment wrapper is now readonly ([#5510](https://github.com/botpress/botpress/issues/5510)) ([3814267](https://github.com/botpress/botpress/commit/3814267))
* **core:** give user access to workspaces on signup ([#5550](https://github.com/botpress/botpress/issues/5550)) ([292a0c0](https://github.com/botpress/botpress/commit/292a0c0))
* **emulator:** manual scroll doesnt auto scroll to bottom ([#5561](https://github.com/botpress/botpress/issues/5561)) ([29640ac](https://github.com/botpress/botpress/commit/29640ac))
* **hitlnext:** flatten user object information ([#5554](https://github.com/botpress/botpress/issues/5554)) ([6e084d0](https://github.com/botpress/botpress/commit/6e084d0))
* **messaging:** fix receiving health events through webhook ([#5551](https://github.com/botpress/botpress/issues/5551)) ([26b27bf](https://github.com/botpress/botpress/commit/26b27bf))
* **studio:** communication behind proxy ([#5579](https://github.com/botpress/botpress/issues/5579)) ([7cf46fb](https://github.com/botpress/botpress/commit/7cf46fb)), closes [#5581](https://github.com/botpress/botpress/issues/5581)


### Features

* **analytics:** add details to qna-analytics feedback ([#5485](https://github.com/botpress/botpress/issues/5485)) ([1f28468](https://github.com/botpress/botpress/commit/1f28468))
* **telemetry:** new user stats ([#5420](https://github.com/botpress/botpress/issues/5420)) ([7dfb241](https://github.com/botpress/botpress/commit/7dfb241))



## [12.26.5](https://github.com/botpress/botpress/compare/v12.26.3...v12.26.5) (2021-10-07)


### Bug Fixes

* **admin:** added form validation on bot id and name ([#5524](https://github.com/botpress/botpress/issues/5524)) ([4e5c6ca](https://github.com/botpress/botpress/commit/4e5c6ca))
* **basic-skills:** run validation on already extracted in slot filling ([#5531](https://github.com/botpress/botpress/issues/5531)) ([0b61c1c](https://github.com/botpress/botpress/commit/0b61c1c))
* **channel-web:** filter out empty text payload messages ([#5502](https://github.com/botpress/botpress/issues/5502)) ([bec2fde](https://github.com/botpress/botpress/commit/bec2fde))
* **channel-web:** messagelist now updates scroll position on update ([#5520](https://github.com/botpress/botpress/issues/5520)) ([a235fd4](https://github.com/botpress/botpress/commit/a235fd4))
* **messaging:** fix webhook url validation ([#5528](https://github.com/botpress/botpress/issues/5528)) ([429bea3](https://github.com/botpress/botpress/commit/429bea3))
* **nlu:** better error logging when no model found. ([#5541](https://github.com/botpress/botpress/issues/5541)) ([9d31f17](https://github.com/botpress/botpress/commit/9d31f17))
* **nlu:** made null assertion in extractElectedIntentSlot more robust ([#5497](https://github.com/botpress/botpress/issues/5497)) ([c167ea0](https://github.com/botpress/botpress/commit/c167ea0))
* **ui-shared:** add null check in collapsible ([#5525](https://github.com/botpress/botpress/issues/5525)) ([49e7973](https://github.com/botpress/botpress/commit/49e7973))



## [12.26.4](https://github.com/botpress/botpress/compare/v12.26.3...v12.26.4) (2021-09-28)


### Bug Fixes

* **channel-web:** avatar won`t crash if there is no name ([#5472](https://github.com/botpress/botpress/issues/5472)) ([c52592e](https://github.com/botpress/botpress/commit/c52592e))
* **channel-web:** fix display of image, file, audio and video content-elements ([#5488](https://github.com/botpress/botpress/issues/5488)) ([6321d23](https://github.com/botpress/botpress/commit/6321d23))
* **channel-web:** prevent sending proactive messages on webchatLoaded ([#5469](https://github.com/botpress/botpress/issues/5469)) ([e3878bb](https://github.com/botpress/botpress/commit/e3878bb))
* **core:** fix unhandled rejections ([#5489](https://github.com/botpress/botpress/issues/5489)) ([e9a6d41](https://github.com/botpress/botpress/commit/e9a6d41))
* **dev:** fix warnings with logger ([#5483](https://github.com/botpress/botpress/issues/5483)) ([3e1dac5](https://github.com/botpress/botpress/commit/3e1dac5))
* **misunderstood:** fix remove duplicated preview and add scroll for chats ([#5458](https://github.com/botpress/botpress/issues/5458)) ([ecf0d62](https://github.com/botpress/botpress/commit/ecf0d62))



## [12.26.3](https://github.com/botpress/botpress/compare/v12.26.2...v12.26.3) (2021-09-17)


### Bug Fixes

* **channel-web:** down mig drop all msg_ tables ([#5452](https://github.com/botpress/botpress/issues/5452)) ([6f03d1c](https://github.com/botpress/botpress/commit/6f03d1c))
* **channel-web:** fix useSessionStorage config option ([#5118](https://github.com/botpress/botpress/issues/5118)) ([edac7c6](https://github.com/botpress/botpress/commit/edac7c6)), closes [#5405](https://github.com/botpress/botpress/issues/5405)
* **core:** add small safeguards ([#5459](https://github.com/botpress/botpress/issues/5459)) ([a1a83c8](https://github.com/botpress/botpress/commit/a1a83c8))
* **core:** bigger frontend timeout ([#5455](https://github.com/botpress/botpress/issues/5455)) ([f976538](https://github.com/botpress/botpress/commit/f976538))
* **hitl:** use renderPayload from ui-shared-lite to fix undefined ([#5454](https://github.com/botpress/botpress/issues/5454)) ([56a020c](https://github.com/botpress/botpress/commit/56a020c))



## [12.26.2](https://github.com/botpress/botpress/compare/v12.26.1...v12.26.2) (2021-09-14)

### Bug Fixes

- **analytics:** fix n/a lang entries description ([#5428](https://github.com/botpress/botpress/issues/5428)) ([87a4005](https://github.com/botpress/botpress/commit/87a4005))
- **builtin_image:** modified how we search for mimetype in the image component. ([#5401](https://github.com/botpress/botpress/issues/5401)) ([4dc35be](https://github.com/botpress/botpress/commit/4dc35be))
- **channel-web:** fix messaging migration ([#5410](https://github.com/botpress/botpress/issues/5410)) ([a8881a6](https://github.com/botpress/botpress/commit/a8881a6))
- **channel-web:** fix migration when duplicate bot ids ([#5445](https://github.com/botpress/botpress/issues/5445)) ([3f143ed](https://github.com/botpress/botpress/commit/3f143ed))
- **channel-web:** fix typing indicator display ([#5421](https://github.com/botpress/botpress/issues/5421)) ([84cc6b5](https://github.com/botpress/botpress/commit/84cc6b5))
- **code-editor:** file listing error 'undefined is not iterable' ([#5439](https://github.com/botpress/botpress/issues/5439)) ([1a8e329](https://github.com/botpress/botpress/commit/1a8e329))
- **google-speech:** fix using google-speech with ogg opus files ([#5450](https://github.com/botpress/botpress/issues/5450)) ([4d76d3f](https://github.com/botpress/botpress/commit/4d76d3f))
- **hitlnext:** fix scrolling overflow for shortcut ([#5432](https://github.com/botpress/botpress/issues/5432)) ([81aa3ad](https://github.com/botpress/botpress/commit/81aa3ad))
- **misunderstood:** bring back event.state.user.language ([#5436](https://github.com/botpress/botpress/issues/5436)) ([d0268c9](https://github.com/botpress/botpress/commit/d0268c9))
- **misunderstood:** remove user language, it's never defined ([#5431](https://github.com/botpress/botpress/issues/5431)) ([1c04dd2](https://github.com/botpress/botpress/commit/1c04dd2))
- **misunderstood:** add reason to setEventStatus when switching tabs ([#5384](https://github.com/botpress/botpress/issues/5384)) ([a991500](https://github.com/botpress/botpress/commit/a991500))
- **hitlnext:** remove obsolete pkg react-itial and add react-avatar ([#5408](https://github.com/botpress/botpress/issues/5408)) ([4fe31f6](https://github.com/botpress/botpress/commit/4fe31f6))

# [12.26.1](https://github.com/botpress/botpress/compare/v12.26.0...v12.26.1) (2021-09-03)

### Bug Fixes

- **channel-web:** fix messaging migration ([#5410](https://github.com/botpress/botpress/issues/5410)) ([a8881a6](https://github.com/botpress/botpress/commit/a8881a6))

# [12.26.0](https://github.com/botpress/botpress/compare/v12.24.1...v12.26.0) (2021-09-02)

### Bug Fixes

- **admin:** add the chatuser role id to the filter ([#5285](https://github.com/botpress/botpress/issues/5285)) ([f582e47](https://github.com/botpress/botpress/commit/f582e47))
- **admin:** change pipeline stage edit endpoint ([#5368](https://github.com/botpress/botpress/issues/5368)) ([3c97635](https://github.com/botpress/botpress/commit/3c97635))
- **admin:** fix restarting Botpress from the admin ([#5377](https://github.com/botpress/botpress/issues/5377)) ([8d67cca](https://github.com/botpress/botpress/commit/8d67cca))
- **channel-web:** fix missing dependencies ([#5375](https://github.com/botpress/botpress/issues/5375)) ([ded9b67](https://github.com/botpress/botpress/commit/ded9b67))
- **core:** fix workspace error ([#5374](https://github.com/botpress/botpress/issues/5374)) ([aca569b](https://github.com/botpress/botpress/commit/aca569b))
- **core:** remove increment / decrement analytics actions ([#5340](https://github.com/botpress/botpress/issues/5340)) ([b7d311d](https://github.com/botpress/botpress/commit/b7d311d))
- **core:** remove leftover debug logging ([#5369](https://github.com/botpress/botpress/issues/5369)) ([5466b1e](https://github.com/botpress/botpress/commit/5466b1e))
- **core:** workspace management api ([#5329](https://github.com/botpress/botpress/issues/5329)) ([9cfad4e](https://github.com/botpress/botpress/commit/9cfad4e))
- **messaging:** prevent multiple bots from using same clientId ([#5341](https://github.com/botpress/botpress/issues/5341)) ([d6adfc1](https://github.com/botpress/botpress/commit/d6adfc1))
- **misunderstood:** change preview column from varchar to text ([#5380](https://github.com/botpress/botpress/issues/5380)) ([f34fcef](https://github.com/botpress/botpress/commit/f34fcef))

### Features

- **core:** add before conversation end hook and flow ([#5215](https://github.com/botpress/botpress/issues/5215)) ([de732d1](https://github.com/botpress/botpress/commit/de732d1))
- add markdown by default for misunderstood chatPreview ([#5372](https://github.com/botpress/botpress/issues/5372)) ([60fb52c](https://github.com/botpress/botpress/commit/60fb52c))
- display user's object props as string on UserProfile for hitlnext ([#5342](https://github.com/botpress/botpress/issues/5342)) ([71193d5](https://github.com/botpress/botpress/commit/71193d5))
- **hitlnext:** add feature to filter handoffs list by tags ([#5205](https://github.com/botpress/botpress/issues/5205)) ([2725054](https://github.com/botpress/botpress/commit/2725054))

# [12.25.0](https://github.com/botpress/botpress/compare/v12.24.1...v12.25.0) (2021-08-20)

### Bug Fixes

- **core:** merge extensions in channel-web ([#5301](https://github.com/botpress/botpress/issues/5301)) ([a08d4c0](https://github.com/botpress/botpress/commit/a08d4c0))
- **core:** various fixes ([#5323](https://github.com/botpress/botpress/issues/5323)) ([f052678](https://github.com/botpress/botpress/commit/f052678))
- **studio:** move bot migrations to studio ([#5187](https://github.com/botpress/botpress/issues/5187)) ([2db471a](https://github.com/botpress/botpress/commit/2db471a))

### Features

- **core:** bot-scoped libraries ([#5319](https://github.com/botpress/botpress/issues/5319)) ([49090bf](https://github.com/botpress/botpress/commit/49090bf))
- **core:** custom bot prefix per workspace ([#5326](https://github.com/botpress/botpress/issues/5326)) ([c48769f](https://github.com/botpress/botpress/commit/c48769f))
- **core:** filter /listAvailableUsers on roles ([#5265](https://github.com/botpress/botpress/issues/5265)) ([ef3a531](https://github.com/botpress/botpress/commit/ef3a531))
- **nlu:** nlu cloud configuration ([#5296](https://github.com/botpress/botpress/issues/5296)) ([3930383](https://github.com/botpress/botpress/commit/3930383)), closes [#5246](https://github.com/botpress/botpress/issues/5246) [#5261](https://github.com/botpress/botpress/issues/5261) [#5262](https://github.com/botpress/botpress/issues/5262) [#5327](https://github.com/botpress/botpress/issues/5327)

## [12.24.1](https://github.com/botpress/botpress/compare/v12.24.0...v12.24.1) (2021-08-13)

### Bug Fixes

- **ci_cd:** Modified if on the dockerhub connection ([#5275](https://github.com/botpress/botpress/issues/5275)) ([3789a40](https://github.com/botpress/botpress/commit/3789a40))
- **core:** fix error when creating or importing a bot ([#5295](https://github.com/botpress/botpress/issues/5295)) ([7433244](https://github.com/botpress/botpress/commit/7433244))

### Features

- **hitlnext:** colored handoffs ([#5260](https://github.com/botpress/botpress/issues/5260)) ([de7a173](https://github.com/botpress/botpress/commit/de7a173))

# [12.24.0](https://github.com/botpress/botpress/compare/v12.23.2...v12.24.0) (2021-08-11)

### Bug Fixes

- **messaging:** filter module errors for channels ([#5283](https://github.com/botpress/botpress/issues/5283)) ([45ca7cc](https://github.com/botpress/botpress/commit/45ca7cc))
- **messaging:** fix proxying search params ([#5279](https://github.com/botpress/botpress/issues/5279)) ([9372ccc](https://github.com/botpress/botpress/commit/9372ccc))
- **messaging:** fix webhook verification ([#5278](https://github.com/botpress/botpress/issues/5278)) ([941e832](https://github.com/botpress/botpress/commit/941e832))
- **messaging:** legacy route send ext url in headers ([#5266](https://github.com/botpress/botpress/issues/5266)) ([79bc7ac](https://github.com/botpress/botpress/commit/79bc7ac))
- **messaging:** use headers instead of basic auth ([#5264](https://github.com/botpress/botpress/issues/5264)) ([c64143c](https://github.com/botpress/botpress/commit/c64143c))

### Features

- **channel-web:** add RTL support in webchat ([#5251](https://github.com/botpress/botpress/issues/5251)) ([2a26251](https://github.com/botpress/botpress/commit/2a26251))
- **channel-web:** RTL support for non-text content types ([#5268](https://github.com/botpress/botpress/issues/5268)) ([fb5d673](https://github.com/botpress/botpress/commit/fb5d673))

## [12.23.2](https://github.com/botpress/botpress/compare/v12.22.2...v12.23.2) (2021-08-03)

### Bug Fixes

- **core:** fix disk storage race condition ([#5162](https://github.com/botpress/botpress/issues/5162)) ([86102b3](https://github.com/botpress/botpress/commit/86102b3))
- **teams:** fix receiving quick replies with teams ([#5230](https://github.com/botpress/botpress/issues/5230)) ([acb79a3](https://github.com/botpress/botpress/commit/acb79a3))
- nlu regression testing ([0916cf8](https://github.com/botpress/botpress/commit/0916cf8))

## [12.23.1](https://github.com/botpress/botpress/compare/v12.23.0...v12.23.1) (2021-07-29)

### Bug Fixes

- **channel-telegram:** clean up carousel caption ([#5204](https://github.com/botpress/botpress/issues/5204)) ([25e1924](https://github.com/botpress/botpress/commit/25e1924))
- **channel-web:** fix missing payload of file upload ([#5184](https://github.com/botpress/botpress/issues/5184)) ([00ebee4](https://github.com/botpress/botpress/commit/00ebee4))
- **channel-web:** fix voice audio support ([#5198](https://github.com/botpress/botpress/issues/5198)) ([381204f](https://github.com/botpress/botpress/commit/381204f))
- **channel-web:** prevent message sorting issue ([#5189](https://github.com/botpress/botpress/issues/5189)) ([265edfd](https://github.com/botpress/botpress/commit/265edfd))
- **core:** add action not found error to events ([#5203](https://github.com/botpress/botpress/issues/5203)) ([121b533](https://github.com/botpress/botpress/commit/121b533))
- **core:** log an error if an action isn't found ([#2826](https://github.com/botpress/botpress/issues/2826)) ([#5201](https://github.com/botpress/botpress/issues/5201)) ([17cd4aa](https://github.com/botpress/botpress/commit/17cd4aa))
- **docker:** module builder image ([#5218](https://github.com/botpress/botpress/issues/5218)) ([999d2dd](https://github.com/botpress/botpress/commit/999d2dd))
- **google-speech:** move closest number utils into google-speech code ([#5199](https://github.com/botpress/botpress/issues/5199)) ([2d838c8](https://github.com/botpress/botpress/commit/2d838c8))
- **google-speech:** use studio url for tts audio upload to media storage ([#5197](https://github.com/botpress/botpress/issues/5197)) ([71c41bd](https://github.com/botpress/botpress/commit/71c41bd))
- **nlu:** allow to skip spellcheck with an env variable ([#5192](https://github.com/botpress/botpress/issues/5192)) ([526dcfc](https://github.com/botpress/botpress/commit/526dcfc))
- failing e2e test ([#5196](https://github.com/botpress/botpress/issues/5196)) ([85a5d20](https://github.com/botpress/botpress/commit/85a5d20))

### Features

- **channel-web:** allow to have noBubble message from custom content type ([#5181](https://github.com/botpress/botpress/issues/5181)) ([b4d7f03](https://github.com/botpress/botpress/commit/b4d7f03))
- **core:** Allow creation of the first user via env variables ([#5195](https://github.com/botpress/botpress/issues/5195)) ([813b482](https://github.com/botpress/botpress/commit/813b482))
- **devops:** Dockerhub Added latest, main and feature branch for dockerhub ([#5211](https://github.com/botpress/botpress/issues/5211)) ([452c5c8](https://github.com/botpress/botpress/commit/452c5c8))

# [12.23.0](https://github.com/botpress/botpress/compare/v12.22.2...v12.23.0) (2021-07-13)

### Bug Fixes

- **channel-telegram:** fix markdown rendering in telegram ([#5173](https://github.com/botpress/botpress/issues/5173)) ([4bb4fba](https://github.com/botpress/botpress/commit/4bb4fba)), closes [#5133](https://github.com/botpress/botpress/issues/5133)
- **channel-web:** fix locked composer ([#5147](https://github.com/botpress/botpress/issues/5147)) ([19b2068](https://github.com/botpress/botpress/commit/19b2068))
- **core:** fix missing await in mapping migration ([#5172](https://github.com/botpress/botpress/issues/5172)) ([e0c2d3b](https://github.com/botpress/botpress/commit/e0c2d3b))
- **core:** subflow transitions for timeout flow ([#5160](https://github.com/botpress/botpress/issues/5160)) ([f384f78](https://github.com/botpress/botpress/commit/f384f78))
- **docs:** links & minor kinks ([#5127](https://github.com/botpress/botpress/issues/5127)) ([29cd796](https://github.com/botpress/botpress/commit/29cd796))
- **hitlnext:** UI modification, toast over composer ([#5154](https://github.com/botpress/botpress/issues/5154)) ([9c257c6](https://github.com/botpress/botpress/commit/9c257c6))
- **studio:** Added language warning sign in the bot list ([#5138](https://github.com/botpress/botpress/issues/5138)) ([ab592a1](https://github.com/botpress/botpress/commit/ab592a1))
- **studio:** fix config save ([#5185](https://github.com/botpress/botpress/issues/5185)) ([85cb989](https://github.com/botpress/botpress/commit/85cb989))
- show only messages from the current chat ([#5148](https://github.com/botpress/botpress/issues/5148)) ([229dbaa](https://github.com/botpress/botpress/commit/229dbaa))
- **studio:** fix icon display in the studio and skill ([#5123](https://github.com/botpress/botpress/issues/5123)) ([12c2375](https://github.com/botpress/botpress/commit/12c2375))
- **teams:** send quick_reply for Choice skill ([#5130](https://github.com/botpress/botpress/issues/5130)) ([1c8ede3](https://github.com/botpress/botpress/commit/1c8ede3))

### Features

- **auth:** allow to hide default auth strategy when alternative used ([#5121](https://github.com/botpress/botpress/issues/5121)) ([d5e7f95](https://github.com/botpress/botpress/commit/d5e7f95))
- **builtin:** improve single choice ([#5131](https://github.com/botpress/botpress/issues/5131)) ([14fe5c8](https://github.com/botpress/botpress/commit/14fe5c8))
- **core:** get studio from its own repository ([#5029](https://github.com/botpress/botpress/issues/5029)) ([70a6384](https://github.com/botpress/botpress/commit/70a6384)), closes [#5043](https://github.com/botpress/botpress/issues/5043) [#5063](https://github.com/botpress/botpress/issues/5063)

## [12.22.2](https://github.com/botpress/botpress/compare/v12.22.0...v12.22.2) (2021-06-16)

### Bug Fixes

- **admin:** add missing translation change collaborators role ([#5089](https://github.com/botpress/botpress/issues/5089)) ([a36cf1a](https://github.com/botpress/botpress/commit/a36cf1a))
- **admin:** various fixes ([#5094](https://github.com/botpress/botpress/issues/5094)) ([731536e](https://github.com/botpress/botpress/commit/731536e))
- **core:** fix core migration template import path ([#5087](https://github.com/botpress/botpress/issues/5087)) ([071f8d4](https://github.com/botpress/botpress/commit/071f8d4))
- **core:** fix multiple invalidate ([#5074](https://github.com/botpress/botpress/issues/5074)) ([3af10fc](https://github.com/botpress/botpress/commit/3af10fc))
- **core:** fix send email skill using teams ([#5088](https://github.com/botpress/botpress/issues/5088)) ([ba28e4b](https://github.com/botpress/botpress/commit/ba28e4b))
- **core:** minor fixes for logs and admin ([#5092](https://github.com/botpress/botpress/issues/5092)) ([41b8ca8](https://github.com/botpress/botpress/commit/41b8ca8))
- **core:** use redis scope as channel prefix ([#5079](https://github.com/botpress/botpress/issues/5079)) ([f78ffd8](https://github.com/botpress/botpress/commit/f78ffd8))
- **core:** wrong path for config ([#5081](https://github.com/botpress/botpress/issues/5081)) ([217aed7](https://github.com/botpress/botpress/commit/217aed7))
- **nlu:** handle disabling the NLU module ([#5044](https://github.com/botpress/botpress/issues/5044)) ([f9bd4d6](https://github.com/botpress/botpress/commit/f9bd4d6))
- **nlu:** spellcheck logic is more natural ([#5093](https://github.com/botpress/botpress/issues/5093)) ([4e353b0](https://github.com/botpress/botpress/commit/4e353b0))
- **qna:** do not process event if bot is unmounted ([#5082](https://github.com/botpress/botpress/issues/5082)) ([a4998fe](https://github.com/botpress/botpress/commit/a4998fe))

### Features

- **core:** Config to toggle public converse ([#5102](https://github.com/botpress/botpress/issues/5102)) ([a4f161f](https://github.com/botpress/botpress/commit/a4f161f))
- **nlu:** upgrade NLU version + bring back nlu debug logs ([#5080](https://github.com/botpress/botpress/issues/5080)) ([9911e13](https://github.com/botpress/botpress/commit/9911e13))
- **teams:** add botId to logs ([#5083](https://github.com/botpress/botpress/issues/5083)) ([33ba6de](https://github.com/botpress/botpress/commit/33ba6de))

## [12.22.1](https://github.com/botpress/botpress/compare/v12.22.0...v12.22.1) (2021-06-03)

### Bug Fixes

- **build:** check module-builder image on master only ([#5032](https://github.com/botpress/botpress/issues/5032)) ([bd6d63a](https://github.com/botpress/botpress/commit/bd6d63a))
- **builtin:** default transition on entry nodes for empty bot template ([#4999](https://github.com/botpress/botpress/issues/4999)) ([66e1a7a](https://github.com/botpress/botpress/commit/66e1a7a))
- **core:** fix 'socket hang up' before 20 minutes for bp-push ([#5009](https://github.com/botpress/botpress/issues/5009)) ([9a21cbc](https://github.com/botpress/botpress/commit/9a21cbc))
- **core:** fix bot migration ([#5049](https://github.com/botpress/botpress/issues/5049)) ([8c44e10](https://github.com/botpress/botpress/commit/8c44e10))
- **core:** fix generating diag report with the pro version ([#5062](https://github.com/botpress/botpress/issues/5062)) ([f10f10a](https://github.com/botpress/botpress/commit/f10f10a))
- **core:** fixes to improve flow loading speed ([#5050](https://github.com/botpress/botpress/issues/5050)) ([7c68266](https://github.com/botpress/botpress/commit/7c68266))
- **core:** invalidate module config cache on file change ([#4569](https://github.com/botpress/botpress/issues/4569)) ([3b48294](https://github.com/botpress/botpress/commit/3b48294))
- **core:** jumpTo accepts flow name as argument ([#5000](https://github.com/botpress/botpress/issues/5000)) ([42e17ff](https://github.com/botpress/botpress/commit/42e17ff))
- **core:** telemetry only on mounted bots ([#5052](https://github.com/botpress/botpress/issues/5052)) ([26746a1](https://github.com/botpress/botpress/commit/26746a1))
- **docs:** wrong saml URLs ([#5033](https://github.com/botpress/botpress/issues/5033)) ([a865f3d](https://github.com/botpress/botpress/commit/a865f3d))
- **ndu:** fix blank page in flow editor ([#5028](https://github.com/botpress/botpress/issues/5028)) ([d18f975](https://github.com/botpress/botpress/commit/d18f975))
- **ndu:** fix display of intent is trigger editor ([#5027](https://github.com/botpress/botpress/issues/5027)) ([2033939](https://github.com/botpress/botpress/commit/2033939))
- **nlu:** fix bot delete when nlu unavailable ([#5053](https://github.com/botpress/botpress/issues/5053)) ([8101a0c](https://github.com/botpress/botpress/commit/8101a0c))
- **nlu:** no more nlu token when nlu server is auto started ([#5010](https://github.com/botpress/botpress/issues/5010)) ([2f3d7c5](https://github.com/botpress/botpress/commit/2f3d7c5))
- **studio:** moving multiple nodes ([#5041](https://github.com/botpress/botpress/issues/5041)) ([35e6da7](https://github.com/botpress/botpress/commit/35e6da7))
- **studio:** right sidebar UI flow ([#5046](https://github.com/botpress/botpress/issues/5046)) ([20e58cf](https://github.com/botpress/botpress/commit/20e58cf))
- dockerfile no need to chmod nlu bin ([#5006](https://github.com/botpress/botpress/issues/5006)) ([d9dcfd9](https://github.com/botpress/botpress/commit/d9dcfd9))

### Features

- **builtin:** add support for file content-type ([#5045](https://github.com/botpress/botpress/issues/5045)) ([df57a76](https://github.com/botpress/botpress/commit/df57a76)), closes [#5055](https://github.com/botpress/botpress/issues/5055)
- **studio:** allow copying multiple nodes ([#5026](https://github.com/botpress/botpress/issues/5026)) ([7880e7f](https://github.com/botpress/botpress/commit/7880e7f))

# [12.22.0](https://github.com/botpress/botpress/compare/v12.20.1...v12.22.0) (2021-05-14)

### Bug Fixes

- **builtin:** fix card image subtype ([#4996](https://github.com/botpress/botpress/issues/4996)) ([61ff663](https://github.com/botpress/botpress/commit/61ff663))
- **channel-vonage:** fix storing large files using the module action ([#5004](https://github.com/botpress/botpress/issues/5004)) ([44d1547](https://github.com/botpress/botpress/commit/44d1547))
- **core:** removed empty object in default alerting rules ([#4935](https://github.com/botpress/botpress/issues/4935)) ([ec510b4](https://github.com/botpress/botpress/commit/ec510b4))
- **nlu:** fixes on new election logic ([#4998](https://github.com/botpress/botpress/issues/4998)) ([184735e](https://github.com/botpress/botpress/commit/184735e))
- **nlu:** include language detection and all predict tries in ms ([#4986](https://github.com/botpress/botpress/issues/4986)) ([b97d205](https://github.com/botpress/botpress/commit/b97d205))
- **nlu:** prediction error logging ([#4942](https://github.com/botpress/botpress/issues/4942)) ([761eaeb](https://github.com/botpress/botpress/commit/761eaeb))
- **studio:** right sidebar UI fixes ([#4925](https://github.com/botpress/botpress/issues/4925)) ([e3a6077](https://github.com/botpress/botpress/commit/e3a6077))
- **studio:** visual glitches ([#4924](https://github.com/botpress/botpress/issues/4924)) ([e3e89fd](https://github.com/botpress/botpress/commit/e3e89fd))
- **webchat:** fix file upload ([#4994](https://github.com/botpress/botpress/issues/4994)) ([88c2627](https://github.com/botpress/botpress/commit/88c2627))

### Features

- **admin:** workspace apps ([#4887](https://github.com/botpress/botpress/issues/4887)) ([ede423a](https://github.com/botpress/botpress/commit/ede423a))
- **channel-messenger:** use channel renderers ([#4992](https://github.com/botpress/botpress/issues/4992)) ([e5738d3](https://github.com/botpress/botpress/commit/e5738d3))
- **channel-smooch:** use channel renderers ([#4919](https://github.com/botpress/botpress/issues/4919)) ([339bb9b](https://github.com/botpress/botpress/commit/339bb9b))
- **channel-teams:** use channel renderers ([#4993](https://github.com/botpress/botpress/issues/4993)) ([bb5aa65](https://github.com/botpress/botpress/commit/bb5aa65))
- **channel-vonage:** add channel-vonage ([#4789](https://github.com/botpress/botpress/issues/4789)) ([f17695f](https://github.com/botpress/botpress/commit/f17695f)), closes [#4820](https://github.com/botpress/botpress/issues/4820) [#4819](https://github.com/botpress/botpress/issues/4819) [#4818](https://github.com/botpress/botpress/issues/4818) [#4812](https://github.com/botpress/botpress/issues/4812) [#4815](https://github.com/botpress/botpress/issues/4815) [#4830](https://github.com/botpress/botpress/issues/4830) [#4760](https://github.com/botpress/botpress/issues/4760) [#4686](https://github.com/botpress/botpress/issues/4686) [#4687](https://github.com/botpress/botpress/issues/4687) [#4764](https://github.com/botpress/botpress/issues/4764) [#4684](https://github.com/botpress/botpress/issues/4684) [#4841](https://github.com/botpress/botpress/issues/4841) [#4840](https://github.com/botpress/botpress/issues/4840) [#4839](https://github.com/botpress/botpress/issues/4839) [#4836](https://github.com/botpress/botpress/issues/4836) [#4827](https://github.com/botpress/botpress/issues/4827) [#4781](https://github.com/botpress/botpress/issues/4781) [#4798](https://github.com/botpress/botpress/issues/4798) [#4852](https://github.com/botpress/botpress/issues/4852) [#4856](https://github.com/botpress/botpress/issues/4856)
- **channel-vonage:** add support for file reception ([#4914](https://github.com/botpress/botpress/issues/4914)) ([a0384ce](https://github.com/botpress/botpress/commit/a0384ce))
- **channel-vonage:** add support for WhatsApp Templates ([#4927](https://github.com/botpress/botpress/issues/4927)) ([597c6ca](https://github.com/botpress/botpress/commit/597c6ca))
- **channel-vonage:** use channel renders ([#4929](https://github.com/botpress/botpress/issues/4929)) ([c327210](https://github.com/botpress/botpress/commit/c327210))
- **channel-web:** add support for audio and video display ([#4989](https://github.com/botpress/botpress/issues/4989)) ([6453637](https://github.com/botpress/botpress/commit/6453637))
- **channel-web:** add support for voice messages ([#4995](https://github.com/botpress/botpress/issues/4995)) ([6ed4639](https://github.com/botpress/botpress/commit/6ed4639))
- **core:** allow middlewares to override timeout limit of runtime duration ([#4923](https://github.com/botpress/botpress/issues/4923)) ([43d25ce](https://github.com/botpress/botpress/commit/43d25ce))
- **core:** channel renderers ([#4793](https://github.com/botpress/botpress/issues/4793)) ([8e7fad8](https://github.com/botpress/botpress/commit/8e7fad8)), closes [#4800](https://github.com/botpress/botpress/issues/4800) [#4868](https://github.com/botpress/botpress/issues/4868) [#4871](https://github.com/botpress/botpress/issues/4871)
- **core:** location content type ([#4988](https://github.com/botpress/botpress/issues/4988)) ([dfffc7d](https://github.com/botpress/botpress/commit/dfffc7d))
- **google-speech:** add google speech module ([#4876](https://github.com/botpress/botpress/issues/4876)) ([b53dcb7](https://github.com/botpress/botpress/commit/b53dcb7)), closes [#4820](https://github.com/botpress/botpress/issues/4820) [#4819](https://github.com/botpress/botpress/issues/4819) [#4818](https://github.com/botpress/botpress/issues/4818) [#4812](https://github.com/botpress/botpress/issues/4812) [#4815](https://github.com/botpress/botpress/issues/4815) [#4830](https://github.com/botpress/botpress/issues/4830) [#4760](https://github.com/botpress/botpress/issues/4760) [#4686](https://github.com/botpress/botpress/issues/4686) [#4687](https://github.com/botpress/botpress/issues/4687) [#4764](https://github.com/botpress/botpress/issues/4764) [#4684](https://github.com/botpress/botpress/issues/4684) [#4841](https://github.com/botpress/botpress/issues/4841) [#4840](https://github.com/botpress/botpress/issues/4840) [#4839](https://github.com/botpress/botpress/issues/4839) [#4836](https://github.com/botpress/botpress/issues/4836) [#4827](https://github.com/botpress/botpress/issues/4827) [#4781](https://github.com/botpress/botpress/issues/4781) [#4798](https://github.com/botpress/botpress/issues/4798) [#4852](https://github.com/botpress/botpress/issues/4852) [#4856](https://github.com/botpress/botpress/issues/4856)
- **hitlnext:** display custom component in live chat ([#5001](https://github.com/botpress/botpress/issues/5001)) ([8c11fc0](https://github.com/botpress/botpress/commit/8c11fc0))
- **module-builder:** add Dockerfile [#4790](https://github.com/botpress/botpress/issues/4790) ([#4791](https://github.com/botpress/botpress/issues/4791)) ([797e23b](https://github.com/botpress/botpress/commit/797e23b))

## [12.21.1](https://github.com/botpress/botpress/compare/v12.20.1...v12.21.1) (2021-04-30)

### Bug Fixes

- **channel-smooch:** wrong incoming payload ([#4915])(https://github.com/botpress/botpress/pull/4915)
- **channel-vonage:** fix sending image content-elements ([#4901](https://github.com/botpress/botpress/issues/4901)) ([1afc0fa](https://github.com/botpress/botpress/commit/1afc0fa))
- **channel-vonage:** make sure carousel does not fire more than 1 req/s ([#4893](https://github.com/botpress/botpress/issues/4893)) ([a721eff](https://github.com/botpress/botpress/commit/a721eff))
- **channel-web:** fix conversationId validation bypass ([#4902](https://github.com/botpress/botpress/issues/4902)) ([a27f22c](https://github.com/botpress/botpress/commit/a27f22c))
- **converse:** wait for outgoing events before sending response ([#4855](https://github.com/botpress/botpress/issues/4855)) ([7a3b732](https://github.com/botpress/botpress/commit/7a3b732))
- **core:** fix botconfig migration ([#4904](https://github.com/botpress/botpress/issues/4904)) ([17962d0](https://github.com/botpress/botpress/commit/17962d0))
- **core:** various fixes for bp-push ([#4908](https://github.com/botpress/botpress/issues/4908)) ([67f15d2](https://github.com/botpress/botpress/commit/67f15d2))
- **docs:** wrong BP_MODULE_NLU_DUCKLINGURL example ([#4884](https://github.com/botpress/botpress/issues/4884)) ([cf11716](https://github.com/botpress/botpress/commit/cf11716))
- **studio:** fix node properties display for NDU bots ([#4906](https://github.com/botpress/botpress/issues/4906)) ([1858925](https://github.com/botpress/botpress/commit/1858925))

### Features

- **admin:** move realtime logs to admin ([#4903](https://github.com/botpress/botpress/issues/4903)) ([e51c38d](https://github.com/botpress/botpress/commit/e51c38d))
- **core:** add env variable to support pg schema ([#4888](https://github.com/botpress/botpress/issues/4888)) ([40ab4d0](https://github.com/botpress/botpress/commit/40ab4d0))

# [12.21.0](https://github.com/botpress/botpress/compare/v12.20.1...v12.21.0) (2021-04-23)

### Bug Fixes

- **code:** fix for CVE-2020-7743 ([#4833](https://github.com/botpress/botpress/issues/4833)) ([543d830](https://github.com/botpress/botpress/commit/543d830))
- **docs:** remove warning about Custom Modules ([#4882](https://github.com/botpress/botpress/issues/4882)) ([c4445c3](https://github.com/botpress/botpress/commit/c4445c3))

### Features

- **channel-vonage:** add channel-vonage ([#4789](https://github.com/botpress/botpress/issues/4789)) ([f17695f](https://github.com/botpress/botpress/commit/f17695f))
- **core:** conversation attributes ([#4815](https://github.com/botpress/botpress/issues/4815)) ([256fcf4](https://github.com/botpress/botpress/commit/256fcf4))
- **core:** remove redundant read/writes to flow files ([#4715](https://github.com/botpress/botpress/issues/4715)) ([36468bc](https://github.com/botpress/botpress/commit/36468bc))
- **studio:** add support for audio and video content-types ([#4816](https://github.com/botpress/botpress/issues/4816)) ([95ba80d](https://github.com/botpress/botpress/commit/95ba80d)), closes [#4820](https://github.com/botpress/botpress/issues/4820)

## [12.20.2](https://github.com/botpress/botpress/compare/v12.20.1...v12.20.2) (2021-04-15)

### Bug Fixes

- **admin:** incorrect route for module upload ([#4818](https://github.com/botpress/botpress/issues/4818)) ([823d965](https://github.com/botpress/botpress/commit/823d965))
- **channel-web:** don't list convos with no events ([#4764](https://github.com/botpress/botpress/issues/4764)) ([18206fc](https://github.com/botpress/botpress/commit/18206fc))
- **core:** database migration path ([#4794](https://github.com/botpress/botpress/issues/4794)) ([3201b9b](https://github.com/botpress/botpress/commit/3201b9b))
- **core:** use relative file path for media files ([#4830](https://github.com/botpress/botpress/issues/4830)) ([3a74c2e](https://github.com/botpress/botpress/commit/3a74c2e))
- **hitlnext:** send webSessionId when assigning handoff ([#4836](https://github.com/botpress/botpress/issues/4836)) ([7e9f4c9](https://github.com/botpress/botpress/commit/7e9f4c9))
- **nlu:** Default to global context when no context matched ([#4814](https://github.com/botpress/botpress/issues/4814)) ([493a1a8](https://github.com/botpress/botpress/commit/493a1a8))
- **nlu:** update pre-trained models path ([#4819](https://github.com/botpress/botpress/issues/4819)) ([4fef3bd](https://github.com/botpress/botpress/commit/4fef3bd))
- **studio:** allow to scroll content of action overlay popover ([#4804](https://github.com/botpress/botpress/issues/4804)) ([8a6e4b0](https://github.com/botpress/botpress/commit/8a6e4b0))
- **studio:** remove its lite dependency with modules ([#4760](https://github.com/botpress/botpress/issues/4760)) ([ef02169](https://github.com/botpress/botpress/commit/ef02169))

### Features

- **channel-smooch:** add content support ([#4827](https://github.com/botpress/botpress/issues/4827)) ([0118ec4](https://github.com/botpress/botpress/commit/0118ec4))

## [12.20.1](https://github.com/botpress/botpress/compare/v12.19.0...v12.20.1) (2021-04-01)

### Bug Fixes

- **core:** images not displaying ([#4795](https://github.com/botpress/botpress/issues/4795)) ([cb5c5be](https://github.com/botpress/botpress/commit/cb5c5be))
- **nlu:** fix memory leak in nlu module ([#4787](https://github.com/botpress/botpress/issues/4787)) ([938529f](https://github.com/botpress/botpress/commit/938529f))

### Features

- **core:** mapping ([#4776](https://github.com/botpress/botpress/issues/4776)) ([563c70d](https://github.com/botpress/botpress/commit/563c70d))

# [12.20.0](https://github.com/botpress/botpress/compare/v12.19.0...v12.20.0) (2021-03-31)

### Bug Fixes

- **admin:** add missing en, es and fr translations in UI admin ([e4a03a4](https://github.com/botpress/botpress/commit/e4a03a4))
- **admin:** check license limits exist before counting nodes ([#4770](https://github.com/botpress/botpress/issues/4770)) ([83d2203](https://github.com/botpress/botpress/commit/83d2203))
- **admin:** fix Promisse issue ([#4749](https://github.com/botpress/botpress/issues/4749)) ([bff4bb7](https://github.com/botpress/botpress/commit/bff4bb7))
- **basic-skills:** slot skill distinct slot/intent issue ([#4718](https://github.com/botpress/botpress/issues/4718)) ([b657aa7](https://github.com/botpress/botpress/commit/b657aa7))
- **core:** allow to redefine the state.workflow accessor ([#4758](https://github.com/botpress/botpress/issues/4758)) ([64c0cf7](https://github.com/botpress/botpress/commit/64c0cf7))
- **core:** bad path with pro enabled ([#4739](https://github.com/botpress/botpress/issues/4739)) ([b8b72d4](https://github.com/botpress/botpress/commit/b8b72d4))
- **core:** display url when error while mounting ([#4751](https://github.com/botpress/botpress/issues/4751)) ([d792d33](https://github.com/botpress/botpress/commit/d792d33))
- **core:** update pro ([#4734](https://github.com/botpress/botpress/issues/4734)) ([87f5d1c](https://github.com/botpress/botpress/commit/87f5d1c))
- **git:** fix workflow rule ([#4761](https://github.com/botpress/botpress/issues/4761)) ([8f689d3](https://github.com/botpress/botpress/commit/8f689d3))
- **misunderstood:** fix side list scroll ([#4652](https://github.com/botpress/botpress/issues/4652)) ([1d81b62](https://github.com/botpress/botpress/commit/1d81b62))
- **nlu:** default limit model cache size by max memory space ([#4775](https://github.com/botpress/botpress/issues/4775)) ([dda2f62](https://github.com/botpress/botpress/commit/dda2f62))
- **nlu:** fix debug and progress logging during training ([#4748](https://github.com/botpress/botpress/issues/4748)) ([71afb45](https://github.com/botpress/botpress/commit/71afb45))
- **nlu:** model cache size defaults to infinity ([#4753](https://github.com/botpress/botpress/issues/4753)) ([6adcb48](https://github.com/botpress/botpress/commit/6adcb48))
- **nlu:** revert default engine cache size to 850mb ([#4782](https://github.com/botpress/botpress/issues/4782)) ([57e173c](https://github.com/botpress/botpress/commit/57e173c))
- **nlu:** rm git submodules again ([#4773](https://github.com/botpress/botpress/issues/4773)) ([f4016b2](https://github.com/botpress/botpress/commit/f4016b2))
- **studio:** check subflow exists before adding its nodes usage ([#4759](https://github.com/botpress/botpress/issues/4759)) ([b24da29](https://github.com/botpress/botpress/commit/b24da29))
- **studio:** fix build in translations files ([df7bbc9](https://github.com/botpress/botpress/commit/df7bbc9))
- **studio:** fix reboot and ping routes ([#4750](https://github.com/botpress/botpress/issues/4750)) ([595b8b0](https://github.com/botpress/botpress/commit/595b8b0))
- **studio:** fixed e2e tests ([a091510](https://github.com/botpress/botpress/commit/a091510))
- **studio:** translations ([#4658](https://github.com/botpress/botpress/issues/4658)) ([0198ef5](https://github.com/botpress/botpress/commit/0198ef5))
- make cover chat window picture responsive ([#4641](https://github.com/botpress/botpress/issues/4641)) ([9b82d46](https://github.com/botpress/botpress/commit/9b82d46))

### Features

- **basic-skills:** allow choosing the name the variable of choice skill ([#4638](https://github.com/botpress/botpress/issues/4638)) ([0170275](https://github.com/botpress/botpress/commit/0170275))
- **channel-web:** support native web speech api ([#4615](https://github.com/botpress/botpress/issues/4615)) ([c5542b0](https://github.com/botpress/botpress/commit/c5542b0))
- **hitl2:** voice composer for agent ([#4626](https://github.com/botpress/botpress/issues/4626)) ([1ea4629](https://github.com/botpress/botpress/commit/1ea4629))
- **misunderstood:** group duplicates ([#4616](https://github.com/botpress/botpress/issues/4616)) ([c507042](https://github.com/botpress/botpress/commit/c507042)), closes [#4629](https://github.com/botpress/botpress/issues/4629) [#4650](https://github.com/botpress/botpress/issues/4650)
- **nlu:** deprecate legacy election ([#4745](https://github.com/botpress/botpress/issues/4745)) ([f3bb6e6](https://github.com/botpress/botpress/commit/f3bb6e6))
- **nlu:** Queue trainings on bot mount ([#4736](https://github.com/botpress/botpress/issues/4736)) ([2d95e70](https://github.com/botpress/botpress/commit/2d95e70)), closes [#4579](https://github.com/botpress/botpress/issues/4579) [#4586](https://github.com/botpress/botpress/issues/4586) [#4583](https://github.com/botpress/botpress/issues/4583) [#4735](https://github.com/botpress/botpress/issues/4735) [#4698](https://github.com/botpress/botpress/issues/4698) [#4740](https://github.com/botpress/botpress/issues/4740) [#4741](https://github.com/botpress/botpress/issues/4741) [#4757](https://github.com/botpress/botpress/issues/4757)
- **qna:** directly convert qna to intent from ui ([#4625](https://github.com/botpress/botpress/issues/4625)) ([92129d9](https://github.com/botpress/botpress/commit/92129d9))
- **studio:** allow specifying a node in subflow transition ([#4612](https://github.com/botpress/botpress/issues/4612)) ([7ad934f](https://github.com/botpress/botpress/commit/7ad934f))
- **studio:** default empty transition on entry nodes ([#4619](https://github.com/botpress/botpress/issues/4619)) ([a978ac0](https://github.com/botpress/botpress/commit/a978ac0))
- **studio:** open properties and focus names of new nodes ([#4633](https://github.com/botpress/botpress/issues/4633)) ([4f91289](https://github.com/botpress/botpress/commit/4f91289))
- **unsupervised:** unsupervised qna module ([#4637](https://github.com/botpress/botpress/issues/4637)) ([f13736b](https://github.com/botpress/botpress/commit/f13736b))

## [12.19.2](https://github.com/botpress/botpress/compare/v12.19.0...v12.19.2) (2021-03-22)

### Bug Fixes

- **core:** auth methods with cookies ([#4723](https://github.com/botpress/botpress/issues/4723)) ([39fc418](https://github.com/botpress/botpress/commit/39fc418))
- **core:** flow service caching on update ([#4731](https://github.com/botpress/botpress/issues/4731)) ([09a1787](https://github.com/botpress/botpress/commit/09a1787))
- **webchat:** typo in createConversation ([#4725](https://github.com/botpress/botpress/issues/4725)) ([fabe1fc](https://github.com/botpress/botpress/commit/fabe1fc))

## [12.19.1](https://github.com/botpress/botpress/compare/v12.19.0...v12.19.1) (2021-03-19)

### Bug Fixes

- **analytics:** fix percentages values ([#4717](https://github.com/botpress/botpress/issues/4717)) ([0b4fa63](https://github.com/botpress/botpress/commit/0b4fa63))
- **analytics:** fix react errors ([#4622](https://github.com/botpress/botpress/issues/4622)) ([73db97e](https://github.com/botpress/botpress/commit/73db97e))
- **analytics:** support for postgres ([#4711](https://github.com/botpress/botpress/issues/4711)) ([6ff7b04](https://github.com/botpress/botpress/commit/6ff7b04))
- **channel-web:** i18n initialization precedence ([#4713](https://github.com/botpress/botpress/issues/4713)) ([e54979e](https://github.com/botpress/botpress/commit/e54979e))
- **channel-web:** message duplication on slow internet ([#4714](https://github.com/botpress/botpress/issues/4714)) ([764537c](https://github.com/botpress/botpress/commit/764537c))
- **core:** change server target from ES6 to ES2019 ([#4703](https://github.com/botpress/botpress/issues/4703)) ([34505d4](https://github.com/botpress/botpress/commit/34505d4))
- **core:** fix bp pull/push ([#4705](https://github.com/botpress/botpress/issues/4705)) ([b933c7c](https://github.com/botpress/botpress/commit/b933c7c))
- **core:** nlu and lang server wrong import path ([#4704](https://github.com/botpress/botpress/issues/4704)) ([00c80d8](https://github.com/botpress/botpress/commit/00c80d8))
- **docker:** fix vulnerability ([#4691](https://github.com/botpress/botpress/issues/4691)) ([b9d3dbe](https://github.com/botpress/botpress/commit/b9d3dbe))
- **webchat:** browser error on IE11 ([#4702](https://github.com/botpress/botpress/issues/4702)) ([dcab2a5](https://github.com/botpress/botpress/commit/dcab2a5))

# [12.19.0](https://github.com/botpress/botpress/compare/v12.18.2...v12.19.0) (2021-03-15)

### Bug Fixes

- **analytics:** Overlapped text in graph & active users ([#4623](https://github.com/botpress/botpress/issues/4623)) ([1ddbae0](https://github.com/botpress/botpress/commit/1ddbae0))
- **core:** auth on ldap ([#4662](https://github.com/botpress/botpress/issues/4662)) ([cd2dfb6](https://github.com/botpress/botpress/commit/cd2dfb6))
- **hitl2:** hidden reply box on livechat render ([#4627](https://github.com/botpress/botpress/issues/4627)) ([73470a8](https://github.com/botpress/botpress/commit/73470a8))
- **hitl2:** scrollable HandoffList ([#4624](https://github.com/botpress/botpress/issues/4624)) ([31f4bc7](https://github.com/botpress/botpress/commit/31f4bc7))
- **migrations:** proper migration for tokenVersion ([#4690](https://github.com/botpress/botpress/issues/4690)) ([adf7e75](https://github.com/botpress/botpress/commit/adf7e75))
- **misunderstood:** train all modified languages ([#4671](https://github.com/botpress/botpress/issues/4671)) ([f0894a9](https://github.com/botpress/botpress/commit/f0894a9))
- **nlu:** translate system entities ([#4617](https://github.com/botpress/botpress/issues/4617)) ([aaabd6a](https://github.com/botpress/botpress/commit/aaabd6a))

### Features

- **core:** messaging api ([#4340](https://github.com/botpress/botpress/issues/4340)) ([6790ea7](https://github.com/botpress/botpress/commit/6790ea7))
- **core:** render service ([#4467](https://github.com/botpress/botpress/issues/4467)) ([1a6e953](https://github.com/botpress/botpress/commit/1a6e953))
- **misunderstood:** delete done and ignored ([#4609](https://github.com/botpress/botpress/issues/4609)) ([7576926](https://github.com/botpress/botpress/commit/7576926))
- **qna:** enter add new / Ctrl-entrer go to line ([#4621](https://github.com/botpress/botpress/issues/4621)) ([ff469e2](https://github.com/botpress/botpress/commit/ff469e2))

## [12.18.2](https://github.com/botpress/botpress/compare/v12.18.1...v12.18.2) (2021-03-05)

### Bug Fixes

- **core:** fix auth saml/oauth ([#4594](https://github.com/botpress/botpress/issues/4594)) ([09c7324](https://github.com/botpress/botpress/commit/09c7324))
- **core:** point pro on master ([#4595](https://github.com/botpress/botpress/issues/4595)) ([19ffc7f](https://github.com/botpress/botpress/commit/19ffc7f))
- **hitl2:** fixed agent rules ([dd91e69](https://github.com/botpress/botpress/commit/dd91e69))
- **hitl2:** use new chan-web api ([#4596](https://github.com/botpress/botpress/issues/4596)) ([66949d1](https://github.com/botpress/botpress/commit/66949d1))

## [12.18.1](https://github.com/botpress/botpress/compare/v12.18.0...v12.18.1) (2021-03-05)

### Bug Fixes

- **channel-web:** refactor of the webchat API ([#4578](https://github.com/botpress/botpress/issues/4578)) ([e9e9cad](https://github.com/botpress/botpress/commit/e9e9cad))
- **channel-web:** unlock composer on conversation/session reset ([#4580](https://github.com/botpress/botpress/issues/4580)) ([430ef05](https://github.com/botpress/botpress/commit/430ef05))
- **core:** changed dialog_sessions PK column size ([#4555](https://github.com/botpress/botpress/issues/4555)) ([cc28625](https://github.com/botpress/botpress/commit/cc28625))
- **core:** prevent editor to read archive and logs ([#4584](https://github.com/botpress/botpress/issues/4584)) ([6a222f8](https://github.com/botpress/botpress/commit/6a222f8))
- **core,studio,admin:** bot has no language ([#4562](https://github.com/botpress/botpress/issues/4562)) ([7329afb](https://github.com/botpress/botpress/commit/7329afb))
- **hitl2:** fixed agent rules ([#4570](https://github.com/botpress/botpress/issues/4570)) ([be47867](https://github.com/botpress/botpress/commit/be47867))
- **hitl2:** fixed infinite loading of agent live chat ([#4550](https://github.com/botpress/botpress/issues/4550))
- **mig:** ensure strategy table exist before alter ([#4574](https://github.com/botpress/botpress/issues/4574)) ([2187ddc](https://github.com/botpress/botpress/commit/2187ddc))
- **nlu:** intent clf picks exact match over svm ([#4576](https://github.com/botpress/botpress/issues/4576)) ([dfc79db](https://github.com/botpress/botpress/commit/dfc79db))
- **nlu:** minor fixes to new recognizer ([#4566](https://github.com/botpress/botpress/issues/4566)) ([0e95e9d](https://github.com/botpress/botpress/commit/0e95e9d))
- **nlu:** rbac on training ([#4568](https://github.com/botpress/botpress/issues/4568)) ([033e1b0](https://github.com/botpress/botpress/commit/033e1b0))
- **nlu-core:** race condition on import ml toolkit ([#4564](https://github.com/botpress/botpress/issues/4564)) ([8cab437](https://github.com/botpress/botpress/commit/8cab437))
- **studio:** show turns instead of value ([#4577](https://github.com/botpress/botpress/issues/4577)) ([6a14dbd](https://github.com/botpress/botpress/commit/6a14dbd))
- **telemetry:** fix infinite loop when telemetry server is out of reach ([#4559](https://github.com/botpress/botpress/issues/4559))

### Features

- **core:** better migration management ([#4530](https://github.com/botpress/botpress/issues/4530)) ([30ca8f2](https://github.com/botpress/botpress/commit/30ca8f2))
- **core:** storage of jwt token in cookies ([#4554](https://github.com/botpress/botpress/issues/4554)) ([acf31a2](https://github.com/botpress/botpress/commit/acf31a2))
- **nlu:** add support for MS Recognizer text ([#4540](https://github.com/botpress/botpress/issues/4540)) ([1162558](https://github.com/botpress/botpress/commit/1162558))

# [12.18.0](https://github.com/botpress/botpress/compare/v12.14.1...v12.18.0) (2021-02-26)

### Bug Fixes

- **nlu:** check ram usage ([#4321](https://github.com/botpress/botpress/issues/4321)) ([4d1a202](https://github.com/botpress/botpress/commit/4d1a202))

### Features

- **basic-skills:** Add dropdown option to single choice ([#4492](https://github.com/botpress/botpress/issues/4492)) ([a96787a](https://github.com/botpress/botpress/commit/a96787a))
- **channel-web:** allow to disable notification sound ([#4535](https://github.com/botpress/botpress/issues/4535)) ([c759dc3](https://github.com/botpress/botpress/commit/c759dc3))
- **code-editor:** add tab support to manage multiple files ([#4416](https://github.com/botpress/botpress/issues/4416)) ([9a53f86](https://github.com/botpress/botpress/commit/9a53f86))
- **core:** improve security for tokens ([#4457](https://github.com/botpress/botpress/issues/4457)) ([4234aea](https://github.com/botpress/botpress/commit/4234aea))
- **libraries:** shared libraries ([#4238](https://github.com/botpress/botpress/issues/4238)) ([b16fd36](https://github.com/botpress/botpress/commit/b16fd36))

## [12.17.2](https://github.com/botpress/botpress/compare/v12.14.1...v12.17.2) (2021-02-18)

### Bug Fixes

- **api:** added missing async mw ([#4524](https://github.com/botpress/botpress/issues/4524)) ([7eb44d6](https://github.com/botpress/botpress/commit/7eb44d6))
- **core:** changed details column to text ([#4513](https://github.com/botpress/botpress/issues/4513)) ([805092c](https://github.com/botpress/botpress/commit/805092c))
- **core:** conflict between dialog sessions contexts on update ([#4493](https://github.com/botpress/botpress/issues/4493)) ([aa1328b](https://github.com/botpress/botpress/commit/aa1328b))
- **core:** make sure column botId exists before doing migration ([#4526](https://github.com/botpress/botpress/issues/4526)) ([192d661](https://github.com/botpress/botpress/commit/192d661))
- **core:** make sure migrations can be run multiple times ([#4531](https://github.com/botpress/botpress/issues/4531)) ([68679c6](https://github.com/botpress/botpress/commit/68679c6))
- **hitlnext:** remove agent cache warmup ([#4527](https://github.com/botpress/botpress/issues/4527)) ([2d81241](https://github.com/botpress/botpress/commit/2d81241))
- **pro:** Azure OAuth2 openID fix ([37475f0](https://github.com/botpress/botpress/commit/37475f0))
- **studio:** update flow on link deletion ([#4502](https://github.com/botpress/botpress/issues/4502)) ([ada8a59](https://github.com/botpress/botpress/commit/ada8a59))
- **webchat:** cleanup and fixed api ([#4523](https://github.com/botpress/botpress/issues/4523)) ([aedf08b](https://github.com/botpress/botpress/commit/aedf08b))

### Features

- **channel-teams:** add support for proactive messages ([#4466](https://github.com/botpress/botpress/issues/4466)) ([1966aba](https://github.com/botpress/botpress/commit/1966aba))
- **qna:** default text enables markdown ([#4477](https://github.com/botpress/botpress/issues/4477)) ([33ecc63](https://github.com/botpress/botpress/commit/33ecc63))
- **studio:** default empty transition on new nodes ([#4478](https://github.com/botpress/botpress/issues/4478)) ([82bc1f9](https://github.com/botpress/botpress/commit/82bc1f9))

## [12.17.1](https://github.com/botpress/botpress/compare/v12.14.1...v12.17.1) (2021-02-09)

### Bug Fixes

- **admin:** hide token by default ([#4456](https://github.com/botpress/botpress/issues/4456)) ([ea27d74](https://github.com/botpress/botpress/commit/ea27d74))
- **admin:** update pipeline configs on props change ([#4481](https://github.com/botpress/botpress/issues/4481)) ([5eedb23](https://github.com/botpress/botpress/commit/5eedb23))
- **core:** delete all expired sessions ([#4454](https://github.com/botpress/botpress/issues/4454)) ([1d85565](https://github.com/botpress/botpress/commit/1d85565))
- **core:** save every content elements to file ([#4458](https://github.com/botpress/botpress/issues/4458)) ([39cefa1](https://github.com/botpress/botpress/commit/39cefa1))
- **docs:** Add new oauth2 tutorials to sidebar ([#4491](https://github.com/botpress/botpress/issues/4491)) ([3607676](https://github.com/botpress/botpress/commit/3607676))
- **misunderstood:** emulator overlapping misunderstood buttons ([#4473](https://github.com/botpress/botpress/issues/4473)) ([59ecfd0](https://github.com/botpress/botpress/commit/59ecfd0))
- **nlu:** bring back debugging during training ([#4479](https://github.com/botpress/botpress/issues/4479)) ([8d082be](https://github.com/botpress/botpress/commit/8d082be))
- **nlu:** handle unexpected process exit ([#4488](https://github.com/botpress/botpress/issues/4488)) ([bc02691](https://github.com/botpress/botpress/commit/bc02691))
- **studio:** emulator push content to the left when open ([#4487](https://github.com/botpress/botpress/issues/4487)) ([72cd3e3](https://github.com/botpress/botpress/commit/72cd3e3))

# [12.17.0](https://github.com/botpress/botpress/compare/v12.14.1...v12.17.0) (2021-01-29)

### Bug Fixes

- **hitl2:** allow multilang transfer/assign messages ([#4428](https://github.com/botpress/botpress/issues/4428)) ([f5ff84a](https://github.com/botpress/botpress/commit/f5ff84a))
- **hitl2:** fetchShortcuts being called infinitely ([#4431](https://github.com/botpress/botpress/issues/4431)) ([e780e9d](https://github.com/botpress/botpress/commit/e780e9d))
- **hitl2:** properly show username when set ([#4432](https://github.com/botpress/botpress/issues/4432)) ([65c4b47](https://github.com/botpress/botpress/commit/65c4b47))
- **hitl2:** set correct agent attributes ([#4450](https://github.com/botpress/botpress/issues/4450)) ([2345ae9](https://github.com/botpress/botpress/commit/2345ae9))
- **hitlnext:** incorrect bootstrap sequence ([#4407](https://github.com/botpress/botpress/issues/4407)) ([11b611f](https://github.com/botpress/botpress/commit/11b611f))
- **misunderstood:** display convo on date range change ([#4424](https://github.com/botpress/botpress/issues/4424)) ([92cb8bb](https://github.com/botpress/botpress/commit/92cb8bb))
- **misunderstood:** hide reset button on done list ([#4423](https://github.com/botpress/botpress/issues/4423)) ([da35caa](https://github.com/botpress/botpress/commit/da35caa))
- **misunderstood:** remove listener on module unmount ([#4425](https://github.com/botpress/botpress/issues/4425)) ([81cc1da](https://github.com/botpress/botpress/commit/81cc1da))
- **webchat:** last heard on not updated correctly ([#4448](https://github.com/botpress/botpress/issues/4448)) ([15de959](https://github.com/botpress/botpress/commit/15de959))

### Features

- **admin:** added the needs training warning in the pipeline view ([#4419](https://github.com/botpress/botpress/issues/4419)) ([8be7e60](https://github.com/botpress/botpress/commit/8be7e60))
- **admin:** allow user to set profile picture ([#4417](https://github.com/botpress/botpress/issues/4417)) ([14481c9](https://github.com/botpress/botpress/commit/14481c9))
- **core:** make global media storage available ([#4405](https://github.com/botpress/botpress/issues/4405)) ([9783d82](https://github.com/botpress/botpress/commit/9783d82))

## [12.16.3](https://github.com/botpress/botpress/compare/v12.14.1...v12.16.3) (2021-01-22)

### Bug Fixes

- **broadcast:** set proper timezone and take botId into account ([#4388](https://github.com/botpress/botpress/issues/4388)) ([e97ff44](https://github.com/botpress/botpress/commit/e97ff44))
- **builtin:** ResetSession - Dont remove workflows ([#4365](https://github.com/botpress/botpress/issues/4365)) ([0509ac8](https://github.com/botpress/botpress/commit/0509ac8))
- **channel-messenger:** add page id as event thread id ([#4396](https://github.com/botpress/botpress/issues/4396)) ([b4b128c](https://github.com/botpress/botpress/commit/b4b128c))
- **channel-messenger:** added config to disable api actions ([#4376](https://github.com/botpress/botpress/issues/4376)) ([d5c1ea2](https://github.com/botpress/botpress/commit/d5c1ea2))
- **channel-web:** delete conversation button wrong action ([#4367](https://github.com/botpress/botpress/issues/4367)) ([f2f2dbe](https://github.com/botpress/botpress/commit/f2f2dbe))
- **channel-web:** remove custom action on component unmount ([#4368](https://github.com/botpress/botpress/issues/4368)) ([d1c4b28](https://github.com/botpress/botpress/commit/d1c4b28))
- **channel-web:** wrong intl id ([#4369](https://github.com/botpress/botpress/issues/4369)) ([556f4e8](https://github.com/botpress/botpress/commit/556f4e8))
- **core:** conflict between dialog_sessions ids ([#4394](https://github.com/botpress/botpress/issues/4394)) ([262ab08](https://github.com/botpress/botpress/commit/262ab08))
- **core:** conflict between session ids ([#4375](https://github.com/botpress/botpress/issues/4375)) ([0824eb9](https://github.com/botpress/botpress/commit/0824eb9))
- **core:** use gzip compression for responses ([#4385](https://github.com/botpress/botpress/issues/4385)) ([a4677ec](https://github.com/botpress/botpress/commit/a4677ec))
- **core:** wrong import path ([#4363](https://github.com/botpress/botpress/issues/4363)) ([ae88195](https://github.com/botpress/botpress/commit/ae88195))
- **hitl2:** stringify tags with postgresql ([#4391](https://github.com/botpress/botpress/issues/4391)) ([78e215c](https://github.com/botpress/botpress/commit/78e215c))
- **nlu:** warn of duplication on synonym removal ([#4387](https://github.com/botpress/botpress/issues/4387)) ([09da1ec](https://github.com/botpress/botpress/commit/09da1ec))

### Features

- **qna:** display count when expanding ([#4364](https://github.com/botpress/botpress/issues/4364)) ([b2f13de](https://github.com/botpress/botpress/commit/b2f13de))
- **studio:** enable multi-point connectors ([#4386](https://github.com/botpress/botpress/issues/4386)) ([f711c9b](https://github.com/botpress/botpress/commit/f711c9b))

## [12.16.2](https://github.com/botpress/botpress/compare/v12.14.1...v12.16.2) (2021-01-12)

### Bug Fixes

- **channel-web:** disable conversation deletion by default ([#4357](https://github.com/botpress/botpress/issues/4357)) ([da9434d](https://github.com/botpress/botpress/commit/da9434d))
- **core:** migrate srv_migrations details to text ([#4354](https://github.com/botpress/botpress/issues/4354)) ([8ebb27c](https://github.com/botpress/botpress/commit/8ebb27c))
- **studio:** single choice content type usage points to proper node ([#4355](https://github.com/botpress/botpress/issues/4355)) ([a9d5f64](https://github.com/botpress/botpress/commit/a9d5f64))

## [12.16.1](https://github.com/botpress/botpress/compare/v12.14.1...v12.16.1) (2021-01-11)

### Bug Fixes

- **misunderstood:** proper constraint migration ([#4351](https://github.com/botpress/botpress/issues/4351)) ([acf046a](https://github.com/botpress/botpress/commit/acf046a))
- **qna:** contexts filtering list not being refreshed ([#4350](https://github.com/botpress/botpress/commit/33cc0d8b7a232027ab6f2ef714602bdb45245a26))

# [12.16.0](https://github.com/botpress/botpress/compare/v12.14.1...v12.16.0) (2021-01-08)

### Bug Fixes

- **channel-web:** display spinner when webchat is loading ([#4342](https://github.com/botpress/botpress/issues/4342)) ([4f4bbc3](https://github.com/botpress/botpress/commit/4f4bbc3))
- **channel-web:** missing message border ([#4348](https://github.com/botpress/botpress/issues/4348)) ([9931698](https://github.com/botpress/botpress/commit/9931698))
- **core:** api.rest example ([#4339](https://github.com/botpress/botpress/issues/4339)) ([5f8d189](https://github.com/botpress/botpress/commit/5f8d189))
- **hitl2:** missing tags column ([#4345](https://github.com/botpress/botpress/issues/4345)) ([1bad531](https://github.com/botpress/botpress/commit/1bad531))
- **misunderstood:** moved migration ([#4349](https://github.com/botpress/botpress/issues/4349)) ([08a35f2](https://github.com/botpress/botpress/commit/08a35f2))
- **nlu:** no more weird debounce that override other intents ([#4317](https://github.com/botpress/botpress/issues/4317)) ([632c6ac](https://github.com/botpress/botpress/commit/632c6ac))

### Features

- channel twilio ([#4263](https://github.com/botpress/botpress/issues/4263)) ([8e26207](https://github.com/botpress/botpress/commit/8e26207)), closes [#4314](https://github.com/botpress/botpress/issues/4314) [#4320](https://github.com/botpress/botpress/issues/4320)
- **qna:** add sorting of contexts list ([#4328](https://github.com/botpress/botpress/pull/4328))
- **channel-web:** delete conversation ([#4289](https://github.com/botpress/botpress/issues/4289)) ([742e28e](https://github.com/botpress/botpress/commit/742e28e)), closes [#4303](https://github.com/botpress/botpress/issues/4303)
- **code-editor:** add sorting of code editor files list ([#4338](https://github.com/botpress/botpress/issues/4338)) ([bd40eed](https://github.com/botpress/botpress/commit/bd40eed))
- **hitl2:** delete conversation button ([#4288](https://github.com/botpress/botpress/issues/4288)) ([65e7d66](https://github.com/botpress/botpress/commit/65e7d66))
- **hitl2:** shortcuts ([#4315](https://github.com/botpress/botpress/issues/4315)) ([54068b6](https://github.com/botpress/botpress/commit/54068b6))
- **misunderstood:** add thumbs down filter ([#4310](https://github.com/botpress/botpress/issues/4310)) ([8604354](https://github.com/botpress/botpress/commit/8604354))
- **stan:** complete new API ([#4312](https://github.com/botpress/botpress/issues/4312)) ([b27583f](https://github.com/botpress/botpress/commit/b27583f))
- **stan:** get stan ready for launch ([#4341](https://github.com/botpress/botpress/issues/4341)) ([793b9f7](https://github.com/botpress/botpress/commit/793b9f7))
- **studio:** allow URL or variable as image ([#4322](https://github.com/botpress/botpress/issues/4322)) ([19167fa](https://github.com/botpress/botpress/commit/19167fa))

## [12.15.2](https://github.com/botpress/botpress/compare/v12.14.1...v12.15.2) (2020-12-15)

### Bug Fixes

- **core:** various improvements for archives ([#4281](https://github.com/botpress/botpress/issues/4281)) ([b3ef9da](https://github.com/botpress/botpress/commit/b3ef9da))

### Features

- **core:** set any botpress config from env var ([#4300](https://github.com/botpress/botpress/issues/4300)) ([3d5f3c0](https://github.com/botpress/botpress/commit/3d5f3c0))
- **nlu:** training button trains current studio lang ([#4286](https://github.com/botpress/botpress/issues/4286)) ([ed2aaf0](https://github.com/botpress/botpress/commit/ed2aaf0))

## [12.15.1](https://github.com/botpress/botpress/compare/v12.14.1...v12.15.1) (2020-12-09)

### Bug Fixes

- **debugger:** add settings page ([#4272](https://github.com/botpress/botpress/issues/4272)) ([a96829b](https://github.com/botpress/botpress/commit/a96829b))
- **doc:** Typo ([4427ab7](https://github.com/botpress/botpress/commit/4427ab7))
- **extensions:** remove hardcoded placeholder of the dropdwon ([#3583](https://github.com/botpress/botpress/issues/3583)) ([046c02a](https://github.com/botpress/botpress/commit/046c02a))
- **extensions:** use markdown in dropdown element ([#4089](https://github.com/botpress/botpress/issues/4089)) ([#4254](https://github.com/botpress/botpress/issues/4254)) ([c95811c](https://github.com/botpress/botpress/commit/c95811c))
- **hitl:** missing dependency ([#4285](https://github.com/botpress/botpress/issues/4285)) ([d3683f7](https://github.com/botpress/botpress/commit/d3683f7))
- **nlu:** unload model from engine when bot unmount ([#4277](https://github.com/botpress/botpress/issues/4277)) ([b64e11f](https://github.com/botpress/botpress/commit/b64e11f))
- **nlu:** vocab tokenizer should not return empty string ([#4283](https://github.com/botpress/botpress/issues/4283)) ([fe896c3](https://github.com/botpress/botpress/commit/fe896c3))
- **studio:** move flow problem / lock status ([#4278](https://github.com/botpress/botpress/issues/4278)) ([8d9c99f](https://github.com/botpress/botpress/commit/8d9c99f))

### Features

- **channel-web:** disable free text when we use choices ([#3576](https://github.com/botpress/botpress/issues/3576)) ([1554343](https://github.com/botpress/botpress/commit/1554343))
- **misunderstood:** add date filter ([#4258](https://github.com/botpress/botpress/issues/4258)) ([53f6318](https://github.com/botpress/botpress/commit/53f6318))

# [12.15.0](https://github.com/botpress/botpress/compare/v12.14.1...v12.15.0) (2020-12-08)

### Bug Fixes

- **admin:** render needs training only if nlu module is enabled ([#4269](https://github.com/botpress/botpress/issues/4269)) ([dafa9ad](https://github.com/botpress/botpress/commit/dafa9ad))
- **channel-messenger:** handle errors when enabling messenger ([#4080](https://github.com/botpress/botpress/issues/4080)) ([#4261](https://github.com/botpress/botpress/issues/4261)) ([32b332f](https://github.com/botpress/botpress/commit/32b332f))
- **core:** deprecate set attributes ([#4255](https://github.com/botpress/botpress/issues/4255)) ([02ea1cc](https://github.com/botpress/botpress/commit/02ea1cc))
- **core:** opt-in fix for vm context mem leak ([#4268](https://github.com/botpress/botpress/issues/4268)) ([615cceb](https://github.com/botpress/botpress/commit/615cceb))
- **dev:** lint ([#4264](https://github.com/botpress/botpress/issues/4264)) ([8b99b01](https://github.com/botpress/botpress/commit/8b99b01))
- **extensions:** use markdown in dropdown element ([#4089](https://github.com/botpress/botpress/issues/4089)) ([#4254](https://github.com/botpress/botpress/issues/4254)) ([c95811c](https://github.com/botpress/botpress/commit/c95811c))
- **studio:** width of emulator ([#4259](https://github.com/botpress/botpress/issues/4259)) ([e4fa004](https://github.com/botpress/botpress/commit/e4fa004))

### Features

- **dx:** allow packaging only one module ([#4275](https://github.com/botpress/botpress/issues/4275)) ([c089772](https://github.com/botpress/botpress/commit/c089772))
- **hitl2:** Create HITL2 module ([#4115](https://github.com/botpress/botpress/issues/4115)) ([a82f858](https://github.com/botpress/botpress/commit/a82f858))
- **studio:** inspect tool for devs ([#4183](https://github.com/botpress/botpress/issues/4183)) ([e33d0b6](https://github.com/botpress/botpress/commit/e33d0b6))

## [12.14.2](https://github.com/botpress/botpress/compare/v12.14.1...v12.14.2) (2020-12-03)

### Bug Fixes

- **channel-messenger:** handle errors when enabling messenger ([#4080](https://github.com/botpress/botpress/issues/4080)) ([#4261](https://github.com/botpress/botpress/issues/4261)) ([32b332f](https://github.com/botpress/botpress/commit/32b332f))
- **core:** deprecate set attributes ([#4255](https://github.com/botpress/botpress/issues/4255)) ([02ea1cc](https://github.com/botpress/botpress/commit/02ea1cc))
- **studio:** width of emulator ([#4259](https://github.com/botpress/botpress/issues/4259)) ([e4fa004](https://github.com/botpress/botpress/commit/e4fa004))
- **studio:** default emulator avatar style ([#4256](https://github.com/botpress/botpress/pull/4256))

## [12.14.1](https://github.com/botpress/botpress/compare/v12.13.2...v12.14.1) (2020-12-02)

### Bug Fixes

- **channel-web:** revert minimum user id length ([#4251](https://github.com/botpress/botpress/issues/4251)) ([125dac1](https://github.com/botpress/botpress/commit/125dac1))
- **core:** logs panel no longer cleared ([#4252](https://github.com/botpress/botpress/issues/4252)) ([cc7909f](https://github.com/botpress/botpress/commit/cc7909f))
- **telemetry:** negative limit not supported in pg ([#4233](https://github.com/botpress/botpress/issues/4233)) ([6577f2c](https://github.com/botpress/botpress/commit/6577f2c))

# [12.14.0](https://github.com/botpress/botpress/compare/v12.13.2...v12.14.0) (2020-11-29)

### Bug Fixes

- **nlu:** rm special three dots char as it messes up sentencepiece post processing ([#4229](https://github.com/botpress/botpress/issues/4229)) ([64c1923](https://github.com/botpress/botpress/commit/64c1923))
- **telemetry:** negative limit not supported in pg ([#4233](https://github.com/botpress/botpress/issues/4233)) ([6577f2c](https://github.com/botpress/botpress/commit/6577f2c))

### Features

- **core:** migration history ([#4197](https://github.com/botpress/botpress/issues/4197)) ([01b1828](https://github.com/botpress/botpress/commit/01b1828))
- **studio:** move debugger to bottom panel ([#4182](https://github.com/botpress/botpress/issues/4182)) ([e5d52d9](https://github.com/botpress/botpress/commit/e5d52d9))

## [12.13.2](https://github.com/botpress/botpress/compare/v12.13.1...v12.13.2) (2020-11-24)

### Bug Fixes

- **core:** default to production telemetry url ([#4220](https://github.com/botpress/botpress/issues/4220)) ([f03ab25](https://github.com/botpress/botpress/commit/f03ab25))
- **nlu:** lang id is still executed even if some models are out of cache ([#4214](https://github.com/botpress/botpress/issues/4214)) ([0328969](https://github.com/botpress/botpress/commit/0328969))
- **nlu:** measure sizeof both model and entities + added logging ([#4213](https://github.com/botpress/botpress/issues/4213)) ([05b17a6](https://github.com/botpress/botpress/commit/05b17a6))

### Features

- **core:** base for shared libraries ([#4221](https://github.com/botpress/botpress/issues/4221)) ([061760f](https://github.com/botpress/botpress/commit/061760f))
- **core:** list workspace users from sdk ([#4178](https://github.com/botpress/botpress/issues/4178)) ([b56c26d](https://github.com/botpress/botpress/commit/b56c26d))
- **stan:** optionnal version number in stan's API ([#4218](https://github.com/botpress/botpress/issues/4218)) ([16404e7](https://github.com/botpress/botpress/commit/16404e7))

## [12.13.1](https://github.com/botpress/botpress/compare/v12.13.0...v12.13.1) (2020-11-19)

### Bug Fixes

- **channel-web:** fix userId generation and assignment ([#4211](https://github.com/botpress/botpress/issues/4211)) ([586ff29](https://github.com/botpress/botpress/commit/586ff29))
- **channel-web:** new group from payload ([073fd11](https://github.com/botpress/botpress/commit/073fd11))
- **channel-web:** optional close on escape ([1ca1289](https://github.com/botpress/botpress/commit/1ca1289))
- **channel-web:** typing invalid date ([#4190](https://github.com/botpress/botpress/issues/4190)) ([eccf05a](https://github.com/botpress/botpress/commit/eccf05a))
- **core:** add trailing slash for dir listings ([#4206](https://github.com/botpress/botpress/issues/4206)) ([107ab6d](https://github.com/botpress/botpress/commit/107ab6d))
- **webchat:** issue on incognito mode ([#4195](https://github.com/botpress/botpress/issues/4195)) ([0bc28c4](https://github.com/botpress/botpress/commit/0bc28c4))
- **webchat:** multiple calls when using proactive triggers ([#4194](https://github.com/botpress/botpress/issues/4194)) ([6387058](https://github.com/botpress/botpress/commit/6387058))

### Features

- **channel-web:** composer placeholder for initial conversation ([#3629](https://github.com/botpress/botpress/issues/3629)) ([1ec3d38](https://github.com/botpress/botpress/commit/1ec3d38))

# [12.13.0](https://github.com/botpress/botpress/compare/v12.12.1...v12.13.0) (2020-11-16)

### Bug Fixes

- **channel-telegram:** handling of inline keyboard callbacks ([#3454](https://github.com/botpress/botpress/issues/3454)) ([373681e](https://github.com/botpress/botpress/commit/373681e))
- **channel-web:** when we click on a conversation the webchat crashs ([#4169](https://github.com/botpress/botpress/issues/4169)) ([168762a](https://github.com/botpress/botpress/commit/168762a))
- **channels:** fix creating inline keyboard without payload ([#3453](https://github.com/botpress/botpress/issues/3453)) ([95b37cf](https://github.com/botpress/botpress/commit/95b37cf))
- **core:** prevent multiple load of a module ([#4188](https://github.com/botpress/botpress/issues/4188)) ([51f2162](https://github.com/botpress/botpress/commit/51f2162))
- **gh:** skip nlu gh check when PR comes from a fork + skip tslint newrules if no files change ([#4180](https://github.com/botpress/botpress/issues/4180)) ([c4b7fd9](https://github.com/botpress/botpress/commit/c4b7fd9))
- **gh:** tag the version of bitfan in nlu regression gh check ([#4187](https://github.com/botpress/botpress/issues/4187)) ([dcc9da8](https://github.com/botpress/botpress/commit/dcc9da8))
- **hitl:** missing column thread_id for new tables ([#4181](https://github.com/botpress/botpress/issues/4181)) ([ab9d530](https://github.com/botpress/botpress/commit/ab9d530))
- **nlu:** prevent empty string in exact index ([defb08a](https://github.com/botpress/botpress/commit/defb08a))
- **studio:** enhance unclosed brackets, respect order and exact length ([#4173](https://github.com/botpress/botpress/issues/4173)) ([15c2685](https://github.com/botpress/botpress/commit/15c2685))
- **studio:** fix train button ([#4186](https://github.com/botpress/botpress/issues/4186)) ([266b4fa](https://github.com/botpress/botpress/commit/266b4fa))

### Features

- **core:** Telemetry ([#4152](https://github.com/botpress/botpress/issues/4152)) ([162a9ea](https://github.com/botpress/botpress/commit/162a9ea)), closes [#3635](https://github.com/botpress/botpress/issues/3635) [#3649](https://github.com/botpress/botpress/issues/3649) [#3677](https://github.com/botpress/botpress/issues/3677) [#3662](https://github.com/botpress/botpress/issues/3662) [#3752](https://github.com/botpress/botpress/issues/3752) [#3754](https://github.com/botpress/botpress/issues/3754)
- **nlu:** model cache size is settable by nlu config file + refactor stan cli ([#4175](https://github.com/botpress/botpress/issues/4175)) ([45bc176](https://github.com/botpress/botpress/commit/45bc176))
- **studio:** new design for standard & skills ([#4158](https://github.com/botpress/botpress/issues/4158)) ([9be6dfb](https://github.com/botpress/botpress/commit/9be6dfb))

## [12.12.1](https://github.com/botpress/botpress/compare/v12.12.0...v12.12.1) (2020-11-11)

### Bug Fixes

- **nlu:** train now button is more responsive ([#4163](https://github.com/botpress/botpress/issues/4163)) ([069b322](https://github.com/botpress/botpress/commit/069b322))
- **studio:** debugger showing on top of overlay ([#4160](https://github.com/botpress/botpress/issues/4160)) ([0309c8b](https://github.com/botpress/botpress/commit/0309c8b))

# [12.12.0](https://github.com/botpress/botpress/compare/v12.10.10...v12.12.0) (2020-11-05)

### Bug Fixes

- **channel-web:** default style when not emulator ([#4162](https://github.com/botpress/botpress/issues/4162)) ([e0d2d73](https://github.com/botpress/botpress/commit/e0d2d73))
- **channel-web:** web messages displayed in wrong order ([#4142](https://github.com/botpress/botpress/issues/4142)) ([3d49ce3](https://github.com/botpress/botpress/commit/3d49ce3))
- **core:** Ensure version not greater than next major ([#4148](https://github.com/botpress/botpress/issues/4148)) ([1090474](https://github.com/botpress/botpress/commit/1090474))
- **debugger:** error indicator in processing tab & better splash ([#4159](https://github.com/botpress/botpress/issues/4159)) ([a4e2eb1](https://github.com/botpress/botpress/commit/a4e2eb1))
- **nlu:** duckling can return interval with to but no from ([#4123](https://github.com/botpress/botpress/issues/4123)) ([b9c87e8](https://github.com/botpress/botpress/commit/b9c87e8))
- **node:** update .nvmrc for node 12 ([#4125](https://github.com/botpress/botpress/issues/4125)) ([5753d45](https://github.com/botpress/botpress/commit/5753d45))
- **studio:** put back previous library ([6374721](https://github.com/botpress/botpress/commit/6374721))
- **webchat:** debugger on first open ([#4127](https://github.com/botpress/botpress/issues/4127)) ([b890bde](https://github.com/botpress/botpress/commit/b890bde))
- **webchat:** prevent WS reset when userId is set ([#4138](https://github.com/botpress/botpress/issues/4138)) ([06b842a](https://github.com/botpress/botpress/commit/06b842a))
- repair all tslint errors of nlu + node12 branch ([#4124](https://github.com/botpress/botpress/issues/4124)) ([8b7ed2a](https://github.com/botpress/botpress/commit/8b7ed2a))
- repaired debugger by fixing outFiles ([#4013](https://github.com/botpress/botpress/issues/4013)) ([1312035](https://github.com/botpress/botpress/commit/1312035))

### Features

- **admin:** change color of the needs training warning to orange ([#4130](https://github.com/botpress/botpress/issues/4130)) ([4df369c](https://github.com/botpress/botpress/commit/4df369c))
- **core:** event processing ([#4122](https://github.com/botpress/botpress/issues/4122)) ([998d30d](https://github.com/botpress/botpress/commit/998d30d))
- **debugger:** show traces on workflow ([#4097](https://github.com/botpress/botpress/issues/4097)) ([50f077d](https://github.com/botpress/botpress/commit/50f077d))
- **emulator:** reapply emulator styling ([#4112](https://github.com/botpress/botpress/issues/4112)) ([f0bf1b4](https://github.com/botpress/botpress/commit/f0bf1b4))
- **studio:** workflow toolbar ([#4120](https://github.com/botpress/botpress/issues/4120)) ([a187bc4](https://github.com/botpress/botpress/commit/a187bc4))
- **testing:** Delete feature for test scenarios [#4111](https://github.com/botpress/botpress/issues/4111) ([#4114](https://github.com/botpress/botpress/issues/4114)) ([041e703](https://github.com/botpress/botpress/commit/041e703))

# [12.11.0](https://github.com/botpress/botpress/compare/v12.10.7...v12.11.0) (2020-10-27)

### Bug Fixes

- **nlu:** added back dialog conditions ([0d10101](https://github.com/botpress/botpress/commit/0d10101))
- **nlu:** copy utterances don't copy numbers and empty lines ([#4079](https://github.com/botpress/botpress/issues/4079)) ([607a83d](https://github.com/botpress/botpress/commit/607a83d))
- **nlu:** duckling numbers have no unit but a value ([#4069](https://github.com/botpress/botpress/issues/4069)) ([7859362](https://github.com/botpress/botpress/commit/7859362))
- **nlu:** duckling time can return an interval ([#4038](https://github.com/botpress/botpress/issues/4038)) ([4a16694](https://github.com/botpress/botpress/commit/4a16694))
- **nlu:** entity form issue [#4036](https://github.com/botpress/botpress/issues/4036) ([#4099](https://github.com/botpress/botpress/issues/4099)) ([2dbe9d5](https://github.com/botpress/botpress/commit/2dbe9d5))
- **nlu:** flat map duckling nested values ([#4025](https://github.com/botpress/botpress/issues/4025)) ([7c5565c](https://github.com/botpress/botpress/commit/7c5565c))
- **nlu:** lang identifier uses pretrained model from app data directory ([26abc3a](https://github.com/botpress/botpress/commit/26abc3a))
- **nlu:** load model on bot mount but do not train ([43537c3](https://github.com/botpress/botpress/commit/43537c3))
- **nlu:** nlu seed used in lang provider is passed for one training ([#3997](https://github.com/botpress/botpress/issues/3997)) ([7a5397b](https://github.com/botpress/botpress/commit/7a5397b))
- **nlu:** no more training on bot mount ([a98e58d](https://github.com/botpress/botpress/commit/a98e58d))
- **nlu:** replace train status long polling by file watcher ([1fda56a](https://github.com/botpress/botpress/commit/1fda56a))
- **nlu:** rm unused translations ([19670cd](https://github.com/botpress/botpress/commit/19670cd))
- **nlu:** train endpoint return asap ([f7c0522](https://github.com/botpress/botpress/commit/f7c0522))
- **nlu:** wait for desired worker to return worker ready event ([#4034](https://github.com/botpress/botpress/issues/4034)) ([d0e60b0](https://github.com/botpress/botpress/commit/d0e60b0))
- **nlu-regression:** added some sleep between training and prediction ([8282d0a](https://github.com/botpress/botpress/commit/8282d0a))
- **pkg:** added nlu-core to pkg.json to make binary work ([3948d78](https://github.com/botpress/botpress/commit/3948d78))
- **regression:** build shared light before shared in nlu-regression ([42d7bf7](https://github.com/botpress/botpress/commit/42d7bf7))
- **stan:** allowed variable types include system and any ([8a16ae6](https://github.com/botpress/botpress/commit/8a16ae6))
- **stan:** rm complexes from stan's API ([cd6c399](https://github.com/botpress/botpress/commit/cd6c399))
- **stan:** update api.rest file to the markdown notation ([a7f0b6b](https://github.com/botpress/botpress/commit/a7f0b6b))
- **core:** ubuntu is default linux ([#3536](https://github.com/botpress/botpress/issues/3536)) ([0cd5383](https://github.com/botpress/botpress/commit/0cd5383))
- **mltoolkit:** error are passed by mlworkers to web worker ([#3792](https://github.com/botpress/botpress/issues/3792)) ([d6d70cd](https://github.com/botpress/botpress/commit/d6d70cd))
- **mltoolkit:** no need for gridsearch in svm when only one combination ([#3734](https://github.com/botpress/botpress/issues/3734)) ([5eb9625](https://github.com/botpress/botpress/commit/5eb9625))
- **mltoolkit:** turn off debug logging as it slows down crf training ([#3665](https://github.com/botpress/botpress/issues/3665)) ([a3a2669](https://github.com/botpress/botpress/commit/a3a2669))
- **nlu:** add pre-trained and stop-words to pkg ([#3819](https://github.com/botpress/botpress/issues/3819)) ([f5b44a3](https://github.com/botpress/botpress/commit/f5b44a3))
- **nlu:** added back entities caching at training time ([#3874](https://github.com/botpress/botpress/issues/3874)) ([16882b0](https://github.com/botpress/botpress/commit/16882b0))
- **nlu:** added back extracted entity in slot when there's one ([#3559](https://github.com/botpress/botpress/issues/3559)) ([66b856d](https://github.com/botpress/botpress/commit/66b856d))
- **nlu:** added back missing tar dependency ([#3827](https://github.com/botpress/botpress/issues/3827)) ([42a91b5](https://github.com/botpress/botpress/commit/42a91b5))
- **nlu:** allow entity extraction even if no utterance at predict time ([#3909](https://github.com/botpress/botpress/issues/3909)) ([8fc4e4a](https://github.com/botpress/botpress/commit/8fc4e4a))
- **nlu:** bring back stop words in the binary ([#3931](https://github.com/botpress/botpress/issues/3931)) ([3eab20d](https://github.com/botpress/botpress/commit/3eab20d))
- **nlu:** fix nlu related github checks ([#3913](https://github.com/botpress/botpress/issues/3913)) ([75e63d0](https://github.com/botpress/botpress/commit/75e63d0))
- **nlu:** forgot to persist output except intents ([#3644](https://github.com/botpress/botpress/issues/3644)) ([49730a0](https://github.com/botpress/botpress/commit/49730a0))
- **nlu:** include missing qna ([cd6a31d](https://github.com/botpress/botpress/commit/cd6a31d))
- **nlu:** increment nlu and lang server version for new ml bindings ([#3500](https://github.com/botpress/botpress/issues/3500)) ([57fcd22](https://github.com/botpress/botpress/commit/57fcd22))
- **nlu:** increment nlu version because model format has changed ([#3682](https://github.com/botpress/botpress/issues/3682)) ([e676338](https://github.com/botpress/botpress/commit/e676338))
- **nlu:** log error stack trace and botId in NLU ([#3921](https://github.com/botpress/botpress/issues/3921)) ([9e04ab5](https://github.com/botpress/botpress/commit/9e04ab5))
- **nlu:** make sure all word emebddings have same length ([7755533](https://github.com/botpress/botpress/commit/7755533))
- **nlu:** no svm training when multiple ctx but none with intents ([#3958](https://github.com/botpress/botpress/issues/3958)) ([fef64ce](https://github.com/botpress/botpress/commit/fef64ce))
- **nlu:** oos prediction was using keys of array instead of ctxs ([#3950](https://github.com/botpress/botpress/issues/3950)) ([99a7b8c](https://github.com/botpress/botpress/commit/99a7b8c))
- **nlu:** removed OOS on exact match ([#3743](https://github.com/botpress/botpress/issues/3743)) ([b08b077](https://github.com/botpress/botpress/commit/b08b077))
- **nlu:** repair vocab words when generating none utts ([#3963](https://github.com/botpress/botpress/issues/3963)) ([5e5e08e](https://github.com/botpress/botpress/commit/5e5e08e))
- **nlu:** reset seeded lodash for all calls ([#3955](https://github.com/botpress/botpress/issues/3955)) ([c0d698e](https://github.com/botpress/botpress/commit/c0d698e))
- **nlu:** retrain only modified ctx merge fix ([#3946](https://github.com/botpress/botpress/issues/3946)) ([74b31c0](https://github.com/botpress/botpress/commit/74b31c0))
- rm telemetry repo temporarly ([9a6e06e](https://github.com/botpress/botpress/commit/9a6e06e))
- **nlu:** rm sys entities from features + check vectors length ([#3558](https://github.com/botpress/botpress/issues/3558)) ([954eb00](https://github.com/botpress/botpress/commit/954eb00))
- **nlu-testing:** allow testing both intent and slot without ctx ([#3761](https://github.com/botpress/botpress/issues/3761)) ([19efd8c](https://github.com/botpress/botpress/commit/19efd8c))
- **nlu-testing:** latest-results are by bot ([#3561](https://github.com/botpress/botpress/issues/3561)) ([fd93535](https://github.com/botpress/botpress/commit/fd93535))
- update all linux native extensions ([#3548](https://github.com/botpress/botpress/issues/3548)) ([641bad6](https://github.com/botpress/botpress/commit/641bad6))

### Features

- **admin:** indicate if bot needs training in admin ([#4108](https://github.com/botpress/botpress/issues/4108)) ([2b8a570](https://github.com/botpress/botpress/commit/2b8a570))
- **nlu:** new field spellChecked in event understanding ([#3953](https://github.com/botpress/botpress/issues/3953)) ([8d7ca44](https://github.com/botpress/botpress/commit/8d7ca44))
- **nlu:** nlu testing always gives the same result ([#3513](https://github.com/botpress/botpress/issues/3513)) ([8cb8a75](https://github.com/botpress/botpress/commit/8cb8a75))
- **nlu:** tokenize using vocab when s-piece is struggling ([#3543](https://github.com/botpress/botpress/issues/3543)) ([587b522](https://github.com/botpress/botpress/commit/587b522))
- **nlu:** train now button becomes retrain all when auto train is on ([#3512](https://github.com/botpress/botpress/issues/3512)) ([83f6ea7](https://github.com/botpress/botpress/commit/83f6ea7))
- **nlu:** training cancelation + usage of both worker threads and child process ([#3841](https://github.com/botpress/botpress/issues/3841)) ([2ea3e22](https://github.com/botpress/botpress/commit/2ea3e22))
- **nlu:** entities encoding ([#3301](https://github.com/botpress/botpress/issues/3301)) ([06c7de6](https://github.com/botpress/botpress/commit/06c7de6))
- **nlu-testing:** added github check to prevent regression on NLU BPDS ([#3565](https://github.com/botpress/botpress/issues/3565)) ([92348f3](https://github.com/botpress/botpress/commit/92348f3))
- **stan:** completly new API to botpress Stan ([a403f83](https://github.com/botpress/botpress/commit/a403f83)), closes [#4064](https://github.com/botpress/botpress/issues/4064) [#4019](https://github.com/botpress/botpress/issues/4019) [#3996](https://github.com/botpress/botpress/issues/3996) [#4006](https://github.com/botpress/botpress/issues/4006)

## [12.10.10](https://github.com/botpress/botpress/compare/v12.10.9...v12.10.10) (2020-10-27)

### Bug Fixes

- **code-editor:** fix firefox scroll & minor changes ([#4094](https://github.com/botpress/botpress/issues/4094)) ([2bd0bec](https://github.com/botpress/botpress/commit/2bd0bec))
- **converse:** tangled messages with multiple bots ([#4085](https://github.com/botpress/botpress/issues/4085)) ([14be745](https://github.com/botpress/botpress/commit/14be745))
- **core:** reverse proxy support all types ([#4105](https://github.com/botpress/botpress/issues/4105)) ([c5b88cb](https://github.com/botpress/botpress/commit/c5b88cb))
- **flow:** ordering is different on postgres ([#4102](https://github.com/botpress/botpress/issues/4102)) ([6f26e31](https://github.com/botpress/botpress/commit/6f26e31))
- **lang-server:** offline is a boolean cli arg ([#4084](https://github.com/botpress/botpress/issues/4084)) ([08d82bd](https://github.com/botpress/botpress/commit/08d82bd))
- **ndu:** skill choice issue with capitalized choices ([#4109](https://github.com/botpress/botpress/issues/4109)) ([d2d550d](https://github.com/botpress/botpress/commit/d2d550d))
- **nlu:** copy utterances don't copy numbers and empty lines ([#4079](https://github.com/botpress/botpress/issues/4079)) ([607a83d](https://github.com/botpress/botpress/commit/607a83d))
- **nlu:** entity form issue [#4036](https://github.com/botpress/botpress/issues/4036) ([#4099](https://github.com/botpress/botpress/issues/4099)) ([2dbe9d5](https://github.com/botpress/botpress/commit/2dbe9d5))
- **studio:** fix skill reorder [#4011](https://github.com/botpress/botpress/issues/4011) ([#4101](https://github.com/botpress/botpress/issues/4101)) ([6bde467](https://github.com/botpress/botpress/commit/6bde467))
- **studio:** unclosed brackets crashing UI [#3678](https://github.com/botpress/botpress/issues/3678) ([#4106](https://github.com/botpress/botpress/issues/4106)) ([3dbb6e4](https://github.com/botpress/botpress/commit/3dbb6e4))
- **studio:** update all nodes when renaming flows [#3936](https://github.com/botpress/botpress/issues/3936) ([#4100](https://github.com/botpress/botpress/issues/4100)) ([7afa2e6](https://github.com/botpress/botpress/commit/7afa2e6))
- **webchat:** added condition to query ([#4082](https://github.com/botpress/botpress/issues/4082)) ([c0a24a7](https://github.com/botpress/botpress/commit/c0a24a7))

## [12.10.9](https://github.com/botpress/botpress/compare/v12.10.7...v12.10.9) (2020-10-19)

### Bug Fixes

- **admin:** update react scripts ([#3983](https://github.com/botpress/botpress/issues/3983)) ([1a4ba1e](https://github.com/botpress/botpress/commit/1a4ba1e))
- **analytics:** display deleted QnAs ([#4076](https://github.com/botpress/botpress/issues/4076)) ([f46019d](https://github.com/botpress/botpress/commit/f46019d))
- **basic-skills:** choice: kw strict equality comparison ([#3975](https://github.com/botpress/botpress/issues/3975)) ([efac56e](https://github.com/botpress/botpress/commit/efac56e))
- **channel-web:** database indices ([#3981](https://github.com/botpress/botpress/issues/3981)) ([907cc80](https://github.com/botpress/botpress/commit/907cc80))
- **qna:** stable QnA IDs when importing ([#4031](https://github.com/botpress/botpress/issues/4031)) ([703e48e](https://github.com/botpress/botpress/commit/703e48e))
- **webchat:** add missing column ([#4008](https://github.com/botpress/botpress/issues/4008)) ([26697d8](https://github.com/botpress/botpress/commit/26697d8))

### Features

- **analytics:** messages by language ([#4020](https://github.com/botpress/botpress/issues/4020)) ([2d21cd1](https://github.com/botpress/botpress/commit/2d21cd1))
- **channel-web:** conversationId ([#4016](https://github.com/botpress/botpress/issues/4016)) ([f783b66](https://github.com/botpress/botpress/commit/f783b66))
- **hitl:** add thread_id to sessions table ([#3982](https://github.com/botpress/botpress/issues/3982)) ([332f1a2](https://github.com/botpress/botpress/commit/332f1a2))
- **qna:** copy Qna ID to clipboard ([#4057](https://github.com/botpress/botpress/issues/4057)) ([31de13f](https://github.com/botpress/botpress/commit/31de13f))
- **webchat:** lazy socket ([#4077](https://github.com/botpress/botpress/issues/4077)) ([f0e9a9c](https://github.com/botpress/botpress/commit/f0e9a9c))

## [12.10.8](https://github.com/botpress/botpress/compare/v12.10.7...v12.10.8) (2020-10-06)

### Bug Fixes

- **admin:** update react scripts ([#3983](https://github.com/botpress/botpress/issues/3983)) ([1a4ba1e](https://github.com/botpress/botpress/commit/1a4ba1e))
- **basic-skills:** choice: kw strict equality comparison ([#3975](https://github.com/botpress/botpress/issues/3975)) ([efac56e](https://github.com/botpress/botpress/commit/efac56e))
- **channel-web:** database indices ([#3981](https://github.com/botpress/botpress/issues/3981)) ([907cc80](https://github.com/botpress/botpress/commit/907cc80))
- **webchat:** add missing column ([#4008](https://github.com/botpress/botpress/issues/4008)) ([26697d8](https://github.com/botpress/botpress/commit/26697d8))

### Features

- **analytics:** messages by language ([#4020](https://github.com/botpress/botpress/issues/4020)) ([2d21cd1](https://github.com/botpress/botpress/commit/2d21cd1))
- **channel-web:** conversationId ([#4016](https://github.com/botpress/botpress/issues/4016)) ([f783b66](https://github.com/botpress/botpress/commit/f783b66))
- **hitl:** add thread_id to sessions table ([#3982](https://github.com/botpress/botpress/issues/3982)) ([332f1a2](https://github.com/botpress/botpress/commit/332f1a2))

## [12.10.7](https://github.com/botpress/botpress/compare/v12.10.6...v12.10.7) (2020-09-11)

### Bug Fixes

- **admin:** bigger timeout for server archives ([#3891](https://github.com/botpress/botpress/issues/3891)) ([c10bb76](https://github.com/botpress/botpress/commit/c10bb76))
- **core:** no update when no changes are made ([#3888](https://github.com/botpress/botpress/issues/3888)) ([8254fee](https://github.com/botpress/botpress/commit/8254fee))
- **misunderstood:** empty conversation on deleted event ([#3886](https://github.com/botpress/botpress/issues/3886)) ([3ee5bda](https://github.com/botpress/botpress/commit/3ee5bda))
- **misunderstood:** order events based on createdOn ([#3887](https://github.com/botpress/botpress/issues/3887)) ([bc56f62](https://github.com/botpress/botpress/commit/bc56f62))
- **webchat:** use correct storage for language ([#3854](https://github.com/botpress/botpress/issues/3854)) ([b3a20b2](https://github.com/botpress/botpress/commit/b3a20b2))

## [12.10.6](https://github.com/botpress/botpress/compare/v12.10.5...v12.10.6) (2020-08-25)

### Bug Fixes

- **basic-skills:** avoid choice skill errors with custom events ([7e0f448](https://github.com/botpress/botpress/commit/7e0f448))
- **builtin:** add missing quotes ([#3784](https://github.com/botpress/botpress/issues/3784)) ([70261d1](https://github.com/botpress/botpress/commit/70261d1))
- **core:** fix slow issue with lot of flows ([#3764](https://github.com/botpress/botpress/issues/3764)) ([67ac9dd](https://github.com/botpress/botpress/commit/67ac9dd))
- **core:** locked bots prevent migration completion ([#3837](https://github.com/botpress/botpress/issues/3837)) ([03a84e3](https://github.com/botpress/botpress/commit/03a84e3))
- **core:** upload archive on windows didn't work ([#3838](https://github.com/botpress/botpress/issues/3838)) ([d269260](https://github.com/botpress/botpress/commit/d269260))
- **nlu:** exact match is made by replacing entity occurence by name ([#3727](https://github.com/botpress/botpress/issues/3727)) ([79e6461](https://github.com/botpress/botpress/commit/79e6461))
- **scheduler:** prevent sending events before startup ([b5c7fc6](https://github.com/botpress/botpress/commit/b5c7fc6))

### Features

- **nlu-testing:** added new bot template to test slot extraction ([30d2a6a](https://github.com/botpress/botpress/commit/30d2a6a))
- **nlu-testing:** added new bot-template to test slot extraction ([632f098](https://github.com/botpress/botpress/commit/632f098))

## [12.10.5](https://github.com/botpress/botpress/compare/v12.10.4...v12.10.5) (2020-08-06)

### Bug Fixes

- **core:** memory leak when file persister is disabled ([#3722](https://github.com/botpress/botpress/issues/3722)) ([d65cbca](https://github.com/botpress/botpress/commit/d65cbca))
- **diag:** add monitor & more tests ([#3720](https://github.com/botpress/botpress/issues/3720)) ([579dc09](https://github.com/botpress/botpress/commit/579dc09))
- **ndu:** clearer error message ([a250e1c](https://github.com/botpress/botpress/commit/a250e1c))

### Features

- **core:** diagnostic tests ([#3672](https://github.com/botpress/botpress/issues/3672)) ([e378bc1](https://github.com/botpress/botpress/commit/e378bc1))

## [12.10.4](https://github.com/botpress/botpress/compare/v12.10.3...v12.10.4) (2020-07-28)

### Bug Fixes

- **core:** auto refresh on load & fix bad env key ([#3661](https://github.com/botpress/botpress/issues/3661)) ([ae4ba70](https://github.com/botpress/botpress/commit/ae4ba70))
- **core:** missing words and translation ([#3653](https://github.com/botpress/botpress/issues/3653)) ([a6c404d](https://github.com/botpress/botpress/commit/a6c404d))
- **hitl:** display latest conversation ([#3646](https://github.com/botpress/botpress/issues/3646)) ([2e7056d](https://github.com/botpress/botpress/commit/2e7056d))
- **qna:** null propagation on electedAnswer ([#3657](https://github.com/botpress/botpress/issues/3657)) ([5bd88a1](https://github.com/botpress/botpress/commit/5bd88a1))

## [12.10.3](https://github.com/botpress/botpress/compare/v12.10.2...v12.10.3) (2020-07-17)

### Bug Fixes

- **channel-web:** actually wait until chat is loaded ([#3587](https://github.com/botpress/botpress/issues/3587)) ([772e2a9](https://github.com/botpress/botpress/commit/772e2a9))
- **core:** allowoverride import generates duplicate bots in workspace ([#3584](https://github.com/botpress/botpress/issues/3584)) ([ac8f6fc](https://github.com/botpress/botpress/commit/ac8f6fc))
- **core:** default permissions for new workspaces ([#3530](https://github.com/botpress/botpress/issues/3530)) ([3474474](https://github.com/botpress/botpress/commit/3474474))
- **core:** small fixes for debugger & lifecycle ([#3586](https://github.com/botpress/botpress/issues/3586)) ([b50cfae](https://github.com/botpress/botpress/commit/b50cfae))
- **nlu:** added back extracted entity in slot when there's one ([#3559](https://github.com/botpress/botpress/issues/3559)) ([5362b77](https://github.com/botpress/botpress/commit/5362b77))
- **nlu:** encode URI before calling duckling ([a96372d](https://github.com/botpress/botpress/commit/a96372d))

### Features

- **channel-web:** more req per sec on master ([#3590](https://github.com/botpress/botpress/issues/3590)) ([1b12efc](https://github.com/botpress/botpress/commit/1b12efc))

## [12.10.2](https://github.com/botpress/botpress/compare/v12.10.1...v12.10.2) (2020-06-24)

### Bug Fixes

- **core:** whilelabel login page ([ad83865](https://github.com/botpress/botpress/commit/ad83865))
- **core:** whitelabel login page ([3456a6f](https://github.com/botpress/botpress/commit/3456a6f))
- **nlu:** do not assume there is at least one prediction ([#3486](https://github.com/botpress/botpress/issues/3486)) ([3ba309c](https://github.com/botpress/botpress/commit/3ba309c))

## [12.10.1](https://github.com/botpress/botpress/compare/v12.10.0...v12.10.1) (2020-06-16)

### Bug Fixes

- **choice:** fix legacy choice ([#3466](https://github.com/botpress/botpress/issues/3466)) ([ef359b4](https://github.com/botpress/botpress/commit/ef359b4))
- **nlu:** fix nlu predictions for intents with no trained predictors ([#3441](https://github.com/botpress/botpress/issues/3441)) ([2732571](https://github.com/botpress/botpress/commit/2732571)), closes [#3444](https://github.com/botpress/botpress/issues/3444) [#3448](https://github.com/botpress/botpress/issues/3448)

# [12.10.0](https://github.com/botpress/botpress/compare/v12.9.3...v12.10.0) (2020-06-10)

### Bug Fixes

- **analytics:** fix nan display ([#3407](https://github.com/botpress/botpress/issues/3407)) ([23f32dc](https://github.com/botpress/botpress/commit/23f32dc))
- **broadcast:** ported to 12.x ([#3078](https://github.com/botpress/botpress/issues/3078)) ([dcfa435](https://github.com/botpress/botpress/commit/dcfa435))
- **core:** clear workflow property before assigning ([#3405](https://github.com/botpress/botpress/issues/3405)) ([e7827d9](https://github.com/botpress/botpress/commit/e7827d9))
- **core:** flag to run transitions outside of the sandbox ([#3363](https://github.com/botpress/botpress/issues/3363)) ([bd0738f](https://github.com/botpress/botpress/commit/bd0738f))
- **core:** implement choice in ndu ([#3233](https://github.com/botpress/botpress/issues/3233)) ([a28d094](https://github.com/botpress/botpress/commit/a28d094))
- **core:** locking mechanism when not using redis ([#3357](https://github.com/botpress/botpress/issues/3357)) ([6e042b8](https://github.com/botpress/botpress/commit/6e042b8))
- **core:** say something was not using templates properly ([#3396](https://github.com/botpress/botpress/issues/3396)) ([48dc885](https://github.com/botpress/botpress/commit/48dc885))
- **core:** update sandbox behavior ([#3359](https://github.com/botpress/botpress/issues/3359)) ([6fd5a79](https://github.com/botpress/botpress/commit/6fd5a79))
- **ndu:** updated bot template ([#3315](https://github.com/botpress/botpress/issues/3315)) ([aff76c2](https://github.com/botpress/botpress/commit/aff76c2))
- **ndu:** updated workflows management & workflow ended ([#3235](https://github.com/botpress/botpress/issues/3235)) ([cacc5ec](https://github.com/botpress/botpress/commit/cacc5ec))
- **nlu:** entities duplication ([#3183](https://github.com/botpress/botpress/issues/3183)) ([36c9c48](https://github.com/botpress/botpress/commit/36c9c48))
- **nlu:** remove sensitive data from text ([ee12dbf](https://github.com/botpress/botpress/commit/ee12dbf))
- **nlu:** update slots and intents on entity removal ([#2820](https://github.com/botpress/botpress/issues/2820)) ([d21938d](https://github.com/botpress/botpress/commit/d21938d))
- **qna:** fix issue with toggle all qnas ([#3378](https://github.com/botpress/botpress/issues/3378)) ([6f1e998](https://github.com/botpress/botpress/commit/6f1e998))
- **qna:** remove nlu logger for qna ([#3330](https://github.com/botpress/botpress/issues/3330)) ([656cd9f](https://github.com/botpress/botpress/commit/656cd9f))
- **qna:** various bug fixes ([f81b5ab](https://github.com/botpress/botpress/commit/f81b5ab))
- **studio:** flow / oneflow path ([#3406](https://github.com/botpress/botpress/issues/3406)) ([977ee3a](https://github.com/botpress/botpress/commit/977ee3a))
- **topics:** quickfix for release for topics list ([#3371](https://github.com/botpress/botpress/issues/3371)) ([4b7ad2f](https://github.com/botpress/botpress/commit/4b7ad2f))

### Features

- **core:** branding & white label ([#3323](https://github.com/botpress/botpress/issues/3323)) ([ef47cfa](https://github.com/botpress/botpress/commit/ef47cfa))
- **core:** module management ([#3336](https://github.com/botpress/botpress/issues/3336)) ([826ce82](https://github.com/botpress/botpress/commit/826ce82))
- **nlu:** out of scope model by topic ([b00a967](https://github.com/botpress/botpress/commit/b00a967))
- **qna:** new UI for QnA ([#3279](https://github.com/botpress/botpress/issues/3279)) ([63e0be2](https://github.com/botpress/botpress/commit/63e0be2))
- **shared:** right sidebar portal that pushes content ([#3331](https://github.com/botpress/botpress/issues/3331)) ([6f6e086](https://github.com/botpress/botpress/commit/6f6e086))
- **studio:** implement style for new sidebar menu ([#3309](https://github.com/botpress/botpress/issues/3309)) ([5445ffa](https://github.com/botpress/botpress/commit/5445ffa))
- **studio:** topics ([#3222](https://github.com/botpress/botpress/issues/3222)) ([230bb39](https://github.com/botpress/botpress/commit/230bb39))

## [12.9.3](https://github.com/botpress/botpress/compare/v12.9.2...v12.9.3) (2020-05-21)

### Bug Fixes

- **analytics:** ensure standard date format ([#3351](https://github.com/botpress/botpress/issues/3351)) ([5471ed0](https://github.com/botpress/botpress/commit/5471ed0))
- **channel-messenger:** remove invalid keys ([#3091](https://github.com/botpress/botpress/issues/3091)) ([553fb25](https://github.com/botpress/botpress/commit/553fb25))
- **core:** fix jumpTo in actions [#1772](https://github.com/botpress/botpress/issues/1772) ([#3014](https://github.com/botpress/botpress/issues/3014)) ([bc61a49](https://github.com/botpress/botpress/commit/bc61a49))
- **core:** img link with custom path & preview ([#3337](https://github.com/botpress/botpress/issues/3337)) ([e5563a4](https://github.com/botpress/botpress/commit/e5563a4))
- **core:** limit sqlite batch size ([#3350](https://github.com/botpress/botpress/issues/3350)) ([a631f4d](https://github.com/botpress/botpress/commit/a631f4d))
- **core:** moved heavy operation ([#3339](https://github.com/botpress/botpress/issues/3339)) ([0a0fec0](https://github.com/botpress/botpress/commit/0a0fec0))
- **core:** prevent race condition for instances ([#3343](https://github.com/botpress/botpress/issues/3343)) ([067348a](https://github.com/botpress/botpress/commit/067348a))
- **core:** sessions not expiring ([#3341](https://github.com/botpress/botpress/issues/3341)) ([1e8822b](https://github.com/botpress/botpress/commit/1e8822b))
- **core:** small speed improvement & less gc work ([#3340](https://github.com/botpress/botpress/issues/3340)) ([7002a4a](https://github.com/botpress/botpress/commit/7002a4a))
- **hitl:** fix rendering issue with messages from messenger ([#3104](https://github.com/botpress/botpress/issues/3104)) ([5f54fdc](https://github.com/botpress/botpress/commit/5f54fdc))
- **qna:** warn instead of block for duplicates ([#3338](https://github.com/botpress/botpress/issues/3338)) ([49337ac](https://github.com/botpress/botpress/commit/49337ac))
- **studio:** add the content arrays reorder ([#3352](https://github.com/botpress/botpress/issues/3352)) ([07da5ff](https://github.com/botpress/botpress/commit/07da5ff))

## [12.9.2](https://github.com/botpress/botpress/compare/v12.9.1...v12.9.2) (2020-05-12)

### Bug Fixes

- **auth:** random delay during auth ([#3306](https://github.com/botpress/botpress/issues/3306)) ([75aed18](https://github.com/botpress/botpress/commit/75aed18))
- **builtin:** fix image element's url [#3163](https://github.com/botpress/botpress/issues/3163) ([#3312](https://github.com/botpress/botpress/issues/3312)) ([34e590a](https://github.com/botpress/botpress/commit/34e590a))
- **code-editor:** fix hooks' arguments types ([#3303](https://github.com/botpress/botpress/issues/3303)) ([6ed030d](https://github.com/botpress/botpress/commit/6ed030d))
- **code-editor:** fix signatures of hooks and actions ([#3295](https://github.com/botpress/botpress/issues/3295)) ([62431a2](https://github.com/botpress/botpress/commit/62431a2))
- **core:** ajusting more errors ([#3311](https://github.com/botpress/botpress/issues/3311)) ([b505035](https://github.com/botpress/botpress/commit/b505035))
- **core:** base implementation for global error handling ([#3307](https://github.com/botpress/botpress/issues/3307)) ([93a7c6d](https://github.com/botpress/botpress/commit/93a7c6d))
- **core:** validate extension ([#3305](https://github.com/botpress/botpress/issues/3305)) ([1cf6a98](https://github.com/botpress/botpress/commit/1cf6a98))
- **dialog:** add return & execute ([#3310](https://github.com/botpress/botpress/issues/3310)) ([3208bea](https://github.com/botpress/botpress/commit/3208bea))
- **module-builder:** remove warning for acorn ([#3296](https://github.com/botpress/botpress/issues/3296)) ([caca8c0](https://github.com/botpress/botpress/commit/caca8c0))
- **nlu:** cross validation ([96794bb](https://github.com/botpress/botpress/commit/96794bb))
- **nlu:** prevent empty string in exact index ([#3300](https://github.com/botpress/botpress/issues/3300)) ([f1d879b](https://github.com/botpress/botpress/commit/f1d879b))
- **qna:** use same lang as cms ([#3319](https://github.com/botpress/botpress/issues/3319)) ([9d93f0e](https://github.com/botpress/botpress/commit/9d93f0e))
- **ui-studio:** don't close create element modal on enter ([#3313](https://github.com/botpress/botpress/issues/3313)) ([b855d60](https://github.com/botpress/botpress/commit/b855d60))

## [12.9.1](https://github.com/botpress/botpress/compare/v12.9.0...v12.9.1) (2020-04-29)

### Bug Fixes

- **analytics:** fix wrong stats ([#3289](https://github.com/botpress/botpress/issues/3289)) ([c0c7125](https://github.com/botpress/botpress/commit/c0c7125))
- **channel-web:** fix button height [#3200](https://github.com/botpress/botpress/issues/3200) ([#3288](https://github.com/botpress/botpress/issues/3288)) ([e110959](https://github.com/botpress/botpress/commit/e110959))
- **core:** fix revision history [#3129](https://github.com/botpress/botpress/issues/3129) ([#3290](https://github.com/botpress/botpress/issues/3290)) ([01de6ee](https://github.com/botpress/botpress/commit/01de6ee))
- **nlu:** fallback LID on vocab ([#3284](https://github.com/botpress/botpress/issues/3284)) ([aa8c453](https://github.com/botpress/botpress/commit/aa8c453))

# [12.9.0](https://github.com/botpress/botpress/compare/v12.8.6...v12.9.0) (2020-04-27)

### Bug Fixes

- **core:** more details when error with actions required ([#3181](https://github.com/botpress/botpress/issues/3181)) ([173274e](https://github.com/botpress/botpress/commit/173274e))
- **nlu:** model serialization of models prior 12.9 have no cache ([5551b2a](https://github.com/botpress/botpress/commit/5551b2a))
- **ui:** minor fix to ui ([#3287](https://github.com/botpress/botpress/issues/3287)) ([56a0d66](https://github.com/botpress/botpress/commit/56a0d66))
- **ui:** restore global styling to default ([#3241](https://github.com/botpress/botpress/issues/3241)) ([9ce0d6f](https://github.com/botpress/botpress/commit/9ce0d6f))

### Features

- **admin:** add module management page ([#3262](https://github.com/botpress/botpress/issues/3262)) ([ee9e47b](https://github.com/botpress/botpress/commit/ee9e47b))
- **code-editor:** add file upload to advanced editor ([#3273](https://github.com/botpress/botpress/issues/3273)) ([6d5dc7a](https://github.com/botpress/botpress/commit/6d5dc7a))
- **commander:** shared commands between admin and studio ([#3204](https://github.com/botpress/botpress/issues/3204)) ([6d1b13c](https://github.com/botpress/botpress/commit/6d1b13c))
- **core:** added support for elements in flow nodes ([#3182](https://github.com/botpress/botpress/issues/3182)) ([11f1647](https://github.com/botpress/botpress/commit/11f1647))
- **nlu:** custom entity caching ([71e7d75](https://github.com/botpress/botpress/commit/71e7d75))
- **shared:** reusable 2nd toolbar, empty state and content wrapper ([#3229](https://github.com/botpress/botpress/issues/3229)) ([e0058e2](https://github.com/botpress/botpress/commit/e0058e2))
- **studio:** improvements on the toolbar ([#3190](https://github.com/botpress/botpress/issues/3190)) ([5c4dbf1](https://github.com/botpress/botpress/commit/5c4dbf1))
- **studio:** new toolbar and status bar ([#3172](https://github.com/botpress/botpress/issues/3172)) ([420578a](https://github.com/botpress/botpress/commit/420578a))
- **studio:** oneflow has fixed size sidebar and topics have Q&A and WF counts ([#3221](https://github.com/botpress/botpress/issues/3221)) ([c32e4d1](https://github.com/botpress/botpress/commit/c32e4d1))
- **studio:** say node sidebar form ([#3120](https://github.com/botpress/botpress/issues/3120)) ([00f0230](https://github.com/botpress/botpress/commit/00f0230))
- **ui:** add a customizable blueprint theme ([#3186](https://github.com/botpress/botpress/issues/3186)) ([9cd9655](https://github.com/botpress/botpress/commit/9cd9655))
- **ui:** change to roboto ([#3187](https://github.com/botpress/botpress/issues/3187)) ([54b9ad1](https://github.com/botpress/botpress/commit/54b9ad1))
- **ui:** confirm dialog redesign ([#3208](https://github.com/botpress/botpress/issues/3208)) ([4e35865](https://github.com/botpress/botpress/commit/4e35865))

## [12.8.6](https://github.com/botpress/botpress/compare/v12.8.4...v12.8.6) (2020-04-26)

### Bug Fixes

- **analytics:** added export data as csv ([#3268](https://github.com/botpress/botpress/issues/3268)) ([febb07e](https://github.com/botpress/botpress/commit/febb07e))
- **bot-improvement:** search in dropdown & using radios ([#3260](https://github.com/botpress/botpress/issues/3260)) ([04da7bd](https://github.com/botpress/botpress/commit/04da7bd))
- **channel-web:** support html in truncate ([#3259](https://github.com/botpress/botpress/issues/3259)) ([daf2c6f](https://github.com/botpress/botpress/commit/daf2c6f))
- **core:** additional validations for bot & user id ([#3281](https://github.com/botpress/botpress/issues/3281)) ([f8a8bc6](https://github.com/botpress/botpress/commit/f8a8bc6))
- **core:** bring back previous flow/node ([#3271](https://github.com/botpress/botpress/issues/3271)) ([a524fa3](https://github.com/botpress/botpress/commit/a524fa3))
- **core:** clean paths ([#3277](https://github.com/botpress/botpress/issues/3277)) ([63891b5](https://github.com/botpress/botpress/commit/63891b5))
- **core:** fix debugging for sub-processes ([#3258](https://github.com/botpress/botpress/issues/3258)) ([765aeb9](https://github.com/botpress/botpress/commit/765aeb9))
- **core:** jwks auth for extenal users ([#3269](https://github.com/botpress/botpress/issues/3269)) ([193d22e](https://github.com/botpress/botpress/commit/193d22e))
- **core:** remove misleading error when using qna redirect ([#3256](https://github.com/botpress/botpress/issues/3256)) ([14faca3](https://github.com/botpress/botpress/commit/14faca3))
- **debugger:** expand inspector nodes easily ([#3278](https://github.com/botpress/botpress/issues/3278)) ([05f23e5](https://github.com/botpress/botpress/commit/05f23e5))
- **ndu:** ignore trigger with no conditions ([#3276](https://github.com/botpress/botpress/issues/3276)) ([bfe5a96](https://github.com/botpress/botpress/commit/bfe5a96))
- **nlu:** multiple fixes ([#3249](https://github.com/botpress/botpress/issues/3249)) ([1d438d8](https://github.com/botpress/botpress/commit/1d438d8))
- **nlu:** train only if not disabled ([c65a5e0](https://github.com/botpress/botpress/commit/c65a5e0))
- **skill-choice:** also match on choice value ([#3261](https://github.com/botpress/botpress/issues/3261)) ([272e8cf](https://github.com/botpress/botpress/commit/272e8cf))
- **studio:** actions menu sometime empty ([#3266](https://github.com/botpress/botpress/issues/3266)) ([8bc2ce2](https://github.com/botpress/botpress/commit/8bc2ce2))
- **webchat:** accessibility issues ([#3250](https://github.com/botpress/botpress/issues/3250)) ([f4b1809](https://github.com/botpress/botpress/commit/f4b1809))

## [12.8.5](https://github.com/botpress/botpress/compare/v12.8.4...v12.8.5) (2020-04-22)

### Bug Fixes

- **nlu:** multiple fixes ([#3249](https://github.com/botpress/botpress/issues/3249)) ([1d438d8](https://github.com/botpress/botpress/commit/1d438d8))
- **nlu:** train only if not disabled ([c65a5e0](https://github.com/botpress/botpress/commit/c65a5e0))
- **webchat:** accessibility issues ([#3250](https://github.com/botpress/botpress/issues/3250)) ([f4b1809](https://github.com/botpress/botpress/commit/f4b1809))

## [12.8.4](https://github.com/botpress/botpress/compare/v12.8.3...v12.8.4) (2020-04-20)

### Bug Fixes

- **core:** add informative logs for JSON parse error ([#2992](https://github.com/botpress/botpress/issues/2992)) ([f37d3a4](https://github.com/botpress/botpress/commit/f37d3a4))
- **core:** continue chain when one mw times out ([#3211](https://github.com/botpress/botpress/issues/3211)) ([e3a17a9](https://github.com/botpress/botpress/commit/e3a17a9))
- **core:** higher limit for node when packaged with binary ([#3236](https://github.com/botpress/botpress/issues/3236)) ([aac52b3](https://github.com/botpress/botpress/commit/aac52b3))
- **core:** provide additional port for botpress ([#3210](https://github.com/botpress/botpress/issues/3210)) ([f2486cd](https://github.com/botpress/botpress/commit/f2486cd))
- **core:** support multiple levels of sub flows ([#3198](https://github.com/botpress/botpress/issues/3198)) ([db3720c](https://github.com/botpress/botpress/commit/db3720c))
- **ndu:** add action go to node ([#3196](https://github.com/botpress/botpress/issues/3196)) ([e468edf](https://github.com/botpress/botpress/commit/e468edf))
- **ndu:** added min confidence configuration ([#3195](https://github.com/botpress/botpress/issues/3195)) ([1d984f6](https://github.com/botpress/botpress/commit/1d984f6))
- **ndu:** tweak for conditions ([#3194](https://github.com/botpress/botpress/issues/3194)) ([3cfe86f](https://github.com/botpress/botpress/commit/3cfe86f))
- **nlu:** default oos prediction when no intent ([#3240](https://github.com/botpress/botpress/issues/3240)) ([dfc389a](https://github.com/botpress/botpress/commit/dfc389a))
- **nlu:** flag to disable training on server ([#3242](https://github.com/botpress/botpress/issues/3242)) ([3323df8](https://github.com/botpress/botpress/commit/3323df8))
- **nlu:** ndu trigger for ambiguous intent ([040240e](https://github.com/botpress/botpress/commit/040240e))
- **shared:** delay toast failure & added other toasts ([#3228](https://github.com/botpress/botpress/issues/3228)) ([b97e069](https://github.com/botpress/botpress/commit/b97e069))

### Features

- **channel-web:** improve accessibility of webchat for screen readers ([#3218](https://github.com/botpress/botpress/issues/3218)) ([7f19073](https://github.com/botpress/botpress/commit/7f19073))
- **ndu:** activate trigger only on active workflow ([#3197](https://github.com/botpress/botpress/issues/3197)) ([f1403f9](https://github.com/botpress/botpress/commit/f1403f9))
- **nlu:** added entity condition & prorate for misunderstood ([#3193](https://github.com/botpress/botpress/issues/3193)) ([4eb2101](https://github.com/botpress/botpress/commit/4eb2101))
- **nlu:** ambiguity triggers ([#3191](https://github.com/botpress/botpress/issues/3191)) ([4a8fa4d](https://github.com/botpress/botpress/commit/4a8fa4d))

## [12.8.3](https://github.com/botpress/botpress/compare/v12.8.2...v12.8.3) (2020-04-10)

### Bug Fixes

- **studio:** issue [#3169](https://github.com/botpress/botpress/issues/3169) cannot create content when in a modal ([#3175](https://github.com/botpress/botpress/issues/3175)) ([8690e03](https://github.com/botpress/botpress/commit/8690e03))

## [12.8.2](https://github.com/botpress/botpress/compare/v12.8.0...v12.8.2) (2020-04-07)

### Bug Fixes

- **ndu:** action error when extracting slots ([#3152](https://github.com/botpress/botpress/issues/3152)) ([924a856](https://github.com/botpress/botpress/commit/924a856))
- **nlu:** allow no intent condition ([9f6c2d3](https://github.com/botpress/botpress/commit/9f6c2d3))
- **nlu:** misunderstood sort order ([7cc92ac](https://github.com/botpress/botpress/commit/7cc92ac))
- **nlu:** translation issues ([64ec952](https://github.com/botpress/botpress/commit/64ec952))
- **nlu-testing:** context checking ([7d60158](https://github.com/botpress/botpress/commit/7d60158))
- **studio:** module translations guideline ([#3146](https://github.com/botpress/botpress/issues/3146)) ([7820133](https://github.com/botpress/botpress/commit/7820133))
- **studio:** say something nodes not working ([#3153](https://github.com/botpress/botpress/issues/3153)) ([ad17210](https://github.com/botpress/botpress/commit/ad17210))
- **test:** temporary disable flaky test ([#3154](https://github.com/botpress/botpress/issues/3154)) ([5396e97](https://github.com/botpress/botpress/commit/5396e97))

### Features

- **translation:** add language selector & fixes ([#3148](https://github.com/botpress/botpress/issues/3148)) ([bbeb0c4](https://github.com/botpress/botpress/commit/bbeb0c4))

## [12.8.1](https://github.com/botpress/botpress/compare/v12.8.0...v12.8.1) (2020-04-03)

### Bug Fixes

- **ndu:** action error when extracting slots ([#3152](https://github.com/botpress/botpress/issues/3152)) ([924a856](https://github.com/botpress/botpress/commit/924a856))
- **nlu:** translation issues ([64ec952](https://github.com/botpress/botpress/commit/64ec952))
- **studio:** module translations guideline ([#3146](https://github.com/botpress/botpress/issues/3146)) ([7820133](https://github.com/botpress/botpress/commit/7820133))
- **studio:** say something nodes not working ([#3153](https://github.com/botpress/botpress/issues/3153)) ([ad17210](https://github.com/botpress/botpress/commit/ad17210))
- **test:** temporary disable flaky test ([#3154](https://github.com/botpress/botpress/issues/3154)) ([5396e97](https://github.com/botpress/botpress/commit/5396e97))

### Features

- **translation:** add language selector & fixes ([#3148](https://github.com/botpress/botpress/issues/3148)) ([bbeb0c4](https://github.com/botpress/botpress/commit/bbeb0c4))

# [12.8.0](https://github.com/botpress/botpress/compare/v12.7.2...v12.8.0) (2020-03-31)

### Bug Fixes

- **admin:** prevent duplicate bot name ([a7bcdce](https://github.com/botpress/botpress/commit/a7bcdce))
- **basic-skills:** use proper intent slots in slot filling ([635a100](https://github.com/botpress/botpress/commit/635a100))
- **build:** fix module packaging [#1831](https://github.com/botpress/botpress/issues/1831) ([8526975](https://github.com/botpress/botpress/commit/8526975))
- **build:** fix various typing issue ([afc9572](https://github.com/botpress/botpress/commit/afc9572))
- **channel-webchat:** added accessibility features ([6a7f5a5](https://github.com/botpress/botpress/commit/6a7f5a5))
- **cms:** clean-up unused media ([e21942b](https://github.com/botpress/botpress/commit/e21942b))
- **cms:** remove deleted media ([44adbb9](https://github.com/botpress/botpress/commit/44adbb9))
- **core:** fix module unload ([ab22315](https://github.com/botpress/botpress/commit/ab22315))
- **core:** token expiry & auto refresh ([#3075](https://github.com/botpress/botpress/issues/3075)) ([76513ff](https://github.com/botpress/botpress/commit/76513ff))
- **docs:** fix agent notification example [#1603](https://github.com/botpress/botpress/issues/1603) ([c94fbb4](https://github.com/botpress/botpress/commit/c94fbb4))
- **feedback:** remember feedback status ([9d72548](https://github.com/botpress/botpress/commit/9d72548))
- **feedback:** streamline feedback collection ([#3102](https://github.com/botpress/botpress/issues/3102)) ([e82ece3](https://github.com/botpress/botpress/commit/e82ece3))
- **flow:** allow no start node in new flow ([4c575fc](https://github.com/botpress/botpress/commit/4c575fc))
- **flow:** error with node execute crashes studio ([#3117](https://github.com/botpress/botpress/issues/3117)) ([611de2f](https://github.com/botpress/botpress/commit/611de2f))
- **flow:** show invalid transitions in red ([#3099](https://github.com/botpress/botpress/issues/3099)) ([c6d5b50](https://github.com/botpress/botpress/commit/c6d5b50))
- **intent:** topic update on change ([b8ad417](https://github.com/botpress/botpress/commit/b8ad417))
- **janitor:** timeout only get called when sessions are less than 250 ([252d42d](https://github.com/botpress/botpress/commit/252d42d))
- **kvs:** convert old kvs usage ([#3103](https://github.com/botpress/botpress/issues/3103)) ([9f94a95](https://github.com/botpress/botpress/commit/9f94a95))
- **ndu:** add label for raw condition ([#3106](https://github.com/botpress/botpress/issues/3106)) ([669d53d](https://github.com/botpress/botpress/commit/669d53d))
- **ndu:** always persist events ([fc1a874](https://github.com/botpress/botpress/commit/fc1a874))
- **ndu:** intent sync with topics ([#3096](https://github.com/botpress/botpress/issues/3096)) ([c831d57](https://github.com/botpress/botpress/commit/c831d57))
- **ndu:** minor fixes ([#3123](https://github.com/botpress/botpress/issues/3123)) ([5a481af](https://github.com/botpress/botpress/commit/5a481af))
- **ndu:** move dialog conditions to module definition ([#3069](https://github.com/botpress/botpress/issues/3069)) ([6dd5b86](https://github.com/botpress/botpress/commit/6dd5b86))
- **ndu:** removed redirects from QnA ([c33ac14](https://github.com/botpress/botpress/commit/c33ac14))
- **ndu:** scope engine by bots ([#3119](https://github.com/botpress/botpress/issues/3119)) ([ab36ead](https://github.com/botpress/botpress/commit/ab36ead))
- **ndu:** store details only for logged on users ([#3130](https://github.com/botpress/botpress/issues/3130)) ([1b51f30](https://github.com/botpress/botpress/commit/1b51f30))
- **ndu:** various stuff ([91cda90](https://github.com/botpress/botpress/commit/91cda90))
- **nlu:** 100% none confidence upper limit to ctx ([5d867d6](https://github.com/botpress/botpress/commit/5d867d6))
- **nlu:** entity watchers ([db357ec](https://github.com/botpress/botpress/commit/db357ec))
- **nlu:** fix for "cannot read languageCode of undefined" ([#3116](https://github.com/botpress/botpress/issues/3116)) ([3de5df8](https://github.com/botpress/botpress/commit/3de5df8))
- **nlu:** fixed spell checker ([7537a79](https://github.com/botpress/botpress/commit/7537a79))
- **nlu:** fuzzy radio ([af01d55](https://github.com/botpress/botpress/commit/af01d55))
- **nlu:** preds not iterable ([817d06f](https://github.com/botpress/botpress/commit/817d06f))
- **qna:** clearer message & bigger editor ([#3115](https://github.com/botpress/botpress/issues/3115)) ([583acd8](https://github.com/botpress/botpress/commit/583acd8))
- **qna:** content language ([#3113](https://github.com/botpress/botpress/issues/3113)) ([3609590](https://github.com/botpress/botpress/commit/3609590))
- **qna:** convert from category to multiple contexts ([7685002](https://github.com/botpress/botpress/commit/7685002))
- **studio:** better typings ([#3105](https://github.com/botpress/botpress/issues/3105)) ([b775e2b](https://github.com/botpress/botpress/commit/b775e2b))
- **studio:** restore double click for triggers ([#3118](https://github.com/botpress/botpress/issues/3118)) ([192b083](https://github.com/botpress/botpress/commit/192b083))
- **tests:** and update builtin contexts ([#3100](https://github.com/botpress/botpress/issues/3100)) ([f365d79](https://github.com/botpress/botpress/commit/f365d79))
- **topics:** better management & updates ([#3070](https://github.com/botpress/botpress/issues/3070)) ([59b10a7](https://github.com/botpress/botpress/commit/59b10a7))
- **topics:** sync elements with topic rename ([#3066](https://github.com/botpress/botpress/issues/3066)) ([dbbdf13](https://github.com/botpress/botpress/commit/dbbdf13))

### Features

- **channel-web:** add stylesheet to module config ([#3112](https://github.com/botpress/botpress/issues/3112)) ([98e3c43](https://github.com/botpress/botpress/commit/98e3c43))
- **ndu:** add number of triggers on wf list ([fe331e4](https://github.com/botpress/botpress/commit/fe331e4))
- **ndu:** add raw js condition ([b65db57](https://github.com/botpress/botpress/commit/b65db57))
- **ndu:** added info to debugger ([#3131](https://github.com/botpress/botpress/issues/3131)) ([a0e2e18](https://github.com/botpress/botpress/commit/a0e2e18))
- **ndu:** bot migration ([8103b48](https://github.com/botpress/botpress/commit/8103b48))
- **ndu:** display list of referenced workflows ([1a82e0c](https://github.com/botpress/botpress/commit/1a82e0c))
- **ndu:** display number of qna by topic ([#3097](https://github.com/botpress/botpress/issues/3097)) ([6655b18](https://github.com/botpress/botpress/commit/6655b18))
- **nlu:** adds POS capacity to French ([1513bb2](https://github.com/botpress/botpress/commit/1513bb2))
- **nlu:** ignore sys and pattern entities in ctx embedding ([4485acd](https://github.com/botpress/botpress/commit/4485acd))
- **nlu-testing:** edit test ([019d45c](https://github.com/botpress/botpress/commit/019d45c))
- **sdk:** sdk accessible via api ([83dde7a](https://github.com/botpress/botpress/commit/83dde7a))
- **slack:** updated to new api ([9b1f096](https://github.com/botpress/botpress/commit/9b1f096))
- **ui:** initial translation for admin & studio ([2de209f](https://github.com/botpress/botpress/commit/2de209f))

## [12.7.2](https://github.com/botpress/botpress/compare/v12.7.1...v12.7.2) (2020-03-28)

### Bug Fixes

- **admin:** possible null pointer ([#3073](https://github.com/botpress/botpress/issues/3073)) ([38ad436](https://github.com/botpress/botpress/commit/38ad436))
- **bot-info:** fix height issue on webchat ([812e925](https://github.com/botpress/botpress/commit/812e925))
- **core:** docker images async middleware ([44f41f9](https://github.com/botpress/botpress/commit/44f41f9))
- **core:** get router getPublicPath with subpath ([1ba3ee2](https://github.com/botpress/botpress/commit/1ba3ee2))
- **core:** return additional languages ([8cbb665](https://github.com/botpress/botpress/commit/8cbb665)), closes [#2704](https://github.com/botpress/botpress/issues/2704)
- **core:** return additional languages if nlu module is disabled ([ef24a43](https://github.com/botpress/botpress/commit/ef24a43))
- **core:** run migration easily ([0569f9a](https://github.com/botpress/botpress/commit/0569f9a))
- **module:** memoizing module config ([412a5c0](https://github.com/botpress/botpress/commit/412a5c0))
- **module-builder:** watch dies when there is an error ([c007331](https://github.com/botpress/botpress/commit/c007331))
- **slack:** disconnect websocket onBotUnmount ([0ea93f1](https://github.com/botpress/botpress/commit/0ea93f1))
- **studio:** occasional null pointer issue ([c066bb4](https://github.com/botpress/botpress/commit/c066bb4))
- **studio:** shortcut to save config ([1a34bff](https://github.com/botpress/botpress/commit/1a34bff))

### Features

- **nlu:** par of speech tagging for french ([8315d5c](https://github.com/botpress/botpress/commit/8315d5c))

## [12.7.1](https://github.com/botpress/botpress/compare/v12.7.0...v12.7.1) (2020-03-07)

### Bug Fixes

- **code-editor:** added button to switch editors ([7adad33](https://github.com/botpress/botpress/commit/7adad33))
- **config:** experimental flag instead of amazing ([b2f799d](https://github.com/botpress/botpress/commit/b2f799d))
- **core:** disable no repeat policy for new servers ([6580fcf](https://github.com/botpress/botpress/commit/6580fcf))
- **lang-server:** monitoring & debug fixed ([6c22a3c](https://github.com/botpress/botpress/commit/6c22a3c))
- **nlu:** compress and prune models ([2d5682d](https://github.com/botpress/botpress/commit/2d5682d))
- **nlu:** only extract necessary entities at training time ([9b162b1](https://github.com/botpress/botpress/commit/9b162b1))
- **tests:** try to fix flaky test ([a168d3a](https://github.com/botpress/botpress/commit/a168d3a))

# [12.7.0](https://github.com/botpress/botpress/compare/v12.6.0...v12.7.0) (2020-03-04)

### Bug Fixes

- **analytics:** add missing dep ([af6a6d0](https://github.com/botpress/botpress/commit/af6a6d0))
- **analytics:** various adjustments ([#3024](https://github.com/botpress/botpress/issues/3024)) ([9894993](https://github.com/botpress/botpress/commit/9894993))
- **channel-messenger:** fix initialization ([3c2f669](https://github.com/botpress/botpress/commit/3c2f669))
- **cluster:** wrong index when rebooting ([9cd5789](https://github.com/botpress/botpress/commit/9cd5789))
- **core:** better log message ([e1d2f47](https://github.com/botpress/botpress/commit/e1d2f47))
- **core:** check if worker exited properly before reboot routine ([60bdf42](https://github.com/botpress/botpress/commit/60bdf42))
- **core:** module was not unloaded correctly ([e61ab76](https://github.com/botpress/botpress/commit/e61ab76))
- **dev:** fix hash of undefined issue in studio and admin ([#3027](https://github.com/botpress/botpress/issues/3027)) ([c897686](https://github.com/botpress/botpress/commit/c897686))
- **dev:** fix missing module backend type check ([35f23a1](https://github.com/botpress/botpress/commit/35f23a1))
- **dev:** prevent watch core crash when building studio/admin ([29a5b04](https://github.com/botpress/botpress/commit/29a5b04))
- **module:** typings for sdk, knex & router ([#2995](https://github.com/botpress/botpress/issues/2995)) ([fc61430](https://github.com/botpress/botpress/commit/fc61430))
- **nlu:** add training debug events ([9670060](https://github.com/botpress/botpress/commit/9670060))
- **nlu:** alternate utterance ([3a01ce2](https://github.com/botpress/botpress/commit/3a01ce2))
- **nlu:** cancel active training sessions ondelete ([ea58da2](https://github.com/botpress/botpress/commit/ea58da2))
- **nlu:** cancel training ([3c69e7f](https://github.com/botpress/botpress/commit/3c69e7f))
- **nlu:** cancel training properly ([87fa972](https://github.com/botpress/botpress/commit/87fa972))
- **nlu:** clamp number of oos utterances ([d2f6e48](https://github.com/botpress/botpress/commit/d2f6e48))
- **nlu:** crf training on worker threads ([37c19f0](https://github.com/botpress/botpress/commit/37c19f0))
- **nlu:** debounce progress report ([ee47d24](https://github.com/botpress/botpress/commit/ee47d24))
- **nlu:** dont train bot if got deleted ([386f841](https://github.com/botpress/botpress/commit/386f841))
- **nlu:** extract entities for not none intents ([8dfe34d](https://github.com/botpress/botpress/commit/8dfe34d))
- **nlu:** prevent loading tagger at training time ([27f4d30](https://github.com/botpress/botpress/commit/27f4d30))
- **nlu:** properly report training progress ([1223b90](https://github.com/botpress/botpress/commit/1223b90))
- **nlu:** stric equality check ([7798797](https://github.com/botpress/botpress/commit/7798797))
- **nlu:** train ctx only when more than 1 ([1f84bb8](https://github.com/botpress/botpress/commit/1f84bb8))
- **pipeline:** fix approval filter ([fb417c4](https://github.com/botpress/botpress/commit/fb417c4))
- **realtime:** payload on a single line ([2f7a607](https://github.com/botpress/botpress/commit/2f7a607))
- **stage:** only super admins can edit stages ([0fec40e](https://github.com/botpress/botpress/commit/0fec40e))
- **studio:** fix image preview ([aa4c5a4](https://github.com/botpress/botpress/commit/aa4c5a4))
- **studio:** minor tweak to config ([2517f0e](https://github.com/botpress/botpress/commit/2517f0e))
- **test:** add delay before click ([f927c58](https://github.com/botpress/botpress/commit/f927c58))
- **tests:** add delay before starting tests ([#3002](https://github.com/botpress/botpress/issues/3002)) ([f8a2a87](https://github.com/botpress/botpress/commit/f8a2a87))
- **ui-studio:** change helper in create bot form ([c487e30](https://github.com/botpress/botpress/commit/c487e30))

### Features

- **admin:** Pipeline stage edit UI ([cdebf1e](https://github.com/botpress/botpress/commit/cdebf1e))
- **analytics:** v2 ([dcdd104](https://github.com/botpress/botpress/commit/dcdd104))
- **nlu:** load stopwords for given language ([51e98fc](https://github.com/botpress/botpress/commit/51e98fc))
- **nlu:** ml workers to speed up training ([8271623](https://github.com/botpress/botpress/commit/8271623))
- **nlu:** out of scope detection for english ([1ef2554](https://github.com/botpress/botpress/commit/1ef2554))
- **studio:** move bot config to the studio ([#2951](https://github.com/botpress/botpress/issues/2951)) ([59f35a2](https://github.com/botpress/botpress/commit/59f35a2))

## [12.6.1](https://github.com/botpress/botpress/compare/v12.6.0...v12.6.1) (2020-02-27)

### Bug Fixes

- **channel-messenger:** fix initialization ([3c2f669](https://github.com/botpress/botpress/commit/3c2f669))
- **core:** better log message ([e1d2f47](https://github.com/botpress/botpress/commit/e1d2f47))
- **core:** module was not unloaded correctly ([e61ab76](https://github.com/botpress/botpress/commit/e61ab76))
- **dev:** fix missing module backend type check ([6affc87](https://github.com/botpress/botpress/commit/6affc87))
- **module:** typings for sdk, knex & router ([#2995](https://github.com/botpress/botpress/issues/2995)) ([fc61430](https://github.com/botpress/botpress/commit/fc61430))
- **studio:** fix image preview ([c1c8685](https://github.com/botpress/botpress/commit/c1c8685))
- **tests:** add delay before starting tests ([#3002](https://github.com/botpress/botpress/issues/3002)) ([f8a2a87](https://github.com/botpress/botpress/commit/f8a2a87))
- **ui-studio:** change helper in create bot form ([8fff5f7](https://github.com/botpress/botpress/commit/8fff5f7))

# [12.6.0](https://github.com/botpress/botpress/compare/v12.5.0...v12.6.0) (2020-02-24)

### Bug Fixes

- **admin:** allow overwrite existing bot on import ([d02a5ed](https://github.com/botpress/botpress/commit/d02a5ed))
- **admin:** remove unused dep & fix ts ([c23be66](https://github.com/botpress/botpress/commit/c23be66))
- **bots:** normalized bot status & added filters ([a3c0d71](https://github.com/botpress/botpress/commit/a3c0d71))
- **cms:** fix image preview when name has space ([faabca3](https://github.com/botpress/botpress/commit/faabca3))
- **code-editor:** fix formatting on loading file ([#2965](https://github.com/botpress/botpress/issues/2965)) ([4406dc7](https://github.com/botpress/botpress/commit/4406dc7))
- **config:** remove misleading description for empty bot ([2fa1d9f](https://github.com/botpress/botpress/commit/2fa1d9f))
- **core:** added more logging ([581758d](https://github.com/botpress/botpress/commit/581758d))
- **core:** better audit traces ([6e9d082](https://github.com/botpress/botpress/commit/6e9d082))
- **core:** creating schema when missing ([939d27e](https://github.com/botpress/botpress/commit/939d27e))
- **core:** id validation on bot admin actions ([d55d6c8](https://github.com/botpress/botpress/commit/d55d6c8))
- **core:** limit number of concurrent bot mount ([17c69e4](https://github.com/botpress/botpress/commit/17c69e4))
- **docs:** before_container takes an array ([ac94ff6](https://github.com/botpress/botpress/commit/ac94ff6))
- **docs:** changes ([54e5232](https://github.com/botpress/botpress/commit/54e5232))
- **docs:** fix link to "hosting language server" ([e9a68b2](https://github.com/botpress/botpress/commit/e9a68b2))
- **docs:** removed on page load section ([46f21a5](https://github.com/botpress/botpress/commit/46f21a5))
- **misunderstood:** applying changed retrain the nlu ([6ea2d3f](https://github.com/botpress/botpress/commit/6ea2d3f))
- **ui-studio:** add node highlight after redirect ([35a8d6d](https://github.com/botpress/botpress/commit/35a8d6d))
- **ui-studio:** fix highlighting nodes by URL-hash ([0ed2568](https://github.com/botpress/botpress/commit/0ed2568))

### Features

- **admin:** basic module management ([#2917](https://github.com/botpress/botpress/issues/2917)) ([2370a53](https://github.com/botpress/botpress/commit/2370a53))
- **cms:** link to usage elements ([#2957](https://github.com/botpress/botpress/issues/2957)) ([eeff521](https://github.com/botpress/botpress/commit/eeff521))
- **core:** support for redis cluster ([78acae7](https://github.com/botpress/botpress/commit/78acae7))
- **hook:** bot-scoped hooks ([fee2cea](https://github.com/botpress/botpress/commit/fee2cea))
- **logs:** new log page & additional bot monitoring ([a945944](https://github.com/botpress/botpress/commit/a945944))
- **ui-shared:** shared component library ([#2954](https://github.com/botpress/botpress/issues/2954)) ([5cbb50b](https://github.com/botpress/botpress/commit/5cbb50b))

# [12.5.0](https://github.com/botpress/botpress/compare/v12.4.2...v12.5.0) (2020-02-03)

### Bug Fixes

- **admin:** fix error message for non super admins ([482fd5b](https://github.com/botpress/botpress/commit/482fd5b))
- **builtin:** handle markdown property ([0f3f071](https://github.com/botpress/botpress/commit/0f3f071))
- **cms:** markdown property ([1a52d8b](https://github.com/botpress/botpress/commit/1a52d8b))
- **code-editor:** ignore bot mount errors ([79d7522](https://github.com/botpress/botpress/commit/79d7522))
- **code-editor:** module schemas ([0d14dd6](https://github.com/botpress/botpress/commit/0d14dd6))
- **core:** add module name when bot fails to mount ([8333f81](https://github.com/botpress/botpress/commit/8333f81))
- **core:** added missing env var definition in global defs ([8e4d24c](https://github.com/botpress/botpress/commit/8e4d24c))
- **core:** better error message when bot fails to load ([fa2cd25](https://github.com/botpress/botpress/commit/fa2cd25))
- **core:** clear message when the workspace property is missing ([7c881bf](https://github.com/botpress/botpress/commit/7c881bf))
- **core:** missing import ([6dc85be](https://github.com/botpress/botpress/commit/6dc85be))
- **deps:** rollback react ([069e806](https://github.com/botpress/botpress/commit/069e806))
- **flow:** better fix for links refresh ([b2e804a](https://github.com/botpress/botpress/commit/b2e804a))
- **flow:** lag issue with a lot of content ([e372d5b](https://github.com/botpress/botpress/commit/e372d5b))
- **flow:** no update when read only ([8dd1600](https://github.com/botpress/botpress/commit/8dd1600))
- **nlu:** real spaces in list entity extraction ([1df97b0](https://github.com/botpress/botpress/commit/1df97b0))
- **nlu-testing:** none compare ([f508fd6](https://github.com/botpress/botpress/commit/f508fd6))
- code-style ([b10daec](https://github.com/botpress/botpress/commit/b10daec))
- **qna:** fix redirection and incorrect message ([38518be](https://github.com/botpress/botpress/commit/38518be))
- **qna:** update items on renaming flow ([88d4049](https://github.com/botpress/botpress/commit/88d4049))
- **settings:** vs code settings for ts intellisens ([394da8f](https://github.com/botpress/botpress/commit/394da8f))
- **studio:** allow access to code editor when bot unmounted ([d0b9b92](https://github.com/botpress/botpress/commit/d0b9b92))

### Features

- **channel:** smooch integration ([2ce1ccb](https://github.com/botpress/botpress/commit/2ce1ccb))
- **channel-web:** allow setting webchat locale ([3d9c7b0](https://github.com/botpress/botpress/commit/3d9c7b0))
- **code-editor:** raw editor to manage any files on the bpfs ([76c271e](https://github.com/botpress/botpress/commit/76c271e))
- **core:** bot health monitor for clusters ([7a8b6b6](https://github.com/botpress/botpress/commit/7a8b6b6))
- **core:** reboot individual servers ([9d2a7bf](https://github.com/botpress/botpress/commit/9d2a7bf))
- **nlu:** merge latin token only if oov ([4421e21](https://github.com/botpress/botpress/commit/4421e21))
- **NLU:** alternate input to account for typos ([648d20e](https://github.com/botpress/botpress/commit/648d20e))
- **NLU:** only merge latin tokens when OOV ([0c8e17f](https://github.com/botpress/botpress/commit/0c8e17f))
- **nlu-testing:** batch run ([a61024a](https://github.com/botpress/botpress/commit/a61024a))
- **nlu-testing:** run & delete single test ([f27a1e5](https://github.com/botpress/botpress/commit/f27a1e5))
- **studio:** add Content Usage count in CMS ([4d99101](https://github.com/botpress/botpress/commit/4d99101))

## [12.4.2](https://github.com/botpress/botpress/compare/v12.4.1...v12.4.2) (2020-01-22)

### Bug Fixes

- **code-editor:** fix config schemas ([4170e34](https://github.com/botpress/botpress/commit/4170e34))
- **code-editor:** single selection ([aab4580](https://github.com/botpress/botpress/commit/aab4580))
- **core:** pool issue with knex and transactions ([79f3596](https://github.com/botpress/botpress/commit/79f3596))
- **docs:** add hint about Content-Type header ([d7b6af7](https://github.com/botpress/botpress/commit/d7b6af7))
- **nlu:** exclude NaN vectors ([fe44ac2](https://github.com/botpress/botpress/commit/fe44ac2))
- **nlu:** handling of spacing inside slots ([035b0fe](https://github.com/botpress/botpress/commit/035b0fe))

## [12.4.1](https://github.com/botpress/botpress/compare/v12.4.0...v12.4.1) (2020-01-21)

### Bug Fixes

- **channel-web:** faster loading on embedded mode ([dd9864d](https://github.com/botpress/botpress/commit/dd9864d))
- **core:** redisio to use native promises ([2c2beb0](https://github.com/botpress/botpress/commit/2c2beb0))
- **core:** user is stuck when a transition is missing ([0a98133](https://github.com/botpress/botpress/commit/0a98133))
- **nlu:** empty dataset validation ([30fd61f](https://github.com/botpress/botpress/commit/30fd61f))
- specify accept extensions in file upload ([2f05161](https://github.com/botpress/botpress/commit/2f05161))
- **qna:** fix redirect to flow ([b1bfb4c](https://github.com/botpress/botpress/commit/b1bfb4c))
- **studio:** keep randomId on choice edit (resolve [#2813](https://github.com/botpress/botpress/issues/2813)) ([77a4206](https://github.com/botpress/botpress/commit/77a4206))

# [12.4.0](https://github.com/botpress/botpress/compare/v12.3.3...v12.4.0) (2020-01-16)

### Bug Fixes

- **admin:** version check ([a8b6112](https://github.com/botpress/botpress/commit/a8b6112))
- **core:** event collector retry failed messages ([21e2db9](https://github.com/botpress/botpress/commit/21e2db9))
- **nlu:** ignore special char in classification ([962b73a](https://github.com/botpress/botpress/commit/962b73a))
- **nlu:** on create intent, raw name is used as first utterance ([3573b27](https://github.com/botpress/botpress/commit/3573b27))
- **nlu:** token.isWord ([2e06041](https://github.com/botpress/botpress/commit/2e06041))

### Features

- **channel-web:** allow changing language of UI ([ea96b0c](https://github.com/botpress/botpress/commit/ea96b0c))
- **cms:** implement image preview ([a54ef1f](https://github.com/botpress/botpress/commit/a54ef1f))
- **nlu:** added lite editor for NLU module ([293a0c6](https://github.com/botpress/botpress/commit/293a0c6))
- **nlu:** cross validation ([e408f05](https://github.com/botpress/botpress/commit/e408f05))
- **nlu:** entity can be renamed and duplicated ([d315534](https://github.com/botpress/botpress/commit/d315534))
- **nlu:** extract route ([05e3db0](https://github.com/botpress/botpress/commit/05e3db0))
- **nlu-testing:** basic import tests from csv ([0676c26](https://github.com/botpress/botpress/commit/0676c26))
- **nlu-testing:** save tests ([a4cebdb](https://github.com/botpress/botpress/commit/a4cebdb))
- **studio:** implement image preview ([4015fe7](https://github.com/botpress/botpress/commit/4015fe7))

## [12.3.3](https://github.com/botpress/botpress/compare/v12.3.2...v12.3.3) (2020-01-13)

### Bug Fixes

- correct spelling mistakes ([f229391](https://github.com/botpress/botpress/commit/f229391))
- **admin:** fix docker image link ([9a8b254](https://github.com/botpress/botpress/commit/9a8b254))
- show user-friendly flow name ([1610164](https://github.com/botpress/botpress/commit/1610164))
- **admin:** fix docker image link ([96056b0](https://github.com/botpress/botpress/commit/96056b0))
- **channel-web:** visit event is sent only when chat is open ([7c727de](https://github.com/botpress/botpress/commit/7c727de))
- **code-editor:** only one of enabled or disabled ([a177992](https://github.com/botpress/botpress/commit/a177992))
- **qna:** correct pagination on first page ([eb7f64f](https://github.com/botpress/botpress/commit/eb7f64f))
- **qna:** react-select to be completely visible ([ca52fc2](https://github.com/botpress/botpress/commit/ca52fc2))
- **studio:** don't show reselection of checkboxes ([23fd495](https://github.com/botpress/botpress/commit/23fd495))
- **studio:** show user-friendly flow name ([3c76e50](https://github.com/botpress/botpress/commit/3c76e50))

## [12.3.2](https://github.com/botpress/botpress/compare/v12.3.1...v12.3.2) (2020-01-08)

### Bug Fixes

- **admin:** bigger timeout for bots & stage change ([d54b4e3](https://github.com/botpress/botpress/commit/d54b4e3))
- **bots:** issue when promoting bot with autorevision ([9db4960](https://github.com/botpress/botpress/commit/9db4960))
- **build:** remove dupes on changelog & fix command ([081739a](https://github.com/botpress/botpress/commit/081739a))
- **channel-web:** better text for "new messages" ([60f30d3](https://github.com/botpress/botpress/commit/60f30d3))
- **channel-web:** better text for "new messages", and better grammar ([ecc8de7](https://github.com/botpress/botpress/commit/ecc8de7))
- **channel-web:** group messages based on full_name ([#2718](https://github.com/botpress/botpress/issues/2718)) ([b3d964a](https://github.com/botpress/botpress/commit/b3d964a))
- **channel-web:** login form translation ([fc7f8c4](https://github.com/botpress/botpress/commit/fc7f8c4))
- **core:** correct checking for empty flow ([13d977b](https://github.com/botpress/botpress/commit/13d977b))
- **core:** ghost ENOENT error code ([db3fa28](https://github.com/botpress/botpress/commit/db3fa28))
- **core:** handle case of no previous flow ([2057a46](https://github.com/botpress/botpress/commit/2057a46))
- **core:** remove folders in Windows ([95bbb47](https://github.com/botpress/botpress/commit/95bbb47))
- **docs:** remove change log duplicates ([8275425](https://github.com/botpress/botpress/commit/8275425))
- **examples:** update interbot examples ([63eb612](https://github.com/botpress/botpress/commit/63eb612))
- **nlu:** filter inputs to have unique IDs ([cdadc75](https://github.com/botpress/botpress/commit/cdadc75))
- **nlu:** load latest model when model is invalid at predict time ([749a751](https://github.com/botpress/botpress/commit/749a751))
- **nlu:** model loading lock ([eb2505e](https://github.com/botpress/botpress/commit/eb2505e))
- **nlu:** predict with multiple contexts ([2d97f73](https://github.com/botpress/botpress/commit/2d97f73))
- **nlu:** use global ctx if empty predicitons ([88d6311](https://github.com/botpress/botpress/commit/88d6311))
- **studio:** always show selection of current flow ([19872e5](https://github.com/botpress/botpress/commit/19872e5))
- **studio:** correct documentation URL ([73b3422](https://github.com/botpress/botpress/commit/73b3422))
- **studio:** don't allow same name in two nodes ([be48b7e](https://github.com/botpress/botpress/commit/be48b7e))
- **studio:** have unique IDs ([edf6bb4](https://github.com/botpress/botpress/commit/edf6bb4))
- **studio:** remove double clicking message ([50e8f06](https://github.com/botpress/botpress/commit/50e8f06))
- **studio:** remove double clicking on diagram ([08c4d57](https://github.com/botpress/botpress/commit/08c4d57))
- **webchat:** Arabic word misspelling ([da19228](https://github.com/botpress/botpress/commit/da19228))
- **webchat:** proper login form arabic translation ([#2737](https://github.com/botpress/botpress/issues/2737)) ([96bcfa4](https://github.com/botpress/botpress/commit/96bcfa4))
- replace only file extensions ([85c0283](https://github.com/botpress/botpress/commit/85c0283))
- spelling mistakes in code ([cc9f950](https://github.com/botpress/botpress/commit/cc9f950))

## [12.3.1](https://github.com/botpress/botpress/compare/v12.3.0...v12.3.1) (2019-12-17)

### Bug Fixes

- **channel-web:** added missing reference logic on frontend ([b7939eb](https://github.com/botpress/botpress/commit/b7939eb))
- **nlu:** lowercase tokens on vectorize ([2022774](https://github.com/botpress/botpress/commit/2022774))
- **nlu:** lowercase while getting word vectors ([14c05aa](https://github.com/botpress/botpress/commit/14c05aa))
- **studio:** rename only when flow name is changed ([459c844](https://github.com/botpress/botpress/commit/459c844))
- various spelling mistakes ([8b185a3](https://github.com/botpress/botpress/commit/8b185a3))

### Features

- **channel-web:** bot can have different avatars for different messages ([ab9215e](https://github.com/botpress/botpress/commit/ab9215e))

# [12.3.0](https://github.com/botpress/botpress/compare/v12.2.3...v12.3.0) (2019-12-12)

### Bug Fixes

- **admin:** fix admin for users running on IE ([80872bd](https://github.com/botpress/botpress/commit/80872bd))
- **admin:** import bot in the current workspace ([876329c](https://github.com/botpress/botpress/commit/876329c))
- **admin:** lowercase check ([f229469](https://github.com/botpress/botpress/commit/f229469))
- **channel-web:** disable typing animations to prevent flicker ([73ecf76](https://github.com/botpress/botpress/commit/73ecf76))
- **channel-web:** prevent user name from being undefined ([5261948](https://github.com/botpress/botpress/commit/5261948))
- **code-editor:** missing sync actions locally ([c3c50a2](https://github.com/botpress/botpress/commit/c3c50a2))
- **core:** requiring actions directly from bpfs ([16a2841](https://github.com/botpress/botpress/commit/16a2841))
- **core:** respect env http_proxy and no_proxy ([ef50d5e](https://github.com/botpress/botpress/commit/ef50d5e))
- **core:** sync is done correctly when enabling bpfs first time ([20c8fba](https://github.com/botpress/botpress/commit/20c8fba))
- **flow:** fix part 2 for the choice skill transitions ([c49ebdb](https://github.com/botpress/botpress/commit/c49ebdb))
- **misunderstood:** eslint styling issues ([4081df5](https://github.com/botpress/botpress/commit/4081df5))
- **module:** ran prettier & some adjustments ([9419360](https://github.com/botpress/botpress/commit/9419360))
- **nlu:** exact matching ([678f247](https://github.com/botpress/botpress/commit/678f247))
- **nlu:** fix circular issue when redis enabled ([7a4da94](https://github.com/botpress/botpress/commit/7a4da94))
- **nlu:** original case in entity exact score ([7827e91](https://github.com/botpress/botpress/commit/7827e91))
- **nlu:** update form fields on entity Id change ([b754037](https://github.com/botpress/botpress/commit/b754037))
- **nlu:** added value to slot ([68e8c7f](https://github.com/botpress/botpress/commit/68e8c7f))
- **nlu-testing:** filter slots conditions ([fd8e356](https://github.com/botpress/botpress/commit/fd8e356))
- **skill-choice:** consider only selected options ([1fead4a](https://github.com/botpress/botpress/commit/1fead4a))

### Features

- **nlu:** added POS tagger as experimental feature for English ([86c62ed](https://github.com/botpress/botpress/commit/86c62ed))

## [12.2.3](https://github.com/botpress/botpress/compare/v12.2.2...v12.2.3) (2019-11-19)

### Bug Fixes

- **admin:** comparing email lower case ([75801e9](https://github.com/botpress/botpress/commit/75801e9))
- **admin:** create user button grayed out ([ae1ba0f](https://github.com/botpress/botpress/commit/ae1ba0f))
- **admin:** releases not fetched automatically ([0347b94](https://github.com/botpress/botpress/commit/0347b94))
- **channel-web:** issue on ie11 with proxy ([b0cbc67](https://github.com/botpress/botpress/commit/b0cbc67))
- **cms:** using default lang when current is not set ([0697ac9](https://github.com/botpress/botpress/commit/0697ac9))
- **code-editor:** refactor & improvements ([22ef2de](https://github.com/botpress/botpress/commit/22ef2de))
- **core:** clearing state from redis when reset session ([34ecaed](https://github.com/botpress/botpress/commit/34ecaed))
- **core:** email case insensitive ([7629a79](https://github.com/botpress/botpress/commit/7629a79))
- **core:** fix transition with intent is ([9a3ea12](https://github.com/botpress/botpress/commit/9a3ea12))
- **core:** minor adjustments ([ed04f7d](https://github.com/botpress/botpress/commit/ed04f7d))
- **core:** startup error with all debug enabled ([a2d2f57](https://github.com/botpress/botpress/commit/a2d2f57))
- **core:** using redis for better io with user state ([bf1f0bf](https://github.com/botpress/botpress/commit/bf1f0bf))
- **skill-choice:** prevent collision between choice nodes ([c7805c3](https://github.com/botpress/botpress/commit/c7805c3))
- **studio:** bot status is a bit more clear ([a069706](https://github.com/botpress/botpress/commit/a069706))
- **webchat:** correctly scroll down when necessary ([ac909aa](https://github.com/botpress/botpress/commit/ac909aa))
- **webchat:** option to swap localStorage to sessionStorage ([3436030](https://github.com/botpress/botpress/commit/3436030))

### Features

- **cms:** import/export of content ([4ae2514](https://github.com/botpress/botpress/commit/4ae2514))
- **code-editor:** added code samples that can be easily copied ([86e289e](https://github.com/botpress/botpress/commit/86e289e))
- **code-editor:** added static examples ([7212856](https://github.com/botpress/botpress/commit/7212856))
- **flow:** quick node linking on the flow editor ([b776285](https://github.com/botpress/botpress/commit/b776285))
- **nlu:** added case sensitivity for entities ([409acf3](https://github.com/botpress/botpress/commit/409acf3))
- **nlu:** added pattern entity examples ([ba60a96](https://github.com/botpress/botpress/commit/ba60a96))
- **nlu:** fuzzy tolerance ([a25a1c4](https://github.com/botpress/botpress/commit/a25a1c4))
- **nlu:** new list entities ui ([18dfaa1](https://github.com/botpress/botpress/commit/18dfaa1))

## [12.2.2](https://github.com/botpress/botpress/compare/v12.2.1...v12.2.2) (2019-11-08)

### Bug Fixes

- **core:** avoid new debug instance creation ([c602ad5](https://github.com/botpress/botpress/commit/c602ad5))
- **core:** caching required files in actions and hooks ([069d013](https://github.com/botpress/botpress/commit/069d013))
- **core:** global actions/hooks executed outside nodevm ([2ef2e29](https://github.com/botpress/botpress/commit/2ef2e29))
- **core:** process args were not memoized correctly ([1e5c2e6](https://github.com/botpress/botpress/commit/1e5c2e6))
- **flow:** minor improvements ([4543d2d](https://github.com/botpress/botpress/commit/4543d2d))
- **nlu:** create none intent properly ([b57a610](https://github.com/botpress/botpress/commit/b57a610))

### Features

- **nlu:** filter predictions ([b460c8b](https://github.com/botpress/botpress/commit/b460c8b))
- **nlu:** re introduced hard none threshold ([e698de9](https://github.com/botpress/botpress/commit/e698de9))

## [12.2.1](https://github.com/botpress/botpress/compare/v12.2.0...v12.2.1) (2019-11-06)

### Bug Fixes

- **analytics:** fix analytics insertion of long text ([2f5ab73](https://github.com/botpress/botpress/commit/2f5ab73))
- **core:** catalina build ([35db0d6](https://github.com/botpress/botpress/commit/35db0d6))
- **flow:** identifying timeout flow & bigger archive timeout ([80ac8e1](https://github.com/botpress/botpress/commit/80ac8e1))
- **nlu:** moved fs calls to async ([0224002](https://github.com/botpress/botpress/commit/0224002))
- **nlu:** progress ([54cda62](https://github.com/botpress/botpress/commit/54cda62))

### Features

- **admin:** display when a new version available ([1327eb9](https://github.com/botpress/botpress/commit/1327eb9))
- **nlu:** cancel training ([59058c3](https://github.com/botpress/botpress/commit/59058c3))

# [12.2.0](https://github.com/botpress/botpress/compare/v12.1.6...v12.2.0) (2019-10-28)

### Bug Fixes

- **admin:** add option to copy shortlink easily ([6e99b9b](https://github.com/botpress/botpress/commit/6e99b9b))
- **admin:** better ux when unauthorized ([66832ea](https://github.com/botpress/botpress/commit/66832ea))
- **admin:** cleanup of permissions ([cacadac](https://github.com/botpress/botpress/commit/cacadac))
- **admin:** fixed create date & added picture url ([c9a2321](https://github.com/botpress/botpress/commit/c9a2321))
- **admin:** minor adjustments ([d44b251](https://github.com/botpress/botpress/commit/d44b251))
- **admin:** more work toward chat users ([1f3fdd7](https://github.com/botpress/botpress/commit/1f3fdd7))
- **admin:** redirect if no permissions ([cf4a500](https://github.com/botpress/botpress/commit/cf4a500))
- **admin:** separate btn to copy clipboard & fix rollback ([c3abf10](https://github.com/botpress/botpress/commit/c3abf10))
- **admin:** unified UI for admin panel ([a209fc0](https://github.com/botpress/botpress/commit/a209fc0))
- **admin:** updated bots view & implemented chat users ([8015434](https://github.com/botpress/botpress/commit/8015434))
- **admin:** various fixes ([06f1321](https://github.com/botpress/botpress/commit/06f1321))
- **admin:** workspace switcher ([8ac8f0d](https://github.com/botpress/botpress/commit/8ac8f0d))
- **auth:** chat user base & various adjustments ([9e24771](https://github.com/botpress/botpress/commit/9e24771))
- **auth:** display menu to choose auth strategy ([d18a36e](https://github.com/botpress/botpress/commit/d18a36e))
- **build:** fix damn lib again and again ([0928e23](https://github.com/botpress/botpress/commit/0928e23))
- **channel-web:** implementing correctly an old migration ([f710589](https://github.com/botpress/botpress/commit/f710589))
- **checklist:** add sticky session verification ([422f9fe](https://github.com/botpress/botpress/commit/422f9fe))
- **code-editor:** added prettier formatting ([65aee67](https://github.com/botpress/botpress/commit/65aee67))
- **core:** better support for axios errors ([9030342](https://github.com/botpress/botpress/commit/9030342))
- **core:** env var to easily skip problematic migrations ([11a89cd](https://github.com/botpress/botpress/commit/11a89cd))
- **core:** fix axios config to use local url ([1fda878](https://github.com/botpress/botpress/commit/1fda878))
- **core:** small changes to botpress fatal errors ([10dc57c](https://github.com/botpress/botpress/commit/10dc57c))
- **debugger:** better handling of unauthorized users ([8c49e3a](https://github.com/botpress/botpress/commit/8c49e3a))
- **debugger:** removed capitalized letter from top intent ([6d5915b](https://github.com/botpress/botpress/commit/6d5915b))
- **dev:** added package command & fixed package name ([2f0ad8f](https://github.com/botpress/botpress/commit/2f0ad8f))
- **dev:** faster build for studio and admin ([efc31ef](https://github.com/botpress/botpress/commit/efc31ef))
- **e2e:** ignoring non-api requests ([e4d39c1](https://github.com/botpress/botpress/commit/e4d39c1))
- **modules:** fixed module entry points ([a872630](https://github.com/botpress/botpress/commit/a872630))
- **nlu:** all nodes load previously trained models ([38b2450](https://github.com/botpress/botpress/commit/38b2450))
- **nlu:** discrete number of tokens in none utt ([29b9284](https://github.com/botpress/botpress/commit/29b9284))
- **nlu:** empty exact match ([a011412](https://github.com/botpress/botpress/commit/a011412))
- **nlu:** error handling in svm trainer ([c651cd8](https://github.com/botpress/botpress/commit/c651cd8))
- **nlu:** moved training status to info ([2f8c60f](https://github.com/botpress/botpress/commit/2f8c60f))
- **nlu:** prevent useless training ([2a60384](https://github.com/botpress/botpress/commit/2a60384))
- **nlu:** remove dead configs ([8893ff6](https://github.com/botpress/botpress/commit/8893ff6))
- **nlu:** remove none intent from exactmatch ([5b7f6d4](https://github.com/botpress/botpress/commit/5b7f6d4))
- **nlu:** removed dead binaries ([17b3789](https://github.com/botpress/botpress/commit/17b3789))
- **nlu:** train msg id for cluster mode ([c0ee85e](https://github.com/botpress/botpress/commit/c0ee85e))
- **nlu2:** feature always wrong at predict time ([e6d79dc](https://github.com/botpress/botpress/commit/e6d79dc))
- **nlu2:** slots & trailing space corner case ([d06f215](https://github.com/botpress/botpress/commit/d06f215))
- **nlu2:** slots space feature ([5fc47da](https://github.com/botpress/botpress/commit/5fc47da))
- **profile:** updated ux with profile and password ([ae3e785](https://github.com/botpress/botpress/commit/ae3e785))
- **qna:** error when no categories defined ([3e8159d](https://github.com/botpress/botpress/commit/3e8159d))
- **skill:** added icon, typings & some other stuff ([54f9354](https://github.com/botpress/botpress/commit/54f9354))
- **studio:** displaying skill icons in flow nodes ([ba8adff](https://github.com/botpress/botpress/commit/ba8adff))
- **studio:** fix backspace issue ([6462b05](https://github.com/botpress/botpress/commit/6462b05))
- **studio:** fix issue in flow with skills/redux ([ad14cb9](https://github.com/botpress/botpress/commit/ad14cb9))
- **studio:** using same flags as admin ([553f457](https://github.com/botpress/botpress/commit/553f457))
- **tests:** small adjustment to tests ([602996b](https://github.com/botpress/botpress/commit/602996b))
- **ux:** prevent click close dialog ([100594d](https://github.com/botpress/botpress/commit/100594d))
- **webchat:** added config to expose the store ([1148505](https://github.com/botpress/botpress/commit/1148505))

### Features

- **admin:** enable features from ui ([5c33ed2](https://github.com/botpress/botpress/commit/5c33ed2))
- **admin:** filter bots ([625aac3](https://github.com/botpress/botpress/commit/625aac3))
- **admin:** new layout for super admins ([0a47783](https://github.com/botpress/botpress/commit/0a47783))
- **admin:** partial workspace management ([6d0ba1a](https://github.com/botpress/botpress/commit/6d0ba1a))
- **auth:** authentication for chat users & rollout strategies ([6d0268b](https://github.com/botpress/botpress/commit/6d0268b))
- **channel-web:** add arabic translations ([bbe669a](https://github.com/botpress/botpress/commit/bbe669a))
- **channel-web:** add Russian and Ukrainian translations ([1186c16](https://github.com/botpress/botpress/commit/1186c16))
- **core:** added page for latest releases ([32b5b2b](https://github.com/botpress/botpress/commit/32b5b2b))
- **core:** checklist for production usage ([6ffc58e](https://github.com/botpress/botpress/commit/6ffc58e))
- **hitl:** added features, fixes & refactor ([a8115da](https://github.com/botpress/botpress/commit/a8115da))
- **nlu:** distributed model training ([21295bd](https://github.com/botpress/botpress/commit/21295bd))
- **nlu:** New intent editor ([f4b3999](https://github.com/botpress/botpress/commit/f4b3999))
- **nlu:** UI revamp into 12-1-6 ([4392eef](https://github.com/botpress/botpress/commit/4392eef))
- **sdk:** added distributed methods ([84c305d](https://github.com/botpress/botpress/commit/84c305d))
- **studio:** various improvements to flow builder ([267cea1](https://github.com/botpress/botpress/commit/267cea1))

## [12.1.6](https://github.com/botpress/botpress/compare/v12.1.5...v12.1.6) (2019-10-04)

### Bug Fixes

- **hitl:** issue on some version of postgres ([e18f674](https://github.com/botpress/botpress/commit/e18f674))
- **module:** enforces bot-scoped config when global is not wanted ([50bbbcf](https://github.com/botpress/botpress/commit/50bbbcf))
- **nlu:** added hyphens to latin ([0cb19a6](https://github.com/botpress/botpress/commit/0cb19a6))
- **nlu:** fix "isLoaded of undefined" on model load ([082c6ad](https://github.com/botpress/botpress/commit/082c6ad))
- **qna:** issue with cms content & intent not being deleted ([7df80e6](https://github.com/botpress/botpress/commit/7df80e6))
- **skill-email:** fix element rendering & config documentation ([f0997b0](https://github.com/botpress/botpress/commit/f0997b0))
- **studio:** config status not visible & bp-ui changes ([ec7fb3f](https://github.com/botpress/botpress/commit/ec7fb3f))

## [12.1.5](https://github.com/botpress/botpress/compare/v12.1.3...v12.1.5) (2019-10-01)

### Bug Fixes

- **bpfs:** fixed issues caused by legacy logic ([fa89276](https://github.com/botpress/botpress/commit/fa89276))
- **bpfs:** various fixes due to legacy logic ([4108970](https://github.com/botpress/botpress/commit/4108970))
- **channel-web:** fix container width on init ([5ee2f1d](https://github.com/botpress/botpress/commit/5ee2f1d))
- **channel-web:** fix for intermittent issue with emulator ([c148596](https://github.com/botpress/botpress/commit/c148596))
- **channel-web:** fix output of conversation log ([53982ab](https://github.com/botpress/botpress/commit/53982ab))
- **channel-web:** re-added google analytics ([0fe8fce](https://github.com/botpress/botpress/commit/0fe8fce))
- **cluster:** broadcasting reboot to all nodes ([decd505](https://github.com/botpress/botpress/commit/decd505))
- **config:** clear hash on first start & ignore dynamic props ([7d8d5b7](https://github.com/botpress/botpress/commit/7d8d5b7))
- **converse:** ability to change max message length ([aa0a612](https://github.com/botpress/botpress/commit/aa0a612))
- **core:** added multi-thread support for heavy tasks ([d2b30e4](https://github.com/botpress/botpress/commit/d2b30e4))
- **core:** debug logs are not saved to file output ([e328b49](https://github.com/botpress/botpress/commit/e328b49))
- **core:** dialog anti-loop ([d1de885](https://github.com/botpress/botpress/commit/d1de885))
- **core:** fix issue with server reboot ([077dbc9](https://github.com/botpress/botpress/commit/077dbc9))
- **core:** fix permissions view ([23eea72](https://github.com/botpress/botpress/commit/23eea72))
- **core:** fixed typings and missing await for sendevent ([4c7f937](https://github.com/botpress/botpress/commit/4c7f937))
- **core:** on action not found error ([19e9e1d](https://github.com/botpress/botpress/commit/19e9e1d))
- **core:** removed required check ([a80c464](https://github.com/botpress/botpress/commit/a80c464))
- **core:** set max server reboots to 2 ([99f3550](https://github.com/botpress/botpress/commit/99f3550))
- **debugger:** a bit more compact nlu debugger ([33b30c0](https://github.com/botpress/botpress/commit/33b30c0))
- **debugger:** added safeguard when an event is incomplete ([75b58a8](https://github.com/botpress/botpress/commit/75b58a8))
- **debugger:** minor adjustment ([adf139d](https://github.com/botpress/botpress/commit/adf139d))
- **dialog:** timeout handling ([1b2fa60](https://github.com/botpress/botpress/commit/1b2fa60))
- **event:** added some checks for parameters ([e8fb839](https://github.com/botpress/botpress/commit/e8fb839))
- **inspector:** ambiguity more visible ([61cfe2f](https://github.com/botpress/botpress/commit/61cfe2f))
- **lock:** allowing upsert to bypass locked status ([5964178](https://github.com/botpress/botpress/commit/5964178))
- **logs:** fixed log emitter ([63b7343](https://github.com/botpress/botpress/commit/63b7343))
- **nlu:** fix progress issue with auto train ([e11cb38](https://github.com/botpress/botpress/commit/e11cb38))
- **nlu:** prevent training on not supported languages ([15cd631](https://github.com/botpress/botpress/commit/15cd631))
- **nlu:** removed jap tokenizer ([f940d14](https://github.com/botpress/botpress/commit/f940d14))
- **nlu:** spelling mistakes & synonyms ([b31ac5a](https://github.com/botpress/botpress/commit/b31ac5a))
- **nlu:** using multiple threads for training ([69822fe](https://github.com/botpress/botpress/commit/69822fe))
- **perms:** modules were always displayed ([1fa6dd6](https://github.com/botpress/botpress/commit/1fa6dd6))
- **qna:** source categories from nlu contexts ([cb261eb](https://github.com/botpress/botpress/commit/cb261eb))
- **qna:** updated tests and minor tweak ([59aff43](https://github.com/botpress/botpress/commit/59aff43))
- **rbac:** content editor access to nlu/qna ([58291b0](https://github.com/botpress/botpress/commit/58291b0))
- **redis:** prevent server spamming on startup ([ba9dba1](https://github.com/botpress/botpress/commit/ba9dba1))
- **security:** updated lodash version ([f31ca19](https://github.com/botpress/botpress/commit/f31ca19))
- **studio:** dm title in emulator ([87cc95b](https://github.com/botpress/botpress/commit/87cc95b))
- **studio:** fix logs panel ([97209a5](https://github.com/botpress/botpress/commit/97209a5))
- **studio:** minor sidebar icons styling fix ([dfdc479](https://github.com/botpress/botpress/commit/dfdc479))
- **webchat:** escape unsafe html ([40bf2d7](https://github.com/botpress/botpress/commit/40bf2d7))

### Features

- **auth:** added oauth2 strategy ([dc7e690](https://github.com/botpress/botpress/commit/dc7e690))
- **bpfs:** workaround to fix bpfs issues ([abd4bd0](https://github.com/botpress/botpress/commit/abd4bd0))
- **config:** prompt server reboot when configuration is updated ([dedaf3d](https://github.com/botpress/botpress/commit/dedaf3d))
- **core:** added config to add extra languages ([43cc081](https://github.com/botpress/botpress/commit/43cc081))
- **core:** prompt server reboot when main config has changed ([1950602](https://github.com/botpress/botpress/commit/1950602))
- **debugger:** added language section ([9f5e253](https://github.com/botpress/botpress/commit/9f5e253))
- **inspector:** copy path to clipboard ([be8cdd1](https://github.com/botpress/botpress/commit/be8cdd1))
- **qna:** added support for content elements ([e32df0a](https://github.com/botpress/botpress/commit/e32df0a))
- **qna:** Added support for elements from the CMS ([7a27aba](https://github.com/botpress/botpress/commit/7a27aba))
- **skill-email:** added email skill ([33f46d4](https://github.com/botpress/botpress/commit/33f46d4))
- **studio:** added util components & change to cms ([0433724](https://github.com/botpress/botpress/commit/0433724))

## [12.1.4](https://github.com/botpress/botpress/compare/v12.1.3...v12.1.4) (2019-10-01)

### Bug Fixes

- **bpfs:** fixed issues caused by legacy logic ([fa89276](https://github.com/botpress/botpress/commit/fa89276))
- **bpfs:** various fixes due to legacy logic ([4108970](https://github.com/botpress/botpress/commit/4108970))
- **channel-web:** fix container width on init ([5ee2f1d](https://github.com/botpress/botpress/commit/5ee2f1d))
- **channel-web:** fix for intermittent issue with emulator ([c148596](https://github.com/botpress/botpress/commit/c148596))
- **channel-web:** fix output of conversation log ([53982ab](https://github.com/botpress/botpress/commit/53982ab))
- **channel-web:** re-added google analytics ([0fe8fce](https://github.com/botpress/botpress/commit/0fe8fce))
- **cluster:** broadcasting reboot to all nodes ([decd505](https://github.com/botpress/botpress/commit/decd505))
- **config:** clear hash on first start & ignore dynamic props ([7d8d5b7](https://github.com/botpress/botpress/commit/7d8d5b7))
- **converse:** ability to change max message length ([aa0a612](https://github.com/botpress/botpress/commit/aa0a612))
- **core:** added multi-thread support for heavy tasks ([d2b30e4](https://github.com/botpress/botpress/commit/d2b30e4))
- **core:** debug logs are not saved to file output ([e328b49](https://github.com/botpress/botpress/commit/e328b49))
- **core:** dialog anti-loop ([d1de885](https://github.com/botpress/botpress/commit/d1de885))
- **core:** fix issue with server reboot ([077dbc9](https://github.com/botpress/botpress/commit/077dbc9))
- **core:** fix permissions view ([23eea72](https://github.com/botpress/botpress/commit/23eea72))
- **core:** fixed typings and missing await for sendevent ([4c7f937](https://github.com/botpress/botpress/commit/4c7f937))
- **core:** on action not found error ([19e9e1d](https://github.com/botpress/botpress/commit/19e9e1d))
- **core:** removed required check ([a80c464](https://github.com/botpress/botpress/commit/a80c464))
- **core:** set max server reboots to 2 ([99f3550](https://github.com/botpress/botpress/commit/99f3550))
- **debugger:** a bit more compact nlu debugger ([33b30c0](https://github.com/botpress/botpress/commit/33b30c0))
- **debugger:** added safeguard when an event is incomplete ([75b58a8](https://github.com/botpress/botpress/commit/75b58a8))
- **debugger:** minor adjustment ([adf139d](https://github.com/botpress/botpress/commit/adf139d))
- **dialog:** timeout handling ([1b2fa60](https://github.com/botpress/botpress/commit/1b2fa60))
- **event:** added some checks for parameters ([e8fb839](https://github.com/botpress/botpress/commit/e8fb839))
- **inspector:** ambiguity more visible ([61cfe2f](https://github.com/botpress/botpress/commit/61cfe2f))
- **lock:** allowing upsert to bypass locked status ([5964178](https://github.com/botpress/botpress/commit/5964178))
- **logs:** fixed log emitter ([63b7343](https://github.com/botpress/botpress/commit/63b7343))
- **nlu:** fix progress issue with auto train ([e11cb38](https://github.com/botpress/botpress/commit/e11cb38))
- **nlu:** prevent training on not supported languages ([15cd631](https://github.com/botpress/botpress/commit/15cd631))
- **nlu:** removed jap tokenizer ([f940d14](https://github.com/botpress/botpress/commit/f940d14))
- **nlu:** spelling mistakes & synonyms ([b31ac5a](https://github.com/botpress/botpress/commit/b31ac5a))
- **nlu:** using multiple threads for training ([69822fe](https://github.com/botpress/botpress/commit/69822fe))
- **perms:** modules were always displayed ([1fa6dd6](https://github.com/botpress/botpress/commit/1fa6dd6))
- **qna:** source categories from nlu contexts ([cb261eb](https://github.com/botpress/botpress/commit/cb261eb))
- **qna:** updated tests and minor tweak ([59aff43](https://github.com/botpress/botpress/commit/59aff43))
- **rbac:** content editor access to nlu/qna ([58291b0](https://github.com/botpress/botpress/commit/58291b0))
- **redis:** prevent server spamming on startup ([ba9dba1](https://github.com/botpress/botpress/commit/ba9dba1))
- **security:** updated lodash version ([f31ca19](https://github.com/botpress/botpress/commit/f31ca19))
- **studio:** dm title in emulator ([87cc95b](https://github.com/botpress/botpress/commit/87cc95b))
- **studio:** fix logs panel ([97209a5](https://github.com/botpress/botpress/commit/97209a5))
- **studio:** minor sidebar icons styling fix ([dfdc479](https://github.com/botpress/botpress/commit/dfdc479))
- **webchat:** escape unsafe html ([40bf2d7](https://github.com/botpress/botpress/commit/40bf2d7))

### Features

- **auth:** added oauth2 strategy ([dc7e690](https://github.com/botpress/botpress/commit/dc7e690))
- **bpfs:** workaround to fix bpfs issues ([abd4bd0](https://github.com/botpress/botpress/commit/abd4bd0))
- **config:** prompt server reboot when configuration is updated ([dedaf3d](https://github.com/botpress/botpress/commit/dedaf3d))
- **core:** added config to add extra languages ([43cc081](https://github.com/botpress/botpress/commit/43cc081))
- **core:** prompt server reboot when main config has changed ([1950602](https://github.com/botpress/botpress/commit/1950602))
- **debugger:** added language section ([9f5e253](https://github.com/botpress/botpress/commit/9f5e253))
- **inspector:** copy path to clipboard ([be8cdd1](https://github.com/botpress/botpress/commit/be8cdd1))
- **qna:** added support for content elements ([e32df0a](https://github.com/botpress/botpress/commit/e32df0a))
- **qna:** Added support for elements from the CMS ([7a27aba](https://github.com/botpress/botpress/commit/7a27aba))
- **skill-email:** added email skill ([33f46d4](https://github.com/botpress/botpress/commit/33f46d4))
- **studio:** added util components & change to cms ([0433724](https://github.com/botpress/botpress/commit/0433724))

## [12.1.4](https://github.com/botpress/botpress/compare/v12.1.3...v12.1.4) (2019-09-19)

### Bug Fixes

- **bpfs:** fixed issues caused by legacy logic ([fa89276](https://github.com/botpress/botpress/commit/fa89276))
- **bpfs:** various fixes due to legacy logic ([4108970](https://github.com/botpress/botpress/commit/4108970))
- **channel-web:** re-added google analytics ([0fe8fce](https://github.com/botpress/botpress/commit/0fe8fce))
- **cluster:** broadcasting reboot to all nodes ([decd505](https://github.com/botpress/botpress/commit/decd505))
- **config:** clear hash on first start & ignore dynamic props ([5b351cb](https://github.com/botpress/botpress/commit/5b351cb))
- **core:** added multi-thread support for heavy tasks ([d2b30e4](https://github.com/botpress/botpress/commit/d2b30e4))
- **debugger:** a bit more compact nlu debugger ([33b30c0](https://github.com/botpress/botpress/commit/33b30c0))
- **debugger:** minor adjustment ([2957057](https://github.com/botpress/botpress/commit/2957057))
- **dialog:** timeout handling ([077f33c](https://github.com/botpress/botpress/commit/077f33c))
- **inspector:** ambiguity more visible ([61cfe2f](https://github.com/botpress/botpress/commit/61cfe2f))
- **lock:** allowing upsert to bypass locked status ([3489516](https://github.com/botpress/botpress/commit/3489516))
- **logs:** fixed log emitter ([1d6f191](https://github.com/botpress/botpress/commit/1d6f191))
- **nlu:** fix progress issue with auto train ([2734994](https://github.com/botpress/botpress/commit/2734994))
- **nlu:** prevent training on not supported languages ([15cd631](https://github.com/botpress/botpress/commit/15cd631))
- **nlu:** removed jap tokenizer ([f940d14](https://github.com/botpress/botpress/commit/f940d14))
- **nlu:** using multiple threads for training ([69822fe](https://github.com/botpress/botpress/commit/69822fe))
- **qna:** source categories from nlu contexts ([cb261eb](https://github.com/botpress/botpress/commit/cb261eb))
- **qna:** updated tests and minor tweak ([59aff43](https://github.com/botpress/botpress/commit/59aff43))
- **rbac:** content editor access to nlu/qna ([58291b0](https://github.com/botpress/botpress/commit/58291b0))
- **redis:** prevent server spamming on startup ([ba9dba1](https://github.com/botpress/botpress/commit/ba9dba1))
- **studio:** dm title in emulator ([87cc95b](https://github.com/botpress/botpress/commit/87cc95b))
- **studio:** fix logs panel ([97209a5](https://github.com/botpress/botpress/commit/97209a5))
- **studio:** minor sidebar icons styling fix ([dfdc479](https://github.com/botpress/botpress/commit/dfdc479))
- **webchat:** escape unsafe html ([40bf2d7](https://github.com/botpress/botpress/commit/40bf2d7))

### Features

- **auth:** added oauth2 strategy ([dc7e690](https://github.com/botpress/botpress/commit/dc7e690))
- **bpfs:** workaround to fix bpfs issues ([abd4bd0](https://github.com/botpress/botpress/commit/abd4bd0))
- **config:** prompt server reboot when configuration is updated ([dedaf3d](https://github.com/botpress/botpress/commit/dedaf3d))
- **core:** added config to add extra languages ([43cc081](https://github.com/botpress/botpress/commit/43cc081))
- **core:** prompt server reboot when main config has changed ([1950602](https://github.com/botpress/botpress/commit/1950602))
- **debugger:** added language section ([9f5e253](https://github.com/botpress/botpress/commit/9f5e253))
- **inspector:** copy path to clipboard ([be8cdd1](https://github.com/botpress/botpress/commit/be8cdd1))
- **qna:** added support for content elements ([e32df0a](https://github.com/botpress/botpress/commit/e32df0a))
- **qna:** Added support for elements from the CMS ([7a27aba](https://github.com/botpress/botpress/commit/7a27aba))
- **studio:** added util components & change to cms ([0433724](https://github.com/botpress/botpress/commit/0433724))

## [12.1.3](https://github.com/botpress/botpress/compare/v12.1.1...v12.1.3) (2019-09-04)

### Bug Fixes

- **admin:** added bp version on admin ui ([f577191](https://github.com/botpress/botpress/commit/f577191))
- **admin:** cascading errors and updated typings ([00de662](https://github.com/botpress/botpress/commit/00de662))
- **admin:** fixed bot import using drag&drop ([374b668](https://github.com/botpress/botpress/commit/374b668))
- **admin:** fixed error display on bot create and import ([0c50fd4](https://github.com/botpress/botpress/commit/0c50fd4))
- **admin:** moved user ui to blueprint and added id for testing ([0eb60ea](https://github.com/botpress/botpress/commit/0eb60ea))
- **admin:** raised default timeout to 6s ([fb027e9](https://github.com/botpress/botpress/commit/fb027e9))
- **admin:** removed gravatar and added name ([ae06619](https://github.com/botpress/botpress/commit/ae06619))
- **bots:** fixed display of name vs id in switch and import ([5dda8a9](https://github.com/botpress/botpress/commit/5dda8a9))
- **channel-slack:** added user info to messages ([8768441](https://github.com/botpress/botpress/commit/8768441))
- **channel-web:** responsive cover image ([1ac3411](https://github.com/botpress/botpress/commit/1ac3411))
- **channel-web:** target self for links that start by javascript: ([f506de9](https://github.com/botpress/botpress/commit/f506de9))
- **cms:** rendering default payload for unknown channels ([ed7b448](https://github.com/botpress/botpress/commit/ed7b448))
- **config:** missing typings and added external url ([93a1c55](https://github.com/botpress/botpress/commit/93a1c55))
- **core:** added config to choose socket transport order ([df77c5b](https://github.com/botpress/botpress/commit/df77c5b))
- **core:** added typings and cleanup ([d6c643e](https://github.com/botpress/botpress/commit/d6c643e))
- **core:** added warning when home folder not defined ([b817b25](https://github.com/botpress/botpress/commit/b817b25))
- **core:** handling studio index file missing ([015c2bd](https://github.com/botpress/botpress/commit/015c2bd))
- **core:** locked bots are blocked from editing from anywhere ([1a0e4df](https://github.com/botpress/botpress/commit/1a0e4df))
- **core:** socket.io correctly supports custom paths ([8318c56](https://github.com/botpress/botpress/commit/8318c56))
- **core:** using is_production for hiding debug logs ([6d29f80](https://github.com/botpress/botpress/commit/6d29f80))
- **flow:** give higher importance to main flow ([4a91e65](https://github.com/botpress/botpress/commit/4a91e65))
- **flow:** read only wasn't applied from permissions (ui only) ([d8871ad](https://github.com/botpress/botpress/commit/d8871ad))
- **flow:** show basic server infos ([b19e12d](https://github.com/botpress/botpress/commit/b19e12d))
- **ghost:** prevent creating new instances when ghost is called ([9251c17](https://github.com/botpress/botpress/commit/9251c17))
- **ghost:** prevent creating new instances when ghost is needed ([90e7cf1](https://github.com/botpress/botpress/commit/90e7cf1))
- **nlu:** entity matching is bit tighter and robust ([cc15a6c](https://github.com/botpress/botpress/commit/cc15a6c))
- **nlu:** fixed lang detection ([5aaa89b](https://github.com/botpress/botpress/commit/5aaa89b))
- **NLU:** loosen language election with short inputs ([5ffc5b4](https://github.com/botpress/botpress/commit/5ffc5b4))
- **slack:** added documentation on the official docs ([024b645](https://github.com/botpress/botpress/commit/024b645))
- **studio:** fix issues with bot switcher ([e22fe32](https://github.com/botpress/botpress/commit/e22fe32))

### Features

- **channel-slack:** added user info to messages ([e4ad918](https://github.com/botpress/botpress/commit/e4ad918))
- **debugger:** added actionerrors to debugger view ([feffa09](https://github.com/botpress/botpress/commit/feffa09))
- **debugger:** added event errors to debugger view ([d15302d](https://github.com/botpress/botpress/commit/d15302d))
- **kvs:** kvs forBot and forGlobal with no breaking changes ([2d248b4](https://github.com/botpress/botpress/commit/2d248b4))
- **versioning:** minimal gui for push/pull archive ([3abfc4f](https://github.com/botpress/botpress/commit/3abfc4f))

## [12.1.2](https://github.com/botpress/botpress/compare/v12.1.1...v12.1.2) (2019-08-27)

### Bug Fixes

- **admin:** cascading errors and updated typings ([00de662](https://github.com/botpress/botpress/commit/00de662))
- **admin:** fixed bot import using drag&drop ([aa9c056](https://github.com/botpress/botpress/commit/aa9c056))
- **admin:** fixed error display on bot create and import ([0c50fd4](https://github.com/botpress/botpress/commit/0c50fd4))
- **admin:** raised default timeout to 6s ([fb027e9](https://github.com/botpress/botpress/commit/fb027e9))
- **channel-slack:** added user info to messages ([8768441](https://github.com/botpress/botpress/commit/8768441))
- **channel-web:** responsive cover image ([e9e76e1](https://github.com/botpress/botpress/commit/e9e76e1))
- **channel-web:** target self for links that start by javascript: ([2ffdbf1](https://github.com/botpress/botpress/commit/2ffdbf1))
- **cms:** rendering default payload for unknown channels ([ed7b448](https://github.com/botpress/botpress/commit/ed7b448))
- **config:** missing typings and added external url ([93a1c55](https://github.com/botpress/botpress/commit/93a1c55))
- **core:** added typings and cleanup ([d6c643e](https://github.com/botpress/botpress/commit/d6c643e))
- **core:** added warning when home folder not defined ([e594172](https://github.com/botpress/botpress/commit/e594172))
- **core:** handling studio index file missing ([91f57eb](https://github.com/botpress/botpress/commit/91f57eb))
- **core:** socket.io correctly supports custom paths ([8318c56](https://github.com/botpress/botpress/commit/8318c56))
- **core:** using is_production for hiding debug logs ([daba068](https://github.com/botpress/botpress/commit/daba068))
- **flow:** show basic server infos ([214362a](https://github.com/botpress/botpress/commit/214362a))
- **ghost:** prevent creating new instances when ghost is called ([9251c17](https://github.com/botpress/botpress/commit/9251c17))
- **ghost:** prevent creating new instances when ghost is needed ([90e7cf1](https://github.com/botpress/botpress/commit/90e7cf1))
- **nlu:** entity matching is bit tighter and robust ([cc15a6c](https://github.com/botpress/botpress/commit/cc15a6c))
- **nlu:** fixed lang detection ([5aaa89b](https://github.com/botpress/botpress/commit/5aaa89b))
- **NLU:** loosen language election with short inputs ([5ffc5b4](https://github.com/botpress/botpress/commit/5ffc5b4))
- **slack:** added documentation on the official docs ([7da9275](https://github.com/botpress/botpress/commit/7da9275))

### Features

- **channel-slack:** added user info to messages ([e4ad918](https://github.com/botpress/botpress/commit/e4ad918))
- **kvs:** kvs forBot and forGlobal with no breaking changes ([2d248b4](https://github.com/botpress/botpress/commit/2d248b4))

## [12.1.2](https://github.com/botpress/botpress/compare/v12.1.1...v12.1.2) (2019-08-27)

### Bug Fixes

- **admin:** cascading errors and updated typings ([5fa7f91](https://github.com/botpress/botpress/commit/5fa7f91))
- **admin:** fixed bot import using drag&drop ([374b668](https://github.com/botpress/botpress/commit/374b668))
- **admin:** fixed error display on bot create and import ([0c50fd4](https://github.com/botpress/botpress/commit/0c50fd4))
- **admin:** raised default timeout to 6s ([fb027e9](https://github.com/botpress/botpress/commit/fb027e9))
- **channel-slack:** added user info to messages ([9fdd493](https://github.com/botpress/botpress/commit/9fdd493))
- **channel-web:** responsive cover image ([e9e76e1](https://github.com/botpress/botpress/commit/e9e76e1))
- **cms:** rendering default payload for unknown channels ([55bcf57](https://github.com/botpress/botpress/commit/55bcf57))
- **config:** missing typings and added external url ([93a1c55](https://github.com/botpress/botpress/commit/93a1c55))
- **core:** added typings and cleanup ([d6c643e](https://github.com/botpress/botpress/commit/d6c643e))
- **core:** added warning when home folder not defined ([b817b25](https://github.com/botpress/botpress/commit/b817b25))
- **core:** handling studio index file missing ([91f57eb](https://github.com/botpress/botpress/commit/91f57eb))
- **core:** socket.io correctly supports custom paths ([9f59bf5](https://github.com/botpress/botpress/commit/9f59bf5))
- **core:** using is_production for hiding debug logs ([daba068](https://github.com/botpress/botpress/commit/daba068))
- **flow:** show basic server infos ([b19e12d](https://github.com/botpress/botpress/commit/b19e12d))
- **ghost:** prevent creating new instances when ghost is called ([9251c17](https://github.com/botpress/botpress/commit/9251c17))
- **ghost:** prevent creating new instances when ghost is needed ([90e7cf1](https://github.com/botpress/botpress/commit/90e7cf1))
- **nlu:** entity matching is bit tighter and robust ([cc15a6c](https://github.com/botpress/botpress/commit/cc15a6c))
- **nlu:** fixed lang detection ([5aaa89b](https://github.com/botpress/botpress/commit/5aaa89b))
- **NLU:** loosen language election with short inputs ([5ffc5b4](https://github.com/botpress/botpress/commit/5ffc5b4))
- **slack:** added documentation on the official docs ([024b645](https://github.com/botpress/botpress/commit/024b645))

### Features

- **channel-slack:** added user info to messages ([e4ad918](https://github.com/botpress/botpress/commit/e4ad918))
- **kvs:** kvs forBot and forGlobal with no breaking changes ([2d248b4](https://github.com/botpress/botpress/commit/2d248b4))

## [12.1.1](https://github.com/botpress/botpress/compare/v12.1.0...v12.1.1) (2019-08-17)

### Bug Fixes

- **import:** support zip files & nested archives ([0265d7e](https://github.com/botpress/botpress/commit/0265d7e))
- **admin:** ui tweaks for bot creation ([2bd9714](https://github.com/botpress/botpress/commit/2bd9714))
- **code-editor:** the ghost for bot config files was global ([ba69875](https://github.com/botpress/botpress/commit/ba69875))
- **config:** added revision recording for bot and botpress config ([c84187e](https://github.com/botpress/botpress/commit/c84187e))
- **core:** clear cache upon migration ([84bb027](https://github.com/botpress/botpress/commit/84bb027))
- **debugger:** decision was linking to an NLU intent, but now plain text ([89d5616](https://github.com/botpress/botpress/commit/89d5616))
- **flow:** bigger handle to drag and drop nodes ([4c66cb1](https://github.com/botpress/botpress/commit/4c66cb1))
- **ghost:** add exclude support for db driver ([9113860](https://github.com/botpress/botpress/commit/9113860))
- **ghost:** clear local revisions when pushed ([eaca91e](https://github.com/botpress/botpress/commit/eaca91e))
- **ghost:** ignoring models when comparing revisions ([4a15cf4](https://github.com/botpress/botpress/commit/4a15cf4))
- **ghost:** module loader will no longer record revisions ([3bccd79](https://github.com/botpress/botpress/commit/3bccd79))
- **ghost:** more work toward stable ghost ([c5b775b](https://github.com/botpress/botpress/commit/c5b775b))
- **ghost:** push is behaving like it should ([533f184](https://github.com/botpress/botpress/commit/533f184))
- **logs:** log table migration won't run if not needed ([9663f18](https://github.com/botpress/botpress/commit/9663f18))
- **migrations:** execute migrations after modules are loaded ([aa3ca17](https://github.com/botpress/botpress/commit/aa3ca17))
- **migrations:** execute migrations after modules tables are created ([91de8b6](https://github.com/botpress/botpress/commit/91de8b6))
- **nlu:** empty token fix ([106184f](https://github.com/botpress/botpress/commit/106184f))
- **nlu:** if TFIDF fails, return low importance ([60de3b9](https://github.com/botpress/botpress/commit/60de3b9))
- **nlu:** tokenize empty / null token ([a8c7aad](https://github.com/botpress/botpress/commit/a8c7aad))
- **socket:** using websocket first (fallback polling) ([f9529be](https://github.com/botpress/botpress/commit/f9529be))
- **studio:** undo delete skill creates new skill ([7ff8ee1](https://github.com/botpress/botpress/commit/7ff8ee1))

### Features

- **studio:** toast msg to remind about auto-save when hitting ctrl+s ([fdb8517](https://github.com/botpress/botpress/commit/fdb8517))

# [12.1.0](https://github.com/botpress/botpress/compare/v12.0.7...v12.1.0) (2019-08-14)

### Bug Fixes

- **admin:** issue with role selection & added some typing ([a913c27](https://github.com/botpress/botpress/commit/a913c27))
- **bots:** added migration for bot imports ([65d9881](https://github.com/botpress/botpress/commit/65d9881))
- **channel-slack:** added verifications & changed some logic ([a49f701](https://github.com/botpress/botpress/commit/a49f701))
- **converse:** making sure timeout is set ([3decfef](https://github.com/botpress/botpress/commit/3decfef))
- **core:** clearing cache of required actions and sync when remote ([720cb7a](https://github.com/botpress/botpress/commit/720cb7a))
- **core:** clearing cache of required actions when changed ([7f59d37](https://github.com/botpress/botpress/commit/7f59d37))
- **core:** custom paths can be defined for botpress ([55d9e0a](https://github.com/botpress/botpress/commit/55d9e0a))
- **core:** on action error, flowTo loc if defined ([ef3d913](https://github.com/botpress/botpress/commit/ef3d913))
- **core:** strategy always return instruction ([39a5739](https://github.com/botpress/botpress/commit/39a5739))
- **docs:** fix links on the nlu page ([a0d802c](https://github.com/botpress/botpress/commit/a0d802c))
- **flow:** another refactor & added some stuff ([d372347](https://github.com/botpress/botpress/commit/d372347))
- **flow:** some refactor for flows ([a1a985e](https://github.com/botpress/botpress/commit/a1a985e))
- **flow:** updated srd and added typings ([2e5bc29](https://github.com/botpress/botpress/commit/2e5bc29))
- **flows:** repair update skill ([ce59edd](https://github.com/botpress/botpress/commit/ce59edd))
- **ghost:** fix with sync & cms invalidate ([dc6e4f5](https://github.com/botpress/botpress/commit/dc6e4f5))
- **ghost:** pushing local to remote directly ([8bfb80a](https://github.com/botpress/botpress/commit/8bfb80a))
- **lang-server:** not refreshing invalid metadata ([d4565e9](https://github.com/botpress/botpress/commit/d4565e9))
- **logs:** srv_logs table now has timestamp instead of string ([63c3d7c](https://github.com/botpress/botpress/commit/63c3d7c))
- **nlu:** better slot tagging ([0953f12](https://github.com/botpress/botpress/commit/0953f12))
- **nlu:** crf model check ([e7729ef](https://github.com/botpress/botpress/commit/e7729ef))
- **nlu:** don't force skipgram loading ([19b299a](https://github.com/botpress/botpress/commit/19b299a))
- **nlu:** fix get train set ([037ea8e](https://github.com/botpress/botpress/commit/037ea8e))
- **nlu:** removing useless confusion matrix error ([2a79225](https://github.com/botpress/botpress/commit/2a79225))
- **nlu:** skipgram model loading when no slot ([657ff9c](https://github.com/botpress/botpress/commit/657ff9c))
- **nlu:** slot-crf gets matchedEntities for train ([eff89f5](https://github.com/botpress/botpress/commit/eff89f5))
- **nlu:** slots-crf tests ([97644cc](https://github.com/botpress/botpress/commit/97644cc))
- **redis:** fix memory leak with listeners ([85667f5](https://github.com/botpress/botpress/commit/85667f5))
- **studio:** prevent re-rendering the whole layout when user changes ([9dad301](https://github.com/botpress/botpress/commit/9dad301))
- **ui:** minor adjustments ([618cd57](https://github.com/botpress/botpress/commit/618cd57))

### Features

- **channel-slack:** add new channel ([481cfd4](https://github.com/botpress/botpress/commit/481cfd4))
- **channel-slack:** added slack integration ([3a2778e](https://github.com/botpress/botpress/commit/3a2778e))
- **channel-teams:** added MS Teams channel ([e65227b](https://github.com/botpress/botpress/commit/e65227b))
- **channel-web:** ability to show timestamp next to each messages ([b2f7562](https://github.com/botpress/botpress/commit/b2f7562))
- **code-editor:** code editor now works with RBAC instead of configs ([86356e0](https://github.com/botpress/botpress/commit/86356e0))
- **core:** added support for a custom url ([4351045](https://github.com/botpress/botpress/commit/4351045))
- **debugger:** Clicking on intent in debugger navigates to correct intent in nlu or qna ([ccefa76](https://github.com/botpress/botpress/commit/ccefa76))
- **debugger:** remove **qna** identifier + make UI more homogeneous ([9e6c12a](https://github.com/botpress/botpress/commit/9e6c12a))
- **flow:** new experience with flow editor ([1c96afb](https://github.com/botpress/botpress/commit/1c96afb))
- **flow-editor:** new experience with the flow builder ([3f24b42](https://github.com/botpress/botpress/commit/3f24b42))
- **flows:** flow editor is notified when somebody else is editing flows ([9fe039b](https://github.com/botpress/botpress/commit/9fe039b))
- **flows:** Realtime collaboration in flows ([040ddf3](https://github.com/botpress/botpress/commit/040ddf3))
- **hitl:** basic search ([01c9d33](https://github.com/botpress/botpress/commit/01c9d33))
- **hitl:** UI changes & added features ([7590fb0](https://github.com/botpress/botpress/commit/7590fb0))
- **lang-server:** add option to run offline ([8a941a3](https://github.com/botpress/botpress/commit/8a941a3))
- **studio:** Flow editor auto saves and notifies when somebody else is editing flow ([2a50011](https://github.com/botpress/botpress/commit/2a50011))
- **version-control:** add push and status commands ([0bca349](https://github.com/botpress/botpress/commit/0bca349))

## [12.0.7](https://github.com/botpress/botpress/compare/v12.0.6...v12.0.7) (2019-08-05)

### Bug Fixes

- **redis:** fix invalidation with redis ([25a1411](https://github.com/botpress/botpress/commit/25a1411))

## [12.0.6](https://github.com/botpress/botpress/compare/v12.0.5...v12.0.6) (2019-08-02)

### Bug Fixes

- **core:** ldap authentication ([e9375f0](https://github.com/botpress/botpress/commit/e9375f0))
- **dialog-engine:** ending flow when no nodes configured ([a2c5ad3](https://github.com/botpress/botpress/commit/a2c5ad3))

## [12.0.5](https://github.com/botpress/botpress/compare/v12.0.4...v12.0.5) (2019-07-31)

### Bug Fixes

- **nlu:** case sensitivity in svm ([5746404](https://github.com/botpress/botpress/commit/5746404))

## [12.0.4](https://github.com/botpress/botpress/compare/v12.0.3...v12.0.4) (2019-07-31)

### Bug Fixes

- **admin:** fix last login and joined on dates ([9285d7e](https://github.com/botpress/botpress/commit/9285d7e))
- **bots:** export & import now updates image paths & others ([a93a819](https://github.com/botpress/botpress/commit/a93a819))
- **channel-web:** externalAuth token http headers ([41997df](https://github.com/botpress/botpress/commit/41997df))
- **channel-web:** issue with file upload ([f8c229d](https://github.com/botpress/botpress/commit/f8c229d))
- **core:** added missing audit logs ([7f6452d](https://github.com/botpress/botpress/commit/7f6452d))
- **core:** check multiple linux distros in order ([78deecc](https://github.com/botpress/botpress/commit/78deecc))
- **logs:** follow-logs not working consistently when zoomed ([39a4044](https://github.com/botpress/botpress/commit/39a4044))
- **nlu:** known slots infinite loop ([3fd55b9](https://github.com/botpress/botpress/commit/3fd55b9))
- **nlu:** knownSlots extraction ([7cc6344](https://github.com/botpress/botpress/commit/7cc6344))
- **skills:** fixed choice skill repeat ([ffc7ccd](https://github.com/botpress/botpress/commit/ffc7ccd))
- **webchat:** fix for some messages which crashed the whole chat ([125d0bd](https://github.com/botpress/botpress/commit/125d0bd))

## [12.0.3](https://github.com/botpress/botpress/compare/v12.0.2...v12.0.3) (2019-07-25)

### Bug Fixes

- **core:** handling cases where message is not a string ([a486013](https://github.com/botpress/botpress/commit/a486013))
- **ie:** webchat not working on ie ([830e2e1](https://github.com/botpress/botpress/commit/830e2e1))
- **lang:** meta file, try local when remote fails ([4566c4d](https://github.com/botpress/botpress/commit/4566c4d))
- **lang-server:** refreshing health when visiting studio ([77cfeed](https://github.com/botpress/botpress/commit/77cfeed))
- **nlu:** exact match also matches if one entity type differs ([7880ccb](https://github.com/botpress/botpress/commit/7880ccb))
- **nlu:** merge tokens if both are made of chosen special characters in slot extraction ([48e3171](https://github.com/botpress/botpress/commit/48e3171))
- **nlu:** undefined occurrences or pattern ([893c912](https://github.com/botpress/botpress/commit/893c912))
- **qna:** cleanup unused qna intents when syncing ([cd91499](https://github.com/botpress/botpress/commit/cd91499))

## [12.0.2](https://github.com/botpress/botpress/compare/v12.0.1...v12.0.2) (2019-07-16)

### Bug Fixes

- **admin:** allow admin role to read/write languages ([45feaeb](https://github.com/botpress/botpress/commit/45feaeb))
- **admin:** greater timeout when importing bot ([f4a449c](https://github.com/botpress/botpress/commit/f4a449c))
- **admin:** no axios timeout when importing a bot as it might be long for big bots ([c9a6b0a](https://github.com/botpress/botpress/commit/c9a6b0a))
- **admin:** resolution of components ([9f2957e](https://github.com/botpress/botpress/commit/9f2957e))
- **auth:** allow submit with enter only if form is valid on first auth ([fdab96e](https://github.com/botpress/botpress/commit/fdab96e))
- **choice:** retries only working after save ([8bd67c5](https://github.com/botpress/botpress/commit/8bd67c5))
- **choice:** retry content element not required anymore ([cdaf003](https://github.com/botpress/botpress/commit/cdaf003))
- **code-editor:** added reminder for available configs ([6f5f4d3](https://github.com/botpress/botpress/commit/6f5f4d3))
- **core:** action service uses try/catch instead of promise callbacks ([eb2d48a](https://github.com/botpress/botpress/commit/eb2d48a))
- **core:** maxListeners warning in console on botpress start ([bd4a1f6](https://github.com/botpress/botpress/commit/bd4a1f6))
- **core:** unregister listeners after_bot_unmount ([f22b8c0](https://github.com/botpress/botpress/commit/f22b8c0))
- **debugger:** allow more time for debugger to fetch an event ([7e07239](https://github.com/botpress/botpress/commit/7e07239))
- **ghost:** allow files up to 100mb ([e9d2e51](https://github.com/botpress/botpress/commit/e9d2e51))
- **lang:** metadataLocation local files lookup ([7cf9a05](https://github.com/botpress/botpress/commit/7cf9a05))
- **nlu:** batching tokenize and vectorize calls to lang-server ([e84334b](https://github.com/botpress/botpress/commit/e84334b))
- **nlu:** bigger payload allowed ([2e3d37e](https://github.com/botpress/botpress/commit/2e3d37e))
- **nlu:** confusion engine bad parameter ([9848f5d](https://github.com/botpress/botpress/commit/9848f5d))
- **nlu:** don't load model for lang when not found ([0a98393](https://github.com/botpress/botpress/commit/0a98393))
- **nlu:** pattern extraction case insensitive ([0d414d3](https://github.com/botpress/botpress/commit/0d414d3))
- **nlu:** slot tagger ([5897d9f](https://github.com/botpress/botpress/commit/5897d9f))
- **nlu:** very confused std threshold ([f3a3af9](https://github.com/botpress/botpress/commit/f3a3af9))
- **nlu:** very confused still return intents ([9e719f6](https://github.com/botpress/botpress/commit/9e719f6))
- **nlu:** view supports more intents and sections ([be395f5](https://github.com/botpress/botpress/commit/be395f5))
- **qna:** redundant question already exists check ([628b209](https://github.com/botpress/botpress/commit/628b209))
- **qna:** validation failed on empty redirect flow ([8449208](https://github.com/botpress/botpress/commit/8449208))
- **sdk:** incorrect event state signature ([4b17693](https://github.com/botpress/botpress/commit/4b17693))
- **studio:** missing translations show up red ([e981590](https://github.com/botpress/botpress/commit/e981590))
- **studio:** sidebar doesn't unroll anymore ([0886c1a](https://github.com/botpress/botpress/commit/0886c1a))

### Features

- **channel-web:** add ability to send toggleBotInfo event ([28e5e2d](https://github.com/botpress/botpress/commit/28e5e2d))

## [12.0.1](https://github.com/botpress/botpress/compare/v12.0.0...v12.0.1) (2019-07-08)

### Bug Fixes

- **admin:** add create bot to pipeline view with no bots ([9cdc703](https://github.com/botpress/botpress/commit/9cdc703))
- **admin:** password reset for basic auth strategy ([c3b181e](https://github.com/botpress/botpress/commit/c3b181e))
- **channel-web:** fix pt translations + added es translation ([04859bb](https://github.com/botpress/botpress/commit/04859bb))
- **channel-web:** translate reset conversation label ([27e34f3](https://github.com/botpress/botpress/commit/27e34f3))
- **channel-web:** using native includes instead ([d9669ab](https://github.com/botpress/botpress/commit/d9669ab))
- **core:** pass full workspace user object + attributes to stage change hooks ([f9dac3f](https://github.com/botpress/botpress/commit/f9dac3f))
- **env:** allow json in env var (for complex configs) ([bdc3500](https://github.com/botpress/botpress/commit/bdc3500))
- **flow:** fix subflows not working & bit of ux ([fc4d822](https://github.com/botpress/botpress/commit/fc4d822))
- **gulp:** added verbose for build ([487fda4](https://github.com/botpress/botpress/commit/487fda4))
- **gulp:** sending outputs to console when watching ([c2a3e88](https://github.com/botpress/botpress/commit/c2a3e88))
- **lang-server:** replace readonly with admintoken ([2fb9af5](https://github.com/botpress/botpress/commit/2fb9af5))
- **lang-server:** users don't hit directly the endpoint ([ce49b0a](https://github.com/botpress/botpress/commit/ce49b0a))
- **native:** added sentencepiece for all os ([ad00566](https://github.com/botpress/botpress/commit/ad00566))
- **nlu:** check if model loaded before extracting intents ([0c831e8](https://github.com/botpress/botpress/commit/0c831e8))
- **nlu:** email entity extraction ([faf9afe](https://github.com/botpress/botpress/commit/faf9afe))
- **nlu:** numeral to number ([d1f5465](https://github.com/botpress/botpress/commit/d1f5465))
- **nlu:** pattern extractor uses raw text ([59570ef](https://github.com/botpress/botpress/commit/59570ef))
- **nlu:** various performance fixes wrt lang server ([bb0f1f4](https://github.com/botpress/botpress/commit/bb0f1f4))
- **skill-choice:** update choice on choice edit ([d7cdf3b](https://github.com/botpress/botpress/commit/d7cdf3b))
- **typings:** better experience working with typescript ([397f1e8](https://github.com/botpress/botpress/commit/397f1e8))

### Features

- **channel-web:** introduce webchat events ([1ca8f49](https://github.com/botpress/botpress/commit/1ca8f49))
- **nlu:** usage of sentencepiece underscore in list extraction ([b13cbf3](https://github.com/botpress/botpress/commit/b13cbf3))
- **qna:** display nlu machine learning recommendations in qna ([fd29a3b](https://github.com/botpress/botpress/commit/fd29a3b))

# [12.0.0](https://github.com/botpress/botpress/compare/v11.9.6...v12.0.0) (2019-07-02)

### Bug Fixes

- **admin:** better ux for create bot ([c696fc9](https://github.com/botpress/botpress/commit/c696fc9))
- **admin:** changed menu & added debug page ([c7591d1](https://github.com/botpress/botpress/commit/c7591d1))
- **bot-service:** allow changing id when moving ([7669122](https://github.com/botpress/botpress/commit/7669122))
- **bots:** checking bot status & fix export ([6f530a7](https://github.com/botpress/botpress/commit/6f530a7))
- **build:** added more details when building ([3094370](https://github.com/botpress/botpress/commit/3094370))
- **build:** dependencies ([0abf156](https://github.com/botpress/botpress/commit/0abf156))
- **build:** module builder source maps ([e3cfdb8](https://github.com/botpress/botpress/commit/e3cfdb8))
- **channel-web:** allows different user id for different purposes ([80e1879](https://github.com/botpress/botpress/commit/80e1879))
- **channel-web:** fix react warning ([14ee5c9](https://github.com/botpress/botpress/commit/14ee5c9))
- **channel-web:** hiding widget when hiding webchat ([786414c](https://github.com/botpress/botpress/commit/786414c))
- **cms:** copy choice items ([f7a7b6c](https://github.com/botpress/botpress/commit/f7a7b6c))
- **cms:** fix overflow issue with multilang ([f9355a0](https://github.com/botpress/botpress/commit/f9355a0))
- **cms:** height auto resize for the table ([5fb49f0](https://github.com/botpress/botpress/commit/5fb49f0))
- **cms:** remembering last language on refresh ([7012e16](https://github.com/botpress/botpress/commit/7012e16))
- **cms:** scrollbar, pagesize & removed some filters ([292988d](https://github.com/botpress/botpress/commit/292988d))
- **code-editor:** added forgotten hook ([93a055d](https://github.com/botpress/botpress/commit/93a055d))
- **code-editor:** leaving editing mode when no changes ([8651c18](https://github.com/botpress/botpress/commit/8651c18))
- **confusion:** issue with disabled bots & bit of ux ([b972d69](https://github.com/botpress/botpress/commit/b972d69))
- **core:** bumped min QnA conf to 0.5 ([cf7d9f3](https://github.com/botpress/botpress/commit/cf7d9f3))
- **core:** loading config from env properly ([16fc903](https://github.com/botpress/botpress/commit/16fc903))
- **core:** svm linear kernel ([1dfae47](https://github.com/botpress/botpress/commit/1dfae47))
- **core:** unmount & remount bot on config changed ([e5c9592](https://github.com/botpress/botpress/commit/e5c9592))
- **debug:** added method to persist debug scopes ([410b770](https://github.com/botpress/botpress/commit/410b770))
- **debugger:** debugger only updates last msg for new messages ([c39e327](https://github.com/botpress/botpress/commit/c39e327))
- **debugger:** moved flow nodes to summary ([048be1b](https://github.com/botpress/botpress/commit/048be1b))
- **debugger:** No nlu section when nothing to show ([d1d6a7c](https://github.com/botpress/botpress/commit/d1d6a7c))
- **debugger:** not update focused message if debugger is hidden ([8a6830c](https://github.com/botpress/botpress/commit/8a6830c))
- **debugger:** theme better fits in the layout ([7b459ef](https://github.com/botpress/botpress/commit/7b459ef))
- **debugger:** unsubscribe from debugger when unmounting component ([5afd183](https://github.com/botpress/botpress/commit/5afd183))
- **event-collector:** issue with high load (double-saving) ([5eb93ac](https://github.com/botpress/botpress/commit/5eb93ac))
- **extensions:** debugger style refactor ([4bea803](https://github.com/botpress/botpress/commit/4bea803))
- **extensions:** minor style change ([2c3e167](https://github.com/botpress/botpress/commit/2c3e167))
- **flow:** remove suggested double curly braces from transition ([efe13cb](https://github.com/botpress/botpress/commit/efe13cb))
- **flow:** smart input placeholder overflows outside component ([d740411](https://github.com/botpress/botpress/commit/d740411))
- **flow-builder:** displaying problems (missing nodes) ([50823bd](https://github.com/botpress/botpress/commit/50823bd))
- **flow-builder:** Fix node copy ([62c38ad](https://github.com/botpress/botpress/commit/62c38ad))
- **flow-builder:** fixed state of usable buttons ([6bf70d9](https://github.com/botpress/botpress/commit/6bf70d9))
- **ghost:** fix typing & added bots existing scope ([5a513a0](https://github.com/botpress/botpress/commit/5a513a0))
- **gulp:** added shortcut to symlink all modules ([079b6c0](https://github.com/botpress/botpress/commit/079b6c0))
- **history:** styling to make "Load More" button visible all the time ([188140a](https://github.com/botpress/botpress/commit/188140a))
- **hitl:** quick fix render quick reply ([d84d693](https://github.com/botpress/botpress/commit/d84d693))
- **lang:** loading in series to get correct consumption reading ([5ad48d1](https://github.com/botpress/botpress/commit/5ad48d1))
- **lang:** module still loads if one endpoint is unreachable ([f84b2ef](https://github.com/botpress/botpress/commit/f84b2ef))
- **lang:** streamline lang checks & fix response when erroring ([e9cf6cc](https://github.com/botpress/botpress/commit/e9cf6cc))
- **lang-server:** hide add language if there is none available ([55d8c11](https://github.com/botpress/botpress/commit/55d8c11))
- **logs:** added color for studio viewer ([99d663d](https://github.com/botpress/botpress/commit/99d663d))
- **logs:** added spacing when available ([8ed1686](https://github.com/botpress/botpress/commit/8ed1686))
- **logs:** fixed botId & missing entries ([cf77920](https://github.com/botpress/botpress/commit/cf77920))
- **migrations:** issue when using binaries ([e9bc2ee](https://github.com/botpress/botpress/commit/e9bc2ee))
- **module-loader:** files were recreated on windows ([5eedae3](https://github.com/botpress/botpress/commit/5eedae3))
- **nlu:** add 'any' slots in slot collection ([973d226](https://github.com/botpress/botpress/commit/973d226))
- **nlu:** added missing dependency ([adc488f](https://github.com/botpress/botpress/commit/adc488f))
- **nlu:** ambiguity set to 10% range ([76dfc52](https://github.com/botpress/botpress/commit/76dfc52))
- **nlu:** ambiguous flag only when multiple intents ([1eea4a3](https://github.com/botpress/botpress/commit/1eea4a3))
- **nlu:** confusion engine working properly ([75fcb1a](https://github.com/botpress/botpress/commit/75fcb1a))
- **nlu:** Confusion won't display in Status bar if more than one context ([d25062b](https://github.com/botpress/botpress/commit/d25062b))
- **nlu:** contextual L0 classification ([d521ff9](https://github.com/botpress/botpress/commit/d521ff9))
- **nlu:** deps issue ([72566b1](https://github.com/botpress/botpress/commit/72566b1))
- **nlu:** deps issue on nlu ([839999a](https://github.com/botpress/botpress/commit/839999a))
- **nlu:** exact matcher ([e5dc865](https://github.com/botpress/botpress/commit/e5dc865))
- **nlu:** five folder requires train dataset ([cbf7a55](https://github.com/botpress/botpress/commit/cbf7a55))
- **nlu:** hide empty confusions from admin UI ([2868a3d](https://github.com/botpress/botpress/commit/2868a3d))
- **nlu:** intent classification w/o slots ([00ee463](https://github.com/botpress/botpress/commit/00ee463))
- **nlu:** intent detection fix w/ slots ([294f3f8](https://github.com/botpress/botpress/commit/294f3f8))
- **nlu:** intent matching sentence sanitization ([c0dd4ac](https://github.com/botpress/botpress/commit/c0dd4ac))
- **nlu:** Intents contexts forgotten when creating training sets ([2700861](https://github.com/botpress/botpress/commit/2700861))
- **nlu:** kmeans splitting of intent utterances ([df5e5e7](https://github.com/botpress/botpress/commit/df5e5e7))
- **nlu:** log error only when it was thrown for an unexpected reason ([a881a18](https://github.com/botpress/botpress/commit/a881a18))
- **nlu:** much smaller K for k-means search ([b988c3b](https://github.com/botpress/botpress/commit/b988c3b))
- **nlu:** only train models for languages that are loaded ([ab768fe](https://github.com/botpress/botpress/commit/ab768fe))
- **nlu:** skip intent extraction + slot extraction if no intent ([8b74ede](https://github.com/botpress/botpress/commit/8b74ede))
- **nlu:** skip intent prediction after exact match if not enough utterances ([0fbf5c6](https://github.com/botpress/botpress/commit/0fbf5c6))
- **nlu:** slot extraction extracts single slot ([db1af49](https://github.com/botpress/botpress/commit/db1af49))
- **nlu:** slot tagger selects best slot suggestion ([c6b9136](https://github.com/botpress/botpress/commit/c6b9136))
- **nlu:** slots can have multiple entities ([c64bddc](https://github.com/botpress/botpress/commit/c64bddc))
- **nlu:** tfidf capped between 0.5 and 2.0 ([e95bdac](https://github.com/botpress/botpress/commit/e95bdac))
- **nlu:** tfidf.. tf weight on avg ([9d8e1ec](https://github.com/botpress/botpress/commit/9d8e1ec))
- **nlu:** tokenizer should not lower case ([856bb25](https://github.com/botpress/botpress/commit/856bb25))
- **nlu:** wrap lang server connection error and process exit ([a7d0051](https://github.com/botpress/botpress/commit/a7d0051))
- **NLU:** send only what we want in IO ([b372bdc](https://github.com/botpress/botpress/commit/b372bdc))
- **qna:** Json parse error in small talk qna template ([a221a64](https://github.com/botpress/botpress/commit/a221a64))
- **qna:** qna add new state is cleared when submitting ([9322943](https://github.com/botpress/botpress/commit/9322943))
- **shortcuts:** better ux with shortcuts & standardized mac/win ([01278d2](https://github.com/botpress/botpress/commit/01278d2))
- **shortcuts:** ctrl+e toggles the emulator even when input focused ([767ec0b](https://github.com/botpress/botpress/commit/767ec0b))
- **shortcuts:** using same shortcuts on windows/mac ([e816cdb](https://github.com/botpress/botpress/commit/e816cdb))
- **side panel:** fix cap case typo in imports ([07e7502](https://github.com/botpress/botpress/commit/07e7502))
- **slots:** retryAttempts not reloading ([e3ead2c](https://github.com/botpress/botpress/commit/e3ead2c))
- **status-bar:** clarified error message & doc link ([a929ecc](https://github.com/botpress/botpress/commit/a929ecc))
- **studio:** added again reactstrap ([1d99615](https://github.com/botpress/botpress/commit/1d99615))
- **studio:** added support for typescript files ([fca19e2](https://github.com/botpress/botpress/commit/fca19e2))
- **studio:** always see the entire flow ([303ec7d](https://github.com/botpress/botpress/commit/303ec7d))
- **studio:** guided tour text ([cf1da57](https://github.com/botpress/botpress/commit/cf1da57))
- **studio:** highlighted nodes styling ([4ed253e](https://github.com/botpress/botpress/commit/4ed253e))
- **studio:** overflow logs ([4960543](https://github.com/botpress/botpress/commit/4960543))
- **studio:** overflow on JSON payload ([f708fd8](https://github.com/botpress/botpress/commit/f708fd8))
- **studio:** smartinput zindex ([997a233](https://github.com/botpress/botpress/commit/997a233))
- **telegram:** multi-bot support via webhooks ([c5b4e1b](https://github.com/botpress/botpress/commit/c5b4e1b))
- **testing:** taking scoped user id ([bae011d](https://github.com/botpress/botpress/commit/bae011d))
- **web-channel:** botInfo page config override ([dc28f63](https://github.com/botpress/botpress/commit/dc28f63))
- **webchat:** history behavior & convo resilience ([b54f075](https://github.com/botpress/botpress/commit/b54f075))

### Features

- **admin:** enable bot import from the UI ([d10e140](https://github.com/botpress/botpress/commit/d10e140))
- **channel-web:** ctrl+enter reset current session then send ([11bd4b9](https://github.com/botpress/botpress/commit/11bd4b9))
- **channel-web:** Right click message to debug ([a45c365](https://github.com/botpress/botpress/commit/a45c365))
- **code-editor:** added some enhancements and mobx ([aabc8f2](https://github.com/botpress/botpress/commit/aabc8f2))
- **code-editor:** delete and rename actions and hooks in code-editor ([ec7046a](https://github.com/botpress/botpress/commit/ec7046a))
- **code-editor:** No message displayed when no error ([ffececd](https://github.com/botpress/botpress/commit/ffececd))
- **code-editro:** added some enhancements and mobx ([946c1a5](https://github.com/botpress/botpress/commit/946c1a5))
- **core:** crawling actions to find var hints ([5720733](https://github.com/botpress/botpress/commit/5720733))
- **debugger:** display all intents in debugger ([a469b0b](https://github.com/botpress/botpress/commit/a469b0b))
- **debugger:** switch selected message when a new one is sent ([375fe1e](https://github.com/botpress/botpress/commit/375fe1e))
- **emulator:** Debugger summary UI ([d9faafe](https://github.com/botpress/botpress/commit/d9faafe))
- **event-storage:** store events for further analysis ([47d4f63](https://github.com/botpress/botpress/commit/47d4f63))
- **extensions:** Debugger retry fetching a message few times when it is not found ([08af438](https://github.com/botpress/botpress/commit/08af438))
- **history:** add history module which displays conversations history for bot ([251fcc0](https://github.com/botpress/botpress/commit/251fcc0))
- **history:** Allow user to flag and unflag messages ([3235f87](https://github.com/botpress/botpress/commit/3235f87))
- **history:** integrate generic toolbar in history module ([08e908f](https://github.com/botpress/botpress/commit/08e908f))
- **history:** tooltip when copy link + pretty downloaded json ([1f72934](https://github.com/botpress/botpress/commit/1f72934))
- **lang:** added tooltip to show current download size vs total ([31e0805](https://github.com/botpress/botpress/commit/31e0805))
- **lang-server:** added condition on lang http param + small refactor ([a17eda1](https://github.com/botpress/botpress/commit/a17eda1))
- **migration-service:** Implemented migrations ([f3cf57e](https://github.com/botpress/botpress/commit/f3cf57e))
- **ml:** added node-svm with bindings ([ee83ef9](https://github.com/botpress/botpress/commit/ee83ef9))
- **mltoolkit:** add ml based tokenizer ([d1a5262](https://github.com/botpress/botpress/commit/d1a5262))
- **nlu:** caching of token vectors and junk ([e0cd696](https://github.com/botpress/botpress/commit/e0cd696))
- importbot ([7bca21a](https://github.com/botpress/botpress/commit/7bca21a))
- **nlu:** display nlu confusion matrix status ([54b7fa2](https://github.com/botpress/botpress/commit/54b7fa2))
- **nlu:** min nb of utt for ML classification ([8788a26](https://github.com/botpress/botpress/commit/8788a26))
- **nlu:** oov tfidf ([964721b](https://github.com/botpress/botpress/commit/964721b))
- **nlu:** vectorizing words by API ([e9cefaa](https://github.com/botpress/botpress/commit/e9cefaa))
- **NLU:** Ambiguity ([c6f9395](https://github.com/botpress/botpress/commit/c6f9395))
- **NLU:** SVM based intent classification ([9d5f4fe](https://github.com/botpress/botpress/commit/9d5f4fe))
- **qna:** QNA import and export use JSON format for QNA items ([f11ca7c](https://github.com/botpress/botpress/commit/f11ca7c))
- **studio:** added auto-complete suggestions in all app inputs ([a054464](https://github.com/botpress/botpress/commit/a054464))
- **studio:** added bottom panel ([0ca812c](https://github.com/botpress/botpress/commit/0ca812c))
- **templates:** bilingual small talk ([9c41b4f](https://github.com/botpress/botpress/commit/9c41b4f))
- **testing:** creating scenarios from the webchat ([ffed9e4](https://github.com/botpress/botpress/commit/ffed9e4))
- **ui:** shared layout components for better ux ([cdb5526](https://github.com/botpress/botpress/commit/cdb5526))

## [11.9.6](https://github.com/botpress/botpress/compare/v11.9.5...v11.9.6) (2019-07-01)

### Bug Fixes

- **call-api:** missing headers on reload ([6f46a37](https://github.com/botpress/botpress/commit/6f46a37))
- **choices:** use content picker and fix retry attempts ([ad4ea28](https://github.com/botpress/botpress/commit/ad4ea28))
- **hitl:** added trim in hitl textarea ([f28eb08](https://github.com/botpress/botpress/commit/f28eb08))
- **hitl:** display last user visit ([0694c2a](https://github.com/botpress/botpress/commit/0694c2a))
- **hitl:** display messages of type quick_reply in hitl module ([b38d426](https://github.com/botpress/botpress/commit/b38d426))
- **hitl:** render quick replies in hitl module ([941037f](https://github.com/botpress/botpress/commit/941037f))

### Features

- **hitl:** display last user visit ([262de34](https://github.com/botpress/botpress/commit/262de34))

## [11.9.5](https://github.com/botpress/botpress/compare/v11.9.4...v11.9.5) (2019-06-21)

### Bug Fixes

- **core:** added memory cache limits ([4732f3f](https://github.com/botpress/botpress/commit/4732f3f))
- **core:** object caching uses proper key ([ef3c460](https://github.com/botpress/botpress/commit/ef3c460))
- **hitl:** pause on quick reply ([c3edfbd](https://github.com/botpress/botpress/commit/c3edfbd))
- **hitl:** swallow quick reply message type ([1392d97](https://github.com/botpress/botpress/commit/1392d97))
- **messenger:** typing indicators and postback button ([9aadeb9](https://github.com/botpress/botpress/commit/9aadeb9))
- continue instead of return ([07f4a5a](https://github.com/botpress/botpress/commit/07f4a5a))
- validate entry.messaging exists ([99aae8b](https://github.com/botpress/botpress/commit/99aae8b))
- **pro:** fixed "built with pro" variable ([9183293](https://github.com/botpress/botpress/commit/9183293))
- **webchat:** scroll to the very bottom of the chat on open ([44857fd](https://github.com/botpress/botpress/commit/44857fd))

## [11.9.4](https://github.com/botpress/botpress/compare/v11.9.3...v11.9.4) (2019-06-12)

### Bug Fixes

- do not create revisions for models ([4347826](https://github.com/botpress/botpress/commit/4347826))
- don't record revisions for botpress and workspaces configs ([b60f5c1](https://github.com/botpress/botpress/commit/b60f5c1))
- expose getAttributes from UserRepository ([82ddeca](https://github.com/botpress/botpress/commit/82ddeca))
- Expose getAttributes from UserRepository ([e2faeee](https://github.com/botpress/botpress/commit/e2faeee))
- **core:** resources-loader doesn't over-create files ([b21c311](https://github.com/botpress/botpress/commit/b21c311))
- ghost use soft delete when deleting a folder ([c026d03](https://github.com/botpress/botpress/commit/c026d03))
- null context_expiry caused sessions to never timeout ([1d558eb](https://github.com/botpress/botpress/commit/1d558eb))
- **core:** resources-loader doesn't over-create files ([38ae8d7](https://github.com/botpress/botpress/commit/38ae8d7))
- **hooks:** before session timeout not being executed ([951ba9b](https://github.com/botpress/botpress/commit/951ba9b))
- **testing:** made ghost always dirty with duplicate .recorder.js ([fbb1c24](https://github.com/botpress/botpress/commit/fbb1c24))
- **tests:** fixed memory queue tests ([61445d7](https://github.com/botpress/botpress/commit/61445d7))

### Features

- **channel-web:** configurable messages history ([d52d455](https://github.com/botpress/botpress/commit/d52d455))
- **core:** added security namespace ([e5eb2e4](https://github.com/botpress/botpress/commit/e5eb2e4))
- **web:** added ability to create trusted reference ([14d8cb6](https://github.com/botpress/botpress/commit/14d8cb6))

## [11.9.3](https://github.com/botpress/botpress/compare/v11.9.2...v11.9.3) (2019-06-06)

### Bug Fixes

- **basic-skills:** syntax error ([04a32e4](https://github.com/botpress/botpress/commit/04a32e4))
- **core:** removed machineV1 fingerprint ([b69ea15](https://github.com/botpress/botpress/commit/b69ea15))
- **pro:** licensing on openshift ([a6ae4ff](https://github.com/botpress/botpress/commit/a6ae4ff))

## [11.9.2](https://github.com/botpress/botpress/compare/v11.9.1...v11.9.2) (2019-06-05)

### Bug Fixes

- **core:** added flow cache invalidation ([f1ca9ef](https://github.com/botpress/botpress/commit/f1ca9ef))
- **core:** missing file ([f92ae68](https://github.com/botpress/botpress/commit/f92ae68))
- **pro:** SAML authentication options ([d22bd16](https://github.com/botpress/botpress/commit/d22bd16))
- **qna:** remove qna file when qna is disabled ([1d3569f](https://github.com/botpress/botpress/commit/1d3569f))
- **slot:** fix max attempt check ([ca703e8](https://github.com/botpress/botpress/commit/ca703e8))

### Features

- **core:** add .ghostignore to exclude files from tracking ([387668e](https://github.com/botpress/botpress/commit/387668e))

## [11.9.1](https://github.com/botpress/botpress/compare/v11.9.0...v11.9.1) (2019-05-31)

### Bug Fixes

- **admin:** Enable overwrite destination on copy ([72af1e7](https://github.com/botpress/botpress/commit/72af1e7))
- **core:** fixes checksum check of ghost in DB driver ([6c45eb6](https://github.com/botpress/botpress/commit/6c45eb6))
- **nlu:** missing source value ([01abed8](https://github.com/botpress/botpress/commit/01abed8))
- **nlu:** prevent token duplicates in source ([46cd03b](https://github.com/botpress/botpress/commit/46cd03b))

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

- **dialog-engine:** set channel name dynamically ([e86ca6d](https://github.com/botpress/botpress/commit/e86ca6d))
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
- **module-builder:** undefined assignment ([8257084](https://github.com/botpress/botpress/commit/8257084))
- **nlu:** avoid extracting substring of longer entities ([e08ed56](https://github.com/botpress/botpress/commit/e08ed56))
- **nlu:** disabling duckling when unreachable on server start ([7b15cfe](https://github.com/botpress/botpress/commit/7b15cfe))
- **nlu:** entities extraction fix (whole entities) ([3259547](https://github.com/botpress/botpress/commit/3259547))
- **nlu:** fix issue in certain conditions with multiple slots ([78f6bf5](https://github.com/botpress/botpress/commit/78f6bf5))
- **nlu:** map series ([c88c175](https://github.com/botpress/botpress/commit/c88c175))
- **nlu:** null pointer and avoid comparing empty strings ([6489afe](https://github.com/botpress/botpress/commit/6489afe))
- **nlu:** patterns tests ([927a9fa](https://github.com/botpress/botpress/commit/927a9fa))
- **nlu:** slot tagger fastText args ([2e1c64f](https://github.com/botpress/botpress/commit/2e1c64f))
- **qna:** categories are trimmed ([a977c9e](https://github.com/botpress/botpress/commit/a977c9e))
- **studio:** removed useless emulator settings ([3c03162](https://github.com/botpress/botpress/commit/3c03162))
- **studio:** statusBar styling ([4e5718d](https://github.com/botpress/botpress/commit/4e5718d))
- **ux:** minor ui adjustments ([c72d96a](https://github.com/botpress/botpress/commit/c72d96a))

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
- **nlu:** extract API endpoint ([ee1cb2f](https://github.com/botpress/botpress/commit/ee1cb2f))
- **nlu:** fix slot issues (no color, can't pick) ([64083c7](https://github.com/botpress/botpress/commit/64083c7))
- **nlu:** slot tagger clustering ([b074a1b](https://github.com/botpress/botpress/commit/b074a1b))
- **qna:** automatically remove duplicated questions ([78e3bff](https://github.com/botpress/botpress/commit/78e3bff))
- **sdk:** dialogEngine processEvent return type ([51133d4](https://github.com/botpress/botpress/commit/51133d4))
- **single_choice:** parse answer with nlu ([f75c085](https://github.com/botpress/botpress/commit/f75c085))
- **skill-choice:** comparison issue for some events ([8595b63](https://github.com/botpress/botpress/commit/8595b63))
- **studio:** CMS buttons unresponsive in flow editor ([ea4c056](https://github.com/botpress/botpress/commit/ea4c056))
- **studio:** emulator better reset shortcut ([b9e9812](https://github.com/botpress/botpress/commit/b9e9812))
- **studio:** react warnings ([6cdfc8d](https://github.com/botpress/botpress/commit/6cdfc8d))
- **web:** injection delay before adding css ([2501b27](https://github.com/botpress/botpress/commit/2501b27))
- **webchat:** reduced size of bundle by 1mb ([fbbc861](https://github.com/botpress/botpress/commit/fbbc861))

### Features

- **admin:** added tab option to use the full page width ([5aed5ed](https://github.com/botpress/botpress/commit/5aed5ed))
- **alerting:** triggers a hook when threshold exceeded ([18dbb0e](https://github.com/botpress/botpress/commit/18dbb0e))
- **bot:** added more configuration options & details ([2c584ed](https://github.com/botpress/botpress/commit/2c584ed))
- **channel-web:** added custom components support ([732f2b6](https://github.com/botpress/botpress/commit/732f2b6))
- **channel-web:** added methods to override visual components ([2cfeeb5](https://github.com/botpress/botpress/commit/2cfeeb5))
- **channels:** initial telegram implementation ([f231ee3](https://github.com/botpress/botpress/commit/f231ee3))
- **core:** add proxy support for external calls ([c3432ec](https://github.com/botpress/botpress/commit/c3432ec))
- **core:** added to 'flowGenerator' second parameter with metadata ([bc7640b](https://github.com/botpress/botpress/commit/bc7640b))
- **core:** change 'flowGenerator' to async method ([6e0330c](https://github.com/botpress/botpress/commit/6e0330c))
- **core:** native extensions allow for multiple distributions ([41b1d24](https://github.com/botpress/botpress/commit/41b1d24))
- **credentials:** added external auth support for secure communication ([ccaa3b6](https://github.com/botpress/botpress/commit/ccaa3b6))
- **emulator:** added possibility to send raw payload ([fb45615](https://github.com/botpress/botpress/commit/fb45615))
- **logs:** added file output for logs ([f65ea28](https://github.com/botpress/botpress/commit/f65ea28))
- **monitoring:** added multi-node monitoring system ([f4ebfd5](https://github.com/botpress/botpress/commit/f4ebfd5))
- **nlu:** added a couple of pretrained language models ([b27f68c](https://github.com/botpress/botpress/commit/b27f68c))
- **nlu:** added confusion mapping ([24359c8](https://github.com/botpress/botpress/commit/24359c8))
- **nlu:** backend impl of confusion matrix ([ba9da63](https://github.com/botpress/botpress/commit/ba9da63))
- **nlu:** fastText overrides ([66193c3](https://github.com/botpress/botpress/commit/66193c3))
- **nlu:** masking sensitive text for entities ([3b8a910](https://github.com/botpress/botpress/commit/3b8a910))
- **nlu:** using pretrained word vectors ([135083d](https://github.com/botpress/botpress/commit/135083d))
- conditional http session ([29cb4ca](https://github.com/botpress/botpress/commit/29cb4ca))
- enable templating in content element formData ([9911217](https://github.com/botpress/botpress/commit/9911217))
- **reboot:** added method & config to reboot server ([7b38b6e](https://github.com/botpress/botpress/commit/7b38b6e))
- **sdk:** file manager is exposed via the sdk ([08edf20](https://github.com/botpress/botpress/commit/08edf20))
- **security:** logging security events ([3973cc7](https://github.com/botpress/botpress/commit/3973cc7))
- **web:** customizable css ([f9d3358](https://github.com/botpress/botpress/commit/f9d3358))
- **web:** implemented timezone (resolve [#1415](https://github.com/botpress/botpress/issues/1415)) ([24e7793](https://github.com/botpress/botpress/commit/24e7793))
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
- **qna:** correctly selecting global and ui adjustments ([f9faad6](https://github.com/botpress/botpress/commit/f9faad6))
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
- **core:** ghost content on postgres ([9ccacc6](https://github.com/botpress/botpress/commit/9ccacc6))
- **flow:** now clearer that transition node is optional ([3af2e49](https://github.com/botpress/botpress/commit/3af2e49))
- **nlu:** fixed unnecessary syncs ([54736d9](https://github.com/botpress/botpress/commit/54736d9))
- **nlu:** focus first box on enter ([9cd7e24](https://github.com/botpress/botpress/commit/9cd7e24))
- **qna:** added a check to prevent duplicated qna ([be359be](https://github.com/botpress/botpress/commit/be359be))
- **qna:** default categories ([12a8c72](https://github.com/botpress/botpress/commit/12a8c72))
- **qna:** styling fixes ([45ac054](https://github.com/botpress/botpress/commit/45ac054))
- **qna:** update references to a node when its name change ([4b7ecbc](https://github.com/botpress/botpress/commit/4b7ecbc))
- **ui:** display nb of catchalls in flow ([0b38455](https://github.com/botpress/botpress/commit/0b38455))

### Features

- **core:** notify the end-user when an error has occurred in the dialog engine ([ad78502](https://github.com/botpress/botpress/commit/ad78502))
- **emulator:** added shortcut to reset session ([7bfb405](https://github.com/botpress/botpress/commit/7bfb405))
- **emulator:** added shortcuts from emulator to intent/qna + flow ed ([9c1959c](https://github.com/botpress/botpress/commit/9c1959c))
- **emulator:** added toggle button for typing indicator ([c752a16](https://github.com/botpress/botpress/commit/c752a16))

## [11.4.1](https://github.com/botpress/botpress/compare/v11.3.0...v11.4.1) (2019-01-31)

### Bug Fixes

- **channel-web:** fixed event params and removed unnecessary db call ([17671fc](https://github.com/botpress/botpress/commit/17671fc))
- **core:** check if bot is mounted ([19a5468](https://github.com/botpress/botpress/commit/19a5468))
- **core:** fastText fix on linux/docker ([7d8a84b](https://github.com/botpress/botpress/commit/7d8a84b))
- **core:** ghost syncs all dirs ([ab90df6](https://github.com/botpress/botpress/commit/ab90df6))
- **core:** jumpTo executes the target flow catchAll transitions ([6e70f4c](https://github.com/botpress/botpress/commit/6e70f4c))
- **core:** load non-required module config-keys from env-variables ([00d2c22](https://github.com/botpress/botpress/commit/00d2c22))
- **core:** pkg-fs copy files with dot ([bad858b](https://github.com/botpress/botpress/commit/bad858b))
- **core:** require modules and files.. fixes [#1258](https://github.com/botpress/botpress/issues/1258) fixes [#1252](https://github.com/botpress/botpress/issues/1252) ([1f23221](https://github.com/botpress/botpress/commit/1f23221))
- **db:** mem leak caused by wrong data type for channel user attributes ([b2c5017](https://github.com/botpress/botpress/commit/b2c5017))
- **dialog-engine:** skip transitions that contain the active node ([bd5f449](https://github.com/botpress/botpress/commit/bd5f449))
- **docs:** fix cross-links in docs (resolve [#1235](https://github.com/botpress/botpress/issues/1235)) ([234ea40](https://github.com/botpress/botpress/commit/234ea40))
- **docs:** try fixing links in tutorial (ref [#1235](https://github.com/botpress/botpress/issues/1235)) ([5383372](https://github.com/botpress/botpress/commit/5383372))
- **docs:** typo in README ([9bdd884](https://github.com/botpress/botpress/commit/9bdd884))
- **module-builder:** copy files starting with dot ([e2e308b](https://github.com/botpress/botpress/commit/e2e308b))
- **nlu:** better error on invalid JSON ([e9aa45e](https://github.com/botpress/botpress/commit/e9aa45e))
- **nlu:** faster faster faster ([453355b](https://github.com/botpress/botpress/commit/453355b))
- **nlu:** fix train on intent delete ([d6fb4cd](https://github.com/botpress/botpress/commit/d6fb4cd))
- **nlu:** logs on EPIPE error + instructions on fixing it ([2f01183](https://github.com/botpress/botpress/commit/2f01183))
- **nlu:** scrollbar styling ([176fa03](https://github.com/botpress/botpress/commit/176fa03))
- **NLU:** concurrent trainings ([83b9545](https://github.com/botpress/botpress/commit/83b9545))
- **NLU:** various fixes => see desc ([db04ed8](https://github.com/botpress/botpress/commit/db04ed8))
- **qna:** better error reporting ([9c86656](https://github.com/botpress/botpress/commit/9c86656))
- **qna:** fix qna train ([98a66fd](https://github.com/botpress/botpress/commit/98a66fd))
- **qna:** textual input bad ux ([5b9659e](https://github.com/botpress/botpress/commit/5b9659e))
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
- **qna:** add multiline support, ux adjustments ([91cc5f4](https://github.com/botpress/botpress/commit/91cc5f4))
- **web:** added config var for message length (resolve [#1298](https://github.com/botpress/botpress/issues/1298)) ([a442b43](https://github.com/botpress/botpress/commit/a442b43))
- **web-channel:** add an option to hide the conversations button ([d58158a](https://github.com/botpress/botpress/commit/d58158a))

# [11.3.0](https://github.com/botpress/botpress/compare/v11.2.0...v11.3.0) (2018-12-19)

### Bug Fixes

- **dialog-engine:** return to calling node support ([d1f92c8](https://github.com/botpress/botpress/commit/d1f92c8))
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
- **docs:** typo in release notes (resolve [#1181](https://github.com/botpress/botpress/issues/1181)) ([#1198](https://github.com/botpress/botpress/issues/1198)) ([1ada3c3](https://github.com/botpress/botpress/commit/1ada3c3))
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

### Features

- release v11.1 ([70b5020](https://github.com/botpress/botpress/commit/70b5020))
- **cms:** new manager, added modified on, small bug fix, cleanup ([af6fe86](https://github.com/botpress/botpress/commit/af6fe86))
- **knowledge:** basic knowledge index of PDF ([da95bd3](https://github.com/botpress/botpress/commit/da95bd3))
- **nlu:** create custom entities ([64b3571](https://github.com/botpress/botpress/commit/64b3571))
- **state-manager:** now loading bot-specific variables automatically ([8761846](https://github.com/botpress/botpress/commit/8761846))
- **studio:** add collapsible side bar ([acd794b](https://github.com/botpress/botpress/commit/acd794b))
- **studio:** add status bar and display nlu status ([d223aa8](https://github.com/botpress/botpress/commit/d223aa8))
- **templates:** added bot templates and features to modules ([f27f11b](https://github.com/botpress/botpress/commit/f27f11b))

# [11.1.0](https://github.com/botpress/botpress/compare/v11.0.4...v11.1.0) (2018-11-28)

### Bug Fixes

- **actions:** added metadata to hide actions in flow editor ([0708e0c](https://github.com/botpress/botpress/commit/0708e0c))
- **build:** watch studio was cleaning the build ([5c2cb4a](https://github.com/botpress/botpress/commit/5c2cb4a))
- **cache:** fixed paths and adjusted invalidator (ignored not working) ([2da8ced](https://github.com/botpress/botpress/commit/2da8ced))
- **channel-web:** avoir displaying undefined and visits in transcripts ([1ab9097](https://github.com/botpress/botpress/commit/1ab9097))
- **channel-web:** empty messages are no longer sent ([1767d75](https://github.com/botpress/botpress/commit/1767d75))
- **channel-web:** preventing the ui buttons from disappearing ([c82a347](https://github.com/botpress/botpress/commit/c82a347))
- **cms:** added missing where condition ([bc5fc85](https://github.com/botpress/botpress/commit/bc5fc85))
- **converse:** circular reference when there is a timeout ([cec0950](https://github.com/botpress/botpress/commit/cec0950))
- **core:** bot routers await ([0130d46](https://github.com/botpress/botpress/commit/0130d46))
- **core:** issue when deleting a bot ([70e5998](https://github.com/botpress/botpress/commit/70e5998))
- **core:** performance boost & monitoring tools ([88cce21](https://github.com/botpress/botpress/commit/88cce21))
- **core:** reset nb of conversations after forget ([311ff48](https://github.com/botpress/botpress/commit/311ff48))
- **dialog-engine:** queue not processed correctly ([03bc2ab](https://github.com/botpress/botpress/commit/03bc2ab))
- **docs:** corrected path to assets ([0963d93](https://github.com/botpress/botpress/commit/0963d93))
- **engine:** add wait for message support ([6e098ca](https://github.com/botpress/botpress/commit/6e098ca))
- **flow:** allow empty transition to node and clear error ([514eacb](https://github.com/botpress/botpress/commit/514eacb))
- **hooks:** removed hook from cached scripts ([6ecc36a](https://github.com/botpress/botpress/commit/6ecc36a))
- **http:** using environment port if defined ([e91a0fe](https://github.com/botpress/botpress/commit/e91a0fe))
- **login:** handleError was swallowing errors ([66ff4b3](https://github.com/botpress/botpress/commit/66ff4b3))
- **login:** problem when logging in and password is expired ([394ed10](https://github.com/botpress/botpress/commit/394ed10))
- **misc:** minor fix to remove console warnings, and added keys ([f5b6abf](https://github.com/botpress/botpress/commit/f5b6abf))
- **nlu:** default confidence config ([b62f229](https://github.com/botpress/botpress/commit/b62f229))
- **nlu:** hidden intents checkbox now displayed correctly ([c8dd33e](https://github.com/botpress/botpress/commit/c8dd33e))
- **nlu-module:** fix rasa provider where q param is undefined ([481cc6a](https://github.com/botpress/botpress/commit/481cc6a))
- **performance:** various adjustments for better perfs ([50fedce](https://github.com/botpress/botpress/commit/50fedce))
- **pro:** removed misleading license warning ([46407b8](https://github.com/botpress/botpress/commit/46407b8))
- **qna:** linked label to checkbox and added null check ([8f0f727](https://github.com/botpress/botpress/commit/8f0f727))
- **skill-choice:** changed actions name ([c59f0aa](https://github.com/botpress/botpress/commit/c59f0aa))
- **skill-choice:** fixed issue with skill choice ([6a01aff](https://github.com/botpress/botpress/commit/6a01aff))
- **skill-choice:** prevent skill from auto-linking to entry node ([9acc12a](https://github.com/botpress/botpress/commit/9acc12a))
- **studio:** skills are no longer displayed as subflows ([4a4cd1e](https://github.com/botpress/botpress/commit/4a4cd1e))
- **ui:** support formfeedback in bot edit and creation ([be62a77](https://github.com/botpress/botpress/commit/be62a77))
- **ux:** minor adjustments to different elements ([ad4f43d](https://github.com/botpress/botpress/commit/ad4f43d))

### Features

- **channel-web:** recall old messages with arrows ([e187d1e](https://github.com/botpress/botpress/commit/e187d1e))
- **config:** added a way to configure an external url ([be33fa8](https://github.com/botpress/botpress/commit/be33fa8))
- **core:** add converse api ([de098dd](https://github.com/botpress/botpress/commit/de098dd))
- **core:** add the converse api ([1e89a88](https://github.com/botpress/botpress/commit/1e89a88))
- **decision-engine:** added suggested replies ([d82b49a](https://github.com/botpress/botpress/commit/d82b49a))
- **decision-engine:** cycle through suggested replies when the result is not what was expected ([466a148](https://github.com/botpress/botpress/commit/466a148))
- **misc:** delete shortcut for flow and displaying more content items ([f2ab084](https://github.com/botpress/botpress/commit/f2ab084))
- **storage:** implement expiration date for user attributes ([7d2b9a0](https://github.com/botpress/botpress/commit/7d2b9a0))

## [11.0.4](https://github.com/botpress/botpress/compare/v11.0.2...v11.0.4) (2018-11-13)

### Bug Fixes

- **build:** update commands ([18a7c2c](https://github.com/botpress/botpress/commit/18a7c2c))

## [11.0.2](https://github.com/botpress/botpress/compare/v11.0.1...v11.0.2) (2018-11-13)

### Bug Fixes

- **admin:** update bot route was wrong ([65af202](https://github.com/botpress/botpress/commit/65af202))
- **build:** added core before building admins ([afe12cf](https://github.com/botpress/botpress/commit/afe12cf))
- **build:** making sure that the folder exists before writing ([3cabbe2](https://github.com/botpress/botpress/commit/3cabbe2))
- **build:** optimized for packaging ([bf81a44](https://github.com/botpress/botpress/commit/bf81a44))
- **build:** remove unused gitmodule ([e6cdade](https://github.com/botpress/botpress/commit/e6cdade))
- **build:** starting docker daemon ([9c6caf7](https://github.com/botpress/botpress/commit/9c6caf7))
- **channel-web:** axios config not set correctly ([0919140](https://github.com/botpress/botpress/commit/0919140))

## [11.0.1](https://github.com/botpress/botpress/compare/v11.0.0...v11.0.1) (2018-11-13)

### Bug Fixes

- **actions:** added process.env to actions vm ([d4cf0d3](https://github.com/botpress/botpress/commit/d4cf0d3))
- **analytics:** upgraded recharts ([2b92db7](https://github.com/botpress/botpress/commit/2b92db7))
- **build:** added missing step for studio when bootstrapping ([3fc054d](https://github.com/botpress/botpress/commit/3fc054d))
- **build:** cleaning studio assets to remove symlink ([48a74c3](https://github.com/botpress/botpress/commit/48a74c3))
- **build:** common was required in ui before it was built ([c397535](https://github.com/botpress/botpress/commit/c397535))
- seems like merge conflict stuff ([121d177](https://github.com/botpress/botpress/commit/121d177))
- **build:** fixed codebuild and dockerfile ([f8e6b8e](https://github.com/botpress/botpress/commit/f8e6b8e))
- **build:** packaging in production mode ([0154783](https://github.com/botpress/botpress/commit/0154783))
- **ci:** chmod codebuild-extras ([dbafd7c](https://github.com/botpress/botpress/commit/dbafd7c))
- **core:** default to verbose when not in production ([277f1e1](https://github.com/botpress/botpress/commit/277f1e1))
- **core:** jumpTo was not reloading flows ([922d7c3](https://github.com/botpress/botpress/commit/922d7c3))
- **core:** log watcher errors instead of crashing ([f7e955f](https://github.com/botpress/botpress/commit/f7e955f))
- **core:** outgoing queue causes a bottleneck with await ([99688b4](https://github.com/botpress/botpress/commit/99688b4))
- **core:** restore commintlint rules ([8f7f546](https://github.com/botpress/botpress/commit/8f7f546))
- **docs:** missing trailing slash ([a07f5b9](https://github.com/botpress/botpress/commit/a07f5b9))
- **docs:** put back CHANGELOG.md (resolve [#1063](https://github.com/botpress/botpress/issues/1063)) ([#1066](https://github.com/botpress/botpress/issues/1066)) ([b1cb313](https://github.com/botpress/botpress/commit/b1cb313))
- **ghost:** fixed ghost w/o proxy ([ce5afff](https://github.com/botpress/botpress/commit/ce5afff))
- **nlu:** adding EOL to fix nlu prediction issue ([35d7cd4](https://github.com/botpress/botpress/commit/35d7cd4))
- **nlu:** changed training parameters ([b6bf8a0](https://github.com/botpress/botpress/commit/b6bf8a0))
- **pro:** removed proxy reference ([6b232ac](https://github.com/botpress/botpress/commit/6b232ac))
- **queue:** fix outgoing queue ([694dafc](https://github.com/botpress/botpress/commit/694dafc))
- **queue:** users are now in their own queue ([c1a76a9](https://github.com/botpress/botpress/commit/c1a76a9))
- **router:** added async handler for skill routes ([ffcde57](https://github.com/botpress/botpress/commit/ffcde57))
- **studio:** compiled studio as production ([7795a45](https://github.com/botpress/botpress/commit/7795a45))
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
- change btn create bot now -> create bot ([93a6267](https://github.com/botpress/botpress/commit/93a6267))
- remove unused method ([bbfbc6b](https://github.com/botpress/botpress/commit/bbfbc6b))
- **analytics:** return empty object when analytics are not yet compiled ([c280298](https://github.com/botpress/botpress/commit/c280298))
- **core:** issue on windows with sqlite journal ([3d7e89f](https://github.com/botpress/botpress/commit/3d7e89f))
- **docs:** updated paths ([1abe1be](https://github.com/botpress/botpress/commit/1abe1be))
- **ui-admin:** disabled licensing in CE ([b88f894](https://github.com/botpress/botpress/commit/b88f894))

# [10.50.0](https://github.com/botpress/botpress/compare/v10.49.0...v10.50.0) (2018-10-31)

### Bug Fixes

- unlicensed in sidebarfooter ([8660a84](https://github.com/botpress/botpress/commit/8660a84))
- **hitl:** swallow quick reply message type ([b74d928](https://github.com/botpress/botpress/commit/b74d928))

### Features

- **qna:** add typing time when bot answer to a question ([b97d074](https://github.com/botpress/botpress/commit/b97d074))

# [10.49.0](https://github.com/botpress/botpress/compare/v10.48.5...v10.49.0) (2018-10-30)

### Bug Fixes

- **hitl:** using insertAndRetrieve for hitl sessions ([52892a7](https://github.com/botpress/botpress/commit/52892a7))
- **lifecycle:** on services loaded lifecycle event ([1dee516](https://github.com/botpress/botpress/commit/1dee516))
- **logger:** display stack trace even on debug ([58bb7c9](https://github.com/botpress/botpress/commit/58bb7c9))
- add admin link, move select bot, fix help btn ([1ebf8f3](https://github.com/botpress/botpress/commit/1ebf8f3))
- **xx:** added admin link and hidden menu when not xx ([fdd676b](https://github.com/botpress/botpress/commit/fdd676b))
- **xx:** minor adjustment for notifications ([74d9ae0](https://github.com/botpress/botpress/commit/74d9ae0))
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

- **core:** implemented migration for every modules ([#972](https://github.com/botpress/botpress/issues/972)) ([c771e34](https://github.com/botpress/botpress/commit/c771e34))

# [10.45.0](https://github.com/botpress/botpress/compare/v10.44.2...v10.45.0) (2018-10-01)

### Bug Fixes

- **channel-web:** allow tildas in user-ids ([#963](https://github.com/botpress/botpress/issues/963)) ([b69e88c](https://github.com/botpress/botpress/commit/b69e88c))
- **core:** disallow transitions to same node (resolve [#900](https://github.com/botpress/botpress/issues/900)) ([#962](https://github.com/botpress/botpress/issues/962)) ([cdfcd26](https://github.com/botpress/botpress/commit/cdfcd26))
- **core:** fix test running fresh bot ([a2969dc](https://github.com/botpress/botpress/commit/a2969dc))
- **core:** increase insertAndRetrieve test timeout ([676f5a5](https://github.com/botpress/botpress/commit/676f5a5))

### Features

- **nlu:** added age entity for LUIS ([d775214](https://github.com/botpress/botpress/commit/d775214))
- **nlu:** added unit property to LUIS entity ([0591136](https://github.com/botpress/botpress/commit/0591136))
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
- **webchat:** added 'flow to' action button ([e0120ca](https://github.com/botpress/botpress/commit/e0120ca))
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
- **core:** fixed imports filename case ([377572c](https://github.com/botpress/botpress/commit/377572c))
- **core:** flow-level timeoutNode property persists ([d143384](https://github.com/botpress/botpress/commit/d143384))
- **core:** increase node-version to 10 in new bot-template ([77d72a6](https://github.com/botpress/botpress/commit/77d72a6))
- **docs:** typo in skills ([f9bf04c](https://github.com/botpress/botpress/commit/f9bf04c))
- **event-engine:** loading now sync ([bef288e](https://github.com/botpress/botpress/commit/bef288e))
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
- **nlu:** added scroll for intents list (resolve [#846](https://github.com/botpress/botpress/issues/846)) ([52ca905](https://github.com/botpress/botpress/commit/52ca905))
- **web:** carousel btn as payload (resolve [#845](https://github.com/botpress/botpress/issues/845)) ([91dc91e](https://github.com/botpress/botpress/commit/91dc91e))

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

# [10.28.0](https://github.com/botpress/botpress/compare/v10.27.1...v10.28.0) (2018-08-03)

### Bug Fixes

- **hitl:** sqlite alert ([544aa41](https://github.com/botpress/botpress/commit/544aa41))
- **web:** added config options for showAvatar and showUserName ([c90ff5a](https://github.com/botpress/botpress/commit/c90ff5a))
- **web:** default config ([6f7fe72](https://github.com/botpress/botpress/commit/6f7fe72))
- **web:** download transcript config ([fe1a1c4](https://github.com/botpress/botpress/commit/fe1a1c4))
- **webchat:** display user's avatar and name if available (resolve [#803](https://github.com/botpress/botpress/issues/803)) ([7a57186](https://github.com/botpress/botpress/commit/7a57186))

### Features

- **channel-web:** implement the new message type ([49f3159](https://github.com/botpress/botpress/commit/49f3159))
- **web:** implemented downloading conversation (resolve [#802](https://github.com/botpress/botpress/issues/802)) ([ee8ec8a](https://github.com/botpress/botpress/commit/ee8ec8a))
- **webchat:** start new feature on timeout (resovle [#805](https://github.com/botpress/botpress/issues/805)) ([5b6f89d](https://github.com/botpress/botpress/commit/5b6f89d))

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
- **docs:** added tutorial for messenger configuration ([732d2e5](https://github.com/botpress/botpress/commit/732d2e5))
- **slack:** added method for update config (resolve [#705](https://github.com/botpress/botpress/issues/705)) ([fb96afd](https://github.com/botpress/botpress/commit/fb96afd))
- **telegram:** fix telegram load (resolve [#733](https://github.com/botpress/botpress/issues/733)) ([a726c9c](https://github.com/botpress/botpress/commit/a726c9c))
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

## [10.22.4](https://github.com/botpress/botpress/compare/v10.22.3...v10.22.4) (2018-07-11)

### Bug Fixes

- improper new calls ([3e7ed8f](https://github.com/botpress/botpress/commit/3e7ed8f))
- **skill:** pull choices (resolve [#711](https://github.com/botpress/botpress/issues/711)) ([d439f0a](https://github.com/botpress/botpress/commit/d439f0a))
- restore log archive loading using axios ([0534fac](https://github.com/botpress/botpress/commit/0534fac))
- **core:** ghost-sync ignores deleting missing files ([f8f7f27](https://github.com/botpress/botpress/commit/f8f7f27))
- **core:** remove now unneeded evals ([f718d92](https://github.com/botpress/botpress/commit/f718d92))
- **flow:** change a text el to an action ([474c362](https://github.com/botpress/botpress/commit/474c362))
- **logs:** remove now unneeded logs secret key ([3c57c06](https://github.com/botpress/botpress/commit/3c57c06))
- **slack:** made readme up to date ([3278e04](https://github.com/botpress/botpress/commit/3278e04))
- **template:** change .gitignore (resolve [#601](https://github.com/botpress/botpress/issues/601)) ([5018009](https://github.com/botpress/botpress/commit/5018009))

### Features

- **chat:** added 'ref' query into [host]/s/chat (resolve [#721](https://github.com/botpress/botpress/issues/721)) ([c5525c7](https://github.com/botpress/botpress/commit/c5525c7))

## [10.22.3](https://github.com/botpress/botpress/compare/v10.22.2...v10.22.3) (2018-07-05)

### Bug Fixes

- **dialog:** handle race conditions ([481314d](https://github.com/botpress/botpress/commit/481314d))
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
- **core:** enable modules config watching (resolve [#519](https://github.com/botpress/botpress/issues/519)) ([e2cbfad](https://github.com/botpress/botpress/commit/e2cbfad))
- **core:** make sqlite3 optional and warn if using node v10 (ref [#526](https://github.com/botpress/botpress/issues/526)) ([42ac146](https://github.com/botpress/botpress/commit/42ac146))
- **docs:** sorting versions in docs header (resolve [#660](https://github.com/botpress/botpress/issues/660)) ([6d40e38](https://github.com/botpress/botpress/commit/6d40e38))
- **webchat:** keyframes anymation fallback for ie (resolve [#657](https://github.com/botpress/botpress/issues/657)) ([5dce355](https://github.com/botpress/botpress/commit/5dce355))

### Features

- **bench:** initial benchmark script ([43c736d](https://github.com/botpress/botpress/commit/43c736d))

# [10.20.0](https://github.com/botpress/botpress/compare/v10.19.0...v10.20.0) (2018-06-20)

### Bug Fixes

- **core:** fix for the user with id === 0 ([05ad1ce](https://github.com/botpress/botpress/commit/05ad1ce))
- **core:** flowbuilder imports should match filenames ([cfebba5](https://github.com/botpress/botpress/commit/cfebba5))
- **ghost:** fix content manager ([2234b40](https://github.com/botpress/botpress/commit/2234b40))
- **licensing:** fix the license name in the footer ([beff44c](https://github.com/botpress/botpress/commit/beff44c))
- **webpack:** change path to js files (resolve [#648](https://github.com/botpress/botpress/issues/648)) ([352e009](https://github.com/botpress/botpress/commit/352e009))

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

### Features

- **botfile:** added variable hideHeroSection (resolve [#29](https://github.com/botpress/botpress/issues/29)) ([be060b1](https://github.com/botpress/botpress/commit/be060b1))
- **core:** added confirm when user want go out from flow(resolve [#516](https://github.com/botpress/botpress/issues/516)) ([b7841c1](https://github.com/botpress/botpress/commit/b7841c1))
- **core:** added confirm when user want go out from flows(resolve[#516](https://github.com/botpress/botpress/issues/516)) ([7349e7f](https://github.com/botpress/botpress/commit/7349e7f))
- **core:** hostname bot listens to can be customized (resolve [#644](https://github.com/botpress/botpress/issues/644)) ([e94c33c](https://github.com/botpress/botpress/commit/e94c33c))
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
- **builtins:** allow \$ in variable names ([916cdaf](https://github.com/botpress/botpress/commit/916cdaf))
- **core:** botpress shouldn't change cwd (resolves [#52](https://github.com/botpress/botpress/issues/52)) ([14ed105](https://github.com/botpress/botpress/commit/14ed105))
- **core:** hide webchat on logout from admin-panel (resolve [#554](https://github.com/botpress/botpress/issues/554)) ([8d05b69](https://github.com/botpress/botpress/commit/8d05b69))
- **docs:** deploy tutorial link (resolve [#498](https://github.com/botpress/botpress/issues/498)) ([8308f0d](https://github.com/botpress/botpress/commit/8308f0d))
- **docs:** WordPress misspelling ([1a354d8](https://github.com/botpress/botpress/commit/1a354d8))

### Features

- **analytics:** graph accepts fnAvg to customize avgValue calculation ([8e8c4f6](https://github.com/botpress/botpress/commit/8e8c4f6))
- **channel-web:** carousel acts as quick-replies ([7ac1f6c](https://github.com/botpress/botpress/commit/7ac1f6c))

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
- **web:** variable names containing special chars (like \$, @) ([e9c7ff2](https://github.com/botpress/botpress/commit/e9c7ff2))

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
