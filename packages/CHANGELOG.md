# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="10.46.3"></a>
## [10.46.3](https://github.com/botpress/botpress/compare/v10.46.2...v10.46.3) (2018-10-05)


### Bug Fixes

* **core:** title field is required (author dmk23 resolve [#883](https://github.com/botpress/botpress/issues/883)) ([#982](https://github.com/botpress/botpress/issues/982)) ([ff63de7](https://github.com/botpress/botpress/commit/ff63de7))
* **messenger:** improve rate limit (author dmk23 resolve [#884](https://github.com/botpress/botpress/issues/884)) ([#986](https://github.com/botpress/botpress/issues/986)) ([cc682a5](https://github.com/botpress/botpress/commit/cc682a5))
* **qna:** categories can be provided as config-variable ([#989](https://github.com/botpress/botpress/issues/989)) ([a30f18d](https://github.com/botpress/botpress/commit/a30f18d))
* **qna:** fix pagination not appearing on initial render ([#992](https://github.com/botpress/botpress/issues/992)) ([87fba19](https://github.com/botpress/botpress/commit/87fba19))
* **qna:** fix qna-module errors when using NLU (resolve [#973](https://github.com/botpress/botpress/issues/973)) ([#988](https://github.com/botpress/botpress/issues/988)) ([eb8c30d](https://github.com/botpress/botpress/commit/eb8c30d))
* **slack:** added user obj to slack umm for analytics (resolve [#983](https://github.com/botpress/botpress/issues/983)) ([#987](https://github.com/botpress/botpress/issues/987)) ([f7f4c7c](https://github.com/botpress/botpress/commit/f7f4c7c))




<a name="10.46.2"></a>
## [10.46.2](https://github.com/botpress/botpress/compare/v10.46.1...v10.46.2) (2018-10-03)


### Bug Fixes

* **hitl:** hitl bug with outgoing message to slack (resolve [#924](https://github.com/botpress/botpress/issues/924)) ([#978](https://github.com/botpress/botpress/issues/978)) ([e8dbe80](https://github.com/botpress/botpress/commit/e8dbe80))
* **qna:** questions-filter is case-insensitive ([#980](https://github.com/botpress/botpress/issues/980)) ([03fa755](https://github.com/botpress/botpress/commit/03fa755))




<a name="10.46.1"></a>
## [10.46.1](https://github.com/botpress/botpress/compare/v10.46.0...v10.46.1) (2018-10-03)


### Bug Fixes

* **qna:** close qna-form on submit ([#981](https://github.com/botpress/botpress/issues/981)) ([d137e88](https://github.com/botpress/botpress/commit/d137e88))
* **qna:** fix validating QNA-items ([#979](https://github.com/botpress/botpress/issues/979)) ([92b186f](https://github.com/botpress/botpress/commit/92b186f))




<a name="10.46.0"></a>
# [10.46.0](https://github.com/botpress/botpress/compare/v10.45.0...v10.46.0) (2018-10-03)


### Bug Fixes

* **core:** replace all (?) to (\?) (author mdk23 resolve [#880](https://github.com/botpress/botpress/issues/880)) ([#976](https://github.com/botpress/botpress/issues/976)) ([e74c0d8](https://github.com/botpress/botpress/commit/e74c0d8))
* **nlu:** force coherent nlu native values (resolve [#971](https://github.com/botpress/botpress/issues/971)) ([#975](https://github.com/botpress/botpress/issues/975)) ([991d9fb](https://github.com/botpress/botpress/commit/991d9fb))
* **qna:** fix qna-form not displaying item data ([#974](https://github.com/botpress/botpress/issues/974)) ([ca8e2eb](https://github.com/botpress/botpress/commit/ca8e2eb))


### Features

* **core:** implemneted migration for every modules ([#972](https://github.com/botpress/botpress/issues/972)) ([c771e34](https://github.com/botpress/botpress/commit/c771e34))




<a name="10.45.0"></a>
# [10.45.0](https://github.com/botpress/botpress/compare/v10.44.2...v10.45.0) (2018-10-01)


### Bug Fixes

* **channel-web:** allow tildas in user-ids ([#963](https://github.com/botpress/botpress/issues/963)) ([b69e88c](https://github.com/botpress/botpress/commit/b69e88c))
* **core:** disallow transitions to same node (resolve [#900](https://github.com/botpress/botpress/issues/900)) ([#962](https://github.com/botpress/botpress/issues/962)) ([cdfcd26](https://github.com/botpress/botpress/commit/cdfcd26))
* **core:** fix test running fresh bot ([a2969dc](https://github.com/botpress/botpress/commit/a2969dc))
* **core:** increase insertAndRetrieve test timeout ([676f5a5](https://github.com/botpress/botpress/commit/676f5a5))


### Features

* **nlu:** added age entity for LUIS ([acbd2e0](https://github.com/botpress/botpress/commit/acbd2e0))
* **nlu:** added unit property to LUIS entity ([bcce650](https://github.com/botpress/botpress/commit/bcce650))
* **qna:** new interface for QnA-module ([9b8ee56](https://github.com/botpress/botpress/commit/9b8ee56)), closes [#903](https://github.com/botpress/botpress/issues/903) [#903](https://github.com/botpress/botpress/issues/903) [#902](https://github.com/botpress/botpress/issues/902) [#902](https://github.com/botpress/botpress/issues/902) [#902](https://github.com/botpress/botpress/issues/902)




<a name="10.44.2"></a>
## [10.44.2](https://github.com/botpress/botpress/compare/v10.44.1...v10.44.2) (2018-09-28)


### Bug Fixes

* **channel-web:** handle missing payload.data ([13b296f](https://github.com/botpress/botpress/commit/13b296f))




<a name="10.44.1"></a>
## [10.44.1](https://github.com/botpress/botpress/compare/v10.44.0...v10.44.1) (2018-09-28)


### Bug Fixes

* **messenger:** made profiles fields option for FB (resolve [#829](https://github.com/botpress/botpress/issues/829)) ([ed74212](https://github.com/botpress/botpress/commit/ed74212))
* **nlu:** native-NLU values should be in 0..1 interval (resolve [#865](https://github.com/botpress/botpress/issues/865)) ([82acb3a](https://github.com/botpress/botpress/commit/82acb3a))
* **qna:** reverse qna-questions for consistency ([0043fee](https://github.com/botpress/botpress/commit/0043fee))




<a name="10.44.0"></a>
# [10.44.0](https://github.com/botpress/botpress/compare/v10.43.0...v10.44.0) (2018-09-27)


### Bug Fixes

* **builtins:** catch unique constraint violation ([a89942c](https://github.com/botpress/botpress/commit/a89942c))
* **builtins:** log tagging errors ([0f60fe8](https://github.com/botpress/botpress/commit/0f60fe8))
* **channel-web:** add todo about message insertion batching ([01a2e36](https://github.com/botpress/botpress/commit/01a2e36))
* **channel-web:** extract frequently used regex ([f22d357](https://github.com/botpress/botpress/commit/f22d357))
* **channel-web:** fix users caching ([c56ceb0](https://github.com/botpress/botpress/commit/c56ceb0))
* **core:** added env.VAR for correct testing ([3db498d](https://github.com/botpress/botpress/commit/3db498d))
* **qna:** fix answers ordering (came from c21d0ac) ([#954](https://github.com/botpress/botpress/issues/954)) ([1f4ddba](https://github.com/botpress/botpress/commit/1f4ddba))


### Features

* **channel-web:** added ensureUserExists method ([3e5d23c](https://github.com/botpress/botpress/commit/3e5d23c))
* **core:** automatically open the admin at startup in development ([#936](https://github.com/botpress/botpress/issues/936)) ([09db0e6](https://github.com/botpress/botpress/commit/09db0e6))




<a name="10.43.0"></a>
# [10.43.0](https://github.com/botpress/botpress/compare/v10.42.0...v10.43.0) (2018-09-26)


### Bug Fixes

* **qna:** qna-maker score ordering ([c21d0ac](https://github.com/botpress/botpress/commit/c21d0ac))


### Features

* **web:** implemented 'Greeting Screen' (ref [#808](https://github.com/botpress/botpress/issues/808)) ([#869](https://github.com/botpress/botpress/issues/869)) ([a066c90](https://github.com/botpress/botpress/commit/a066c90))




<a name="10.42.0"></a>
# [10.42.0](https://github.com/botpress/botpress/compare/v10.40.0...v10.42.0) (2018-09-26)


### Bug Fixes

* **channel-web:** login_prompt renderer styles were crashing webchat ([#943](https://github.com/botpress/botpress/issues/943)) ([620360f](https://github.com/botpress/botpress/commit/620360f))
* **core:** fix typo in sqlite-connection (resolve [#932](https://github.com/botpress/botpress/issues/932), ref [#497](https://github.com/botpress/botpress/issues/497)) ([#940](https://github.com/botpress/botpress/issues/940)) ([7aa9dd1](https://github.com/botpress/botpress/commit/7aa9dd1))
* **qna:** fix qna import-modal crashing ([#938](https://github.com/botpress/botpress/issues/938)) ([3edfe2e](https://github.com/botpress/botpress/commit/3edfe2e))
* **qna:** reverse results obtained from QNA-Maker ([#934](https://github.com/botpress/botpress/issues/934)) ([3bd9a45](https://github.com/botpress/botpress/commit/3bd9a45))
* **qna:** reverse results obtained from QNA-Maker ([#934](https://github.com/botpress/botpress/issues/934)) ([#941](https://github.com/botpress/botpress/issues/941)) ([448f54d](https://github.com/botpress/botpress/commit/448f54d))


### Features

* **webchat:** added 'flow to' action button ([b3a545c](https://github.com/botpress/botpress/commit/b3a545c))




<a name="10.41.1"></a>
## [10.41.1](https://github.com/botpress/botpress/compare/v10.41.0...v10.41.1) (2018-09-23)




**Note:** Version bump only for package botpress-fake-root

<a name="10.41.0"></a>
# [10.41.0](https://github.com/botpress/botpress/compare/v10.40.0...v10.41.0) (2018-09-23)


### Bug Fixes

* **qna:** reverse results obtained from QNA-Maker ([#934](https://github.com/botpress/botpress/issues/934)) ([3bd9a45](https://github.com/botpress/botpress/commit/3bd9a45))


### Features

* **webchat:** added 'flow to' action button ([b3a545c](https://github.com/botpress/botpress/commit/b3a545c))




<a name="10.40.0"></a>
# [10.40.0](https://github.com/botpress/botpress/compare/v10.38.0...v10.40.0) (2018-09-20)


### Bug Fixes

* **core:** improve bot test for circleci ([#925](https://github.com/botpress/botpress/issues/925)) ([3932353](https://github.com/botpress/botpress/commit/3932353))
* **messenger:** added new point of Getting Started ([#918](https://github.com/botpress/botpress/issues/918)) ([43019cc](https://github.com/botpress/botpress/commit/43019cc))
* **qna:** handle IME-composing in QNA-form ([#930](https://github.com/botpress/botpress/issues/930)) ([8493314](https://github.com/botpress/botpress/commit/8493314))


### Features

* **core:** new configs to silence logs and disable cluster mode ([7be9a1b](https://github.com/botpress/botpress/commit/7be9a1b))




<a name="10.39.0"></a>
# [10.39.0](https://github.com/botpress/botpress/compare/v10.38.0...v10.39.0) (2018-09-19)


### Bug Fixes

* **core:** improve bot test for circleci ([#925](https://github.com/botpress/botpress/issues/925)) ([3932353](https://github.com/botpress/botpress/commit/3932353))
* **messenger:** added new point of Getting Started ([#918](https://github.com/botpress/botpress/issues/918)) ([43019cc](https://github.com/botpress/botpress/commit/43019cc))


### Features

* **core:** new configs to silence logs and disable cluster mode ([7be9a1b](https://github.com/botpress/botpress/commit/7be9a1b))




<a name="10.38.0"></a>
# [10.38.0](https://github.com/botpress/botpress/compare/v10.37.1...v10.38.0) (2018-09-12)


### Bug Fixes

* **core:** uniq index ghost_content on file-folder (resolve [#791](https://github.com/botpress/botpress/issues/791)) ([0206e9d](https://github.com/botpress/botpress/commit/0206e9d))
* **slack:** added callback_id to attachment (resolve [#876](https://github.com/botpress/botpress/issues/876)) ([5474761](https://github.com/botpress/botpress/commit/5474761))


### Features

* **core:** implemented test for checking bot efficiency ([4c81a1c](https://github.com/botpress/botpress/commit/4c81a1c))




<a name="10.37.1"></a>
## [10.37.1](https://github.com/botpress/botpress/compare/v10.37.0...v10.37.1) (2018-09-11)




**Note:** Version bump only for package botpress-fake-root

<a name="10.37.0"></a>
# [10.37.0](https://github.com/botpress/botpress/compare/v10.36.1...v10.37.0) (2018-09-11)


### Features

* **core:** add the hook to switch the UI to editable username ([d2a6eab](https://github.com/botpress/botpress/commit/d2a6eab))




<a name="10.36.1"></a>
## [10.36.1](https://github.com/botpress/botpress/compare/v10.36.0...v10.36.1) (2018-09-10)




**Note:** Version bump only for package botpress-fake-root

<a name="10.36.0"></a>
# [10.36.0](https://github.com/botpress/botpress/compare/v10.35.1...v10.36.0) (2018-09-10)


### Bug Fixes

* **qna:** added converting to global app encoding (resolve [#901](https://github.com/botpress/botpress/issues/901)) ([6b311a0](https://github.com/botpress/botpress/commit/6b311a0))
* **telegram:** action promises were never resolved ([dfe0996](https://github.com/botpress/botpress/commit/dfe0996))
* **telegram:** update README.md ([3f1da72](https://github.com/botpress/botpress/commit/3f1da72))


### Features

* **telegram:** support action buttons and single-choice ([ff5211f](https://github.com/botpress/botpress/commit/ff5211f))
* **telegram:** support image builtin type ([b1ecac6](https://github.com/botpress/botpress/commit/b1ecac6))




<a name="10.35.1"></a>
## [10.35.1](https://github.com/botpress/botpress/compare/v10.35.0...v10.35.1) (2018-09-05)


### Bug Fixes

* **web:** improve path to customStylesheet ([8faa833](https://github.com/botpress/botpress/commit/8faa833))




<a name="10.35.0"></a>
# [10.35.0](https://github.com/botpress/botpress/compare/v10.34.0...v10.35.0) (2018-09-04)


### Bug Fixes

* added note about postgres minimal valid value ([dd57575](https://github.com/botpress/botpress/commit/dd57575))
* updated node-sass package ([8064701](https://github.com/botpress/botpress/commit/8064701))


### Features

* **audience:** various improvement to the Audience admin view ([41fed12](https://github.com/botpress/botpress/commit/41fed12))
* show toast message for qna and nlu (resolve [#790](https://github.com/botpress/botpress/issues/790)) ([53822eb](https://github.com/botpress/botpress/commit/53822eb))
* **web:** implemented custom stylesheet (ref [#808](https://github.com/botpress/botpress/issues/808)) ([3a060ac](https://github.com/botpress/botpress/commit/3a060ac))




<a name="10.34.0"></a>
# [10.34.0](https://github.com/botpress/botpress/compare/v10.32.0...v10.34.0) (2018-08-30)


### Bug Fixes

* **builtins:** change text rendering (resolve [#832](https://github.com/botpress/botpress/issues/832)) ([b33a711](https://github.com/botpress/botpress/commit/b33a711))
* **channel-web:** fixed message sanitization ([269025a](https://github.com/botpress/botpress/commit/269025a))
* **channel-web:** last_heard_on ([a6fb50f](https://github.com/botpress/botpress/commit/a6fb50f))
* **core:** flow-level timeoutNode property persists ([9d16c4e](https://github.com/botpress/botpress/commit/9d16c4e))
* **core:** improve CLI messages about version ([c919412](https://github.com/botpress/botpress/commit/c919412))
* **core:** increase node-version to 10 in new bot-template ([77d72a6](https://github.com/botpress/botpress/commit/77d72a6))
* **core:** make the page header color darker ([ba8951e](https://github.com/botpress/botpress/commit/ba8951e))
* **docs:** add note to use developer token for Recast ([43a6bf5](https://github.com/botpress/botpress/commit/43a6bf5))
* **messenger:** added possibility to set text ([aeb390e](https://github.com/botpress/botpress/commit/aeb390e))
* **nlu:** added scroll for intents list (resolve [#846](https://github.com/botpress/botpress/issues/846)) ([b85d3c3](https://github.com/botpress/botpress/commit/b85d3c3))
* **nlu:** dialogflow isn't required (resolve [#860](https://github.com/botpress/botpress/issues/860)) ([0bf3bb2](https://github.com/botpress/botpress/commit/0bf3bb2))
* **nlu:** improve way for handling error (resolve [#790](https://github.com/botpress/botpress/issues/790)) ([d32b74d](https://github.com/botpress/botpress/commit/d32b74d))
* **nlu:** skip empty utterances on sync (resolve [#859](https://github.com/botpress/botpress/issues/859)) ([6d62700](https://github.com/botpress/botpress/commit/6d62700))
* **slack:** fix slack avatar (ref [#880](https://github.com/botpress/botpress/issues/880)) ([47a46f1](https://github.com/botpress/botpress/commit/47a46f1))
* **ui:** allow to change socket url ([b1e317e](https://github.com/botpress/botpress/commit/b1e317e))
* **web:** carousel btn as payload (resolve [#845](https://github.com/botpress/botpress/issues/845)) ([c3e90d5](https://github.com/botpress/botpress/commit/c3e90d5))
* **web:** change order in web channel (resolve [#848](https://github.com/botpress/botpress/issues/848)) ([3e1805e](https://github.com/botpress/botpress/commit/3e1805e))


### Features

* **channel-web:** allow extra messages sanitizing ([7d6033f](https://github.com/botpress/botpress/commit/7d6033f))
* **core:** improve notifications empty state ([f58a695](https://github.com/botpress/botpress/commit/f58a695))
* **qna:** qna maker integration ([f8e2764](https://github.com/botpress/botpress/commit/f8e2764))




<a name="10.33.2"></a>
## [10.33.2](https://github.com/botpress/botpress/compare/v10.33.1...v10.33.2) (2018-08-24)


### Bug Fixes

* **channel-web:** fixed message sanitization ([269025a](https://github.com/botpress/botpress/commit/269025a))




<a name="10.33.1"></a>
## [10.33.1](https://github.com/botpress/botpress/compare/v10.33.0...v10.33.1) (2018-08-24)


### Bug Fixes

* **builtins:** change text rendering (resolve [#832](https://github.com/botpress/botpress/issues/832)) ([b33a711](https://github.com/botpress/botpress/commit/b33a711))
* **channel-web:** last_heard_on ([a6fb50f](https://github.com/botpress/botpress/commit/a6fb50f))
* **core:** flow-level timeoutNode property persists ([9d16c4e](https://github.com/botpress/botpress/commit/9d16c4e))
* **core:** increase node-version to 10 in new bot-template ([77d72a6](https://github.com/botpress/botpress/commit/77d72a6))
* **nlu:** dialogflow isn't required (resolve [#860](https://github.com/botpress/botpress/issues/860)) ([0bf3bb2](https://github.com/botpress/botpress/commit/0bf3bb2))
* **nlu:** improve way for handling error (resolve [#790](https://github.com/botpress/botpress/issues/790)) ([d32b74d](https://github.com/botpress/botpress/commit/d32b74d))
* **nlu:** skip empty utterances on sync (resolve [#859](https://github.com/botpress/botpress/issues/859)) ([6d62700](https://github.com/botpress/botpress/commit/6d62700))




<a name="10.33.0"></a>
# [10.33.0](https://github.com/botpress/botpress/compare/v10.32.0...v10.33.0) (2018-08-17)


### Bug Fixes

* **core:** improve CLI messages about version ([c919412](https://github.com/botpress/botpress/commit/c919412))
* **messenger:** added possibility to set text ([aeb390e](https://github.com/botpress/botpress/commit/aeb390e))
* **nlu:** added scroll for intents list (resolve [#846](https://github.com/botpress/botpress/issues/846)) ([b85d3c3](https://github.com/botpress/botpress/commit/b85d3c3))
* **web:** carousel btn as payload (resolve [#845](https://github.com/botpress/botpress/issues/845)) ([c3e90d5](https://github.com/botpress/botpress/commit/c3e90d5))


### Features

* **channel-web:** allow extra messages sanitizing ([7d6033f](https://github.com/botpress/botpress/commit/7d6033f))




<a name="10.32.0"></a>
# [10.32.0](https://github.com/botpress/botpress/compare/v10.31.0...v10.32.0) (2018-08-15)


### Features

* **qna:** display upload CSV status ([efa96ed](https://github.com/botpress/botpress/commit/efa96ed))




<a name="10.31.0"></a>
# [10.31.0](https://github.com/botpress/botpress/compare/v10.30.0...v10.31.0) (2018-08-08)


### Bug Fixes

* **core:** remove global variable rewriting ([6fce6de](https://github.com/botpress/botpress/commit/6fce6de))
* **docs:** tour shouldn't mention botpress-messenger (ref [#827](https://github.com/botpress/botpress/issues/827)) ([0aa1616](https://github.com/botpress/botpress/commit/0aa1616))
* **messenger:** GET_STARTED response (resolve [#589](https://github.com/botpress/botpress/issues/589)) ([f9c31cb](https://github.com/botpress/botpress/commit/f9c31cb))
* **qna:** display row number in processing error ([3c692ea](https://github.com/botpress/botpress/commit/3c692ea))
* **qna:** don't duplicate questions when reuploading same file ([08b5888](https://github.com/botpress/botpress/commit/08b5888))
* **qna:** paginate questions/answer ([f349899](https://github.com/botpress/botpress/commit/f349899))


### Features

* **builtins:** added ability to hide choice elements ([5919705](https://github.com/botpress/botpress/commit/5919705))
* **qna:** customizable encoding for exported csv ([de1a2d1](https://github.com/botpress/botpress/commit/de1a2d1))
* **skill-choice:** added support for NLU ([fa15d06](https://github.com/botpress/botpress/commit/fa15d06))




<a name="10.30.0"></a>
# [10.30.0](https://github.com/botpress/botpress/compare/v10.28.0...v10.30.0) (2018-08-08)


### Bug Fixes

* wip ([c36ab78](https://github.com/botpress/botpress/commit/c36ab78))
* **core:** improve long strings readability ([904f784](https://github.com/botpress/botpress/commit/904f784))
* **nlu:** custom entity names ([8e04763](https://github.com/botpress/botpress/commit/8e04763))
* **nlu:** DialogFlow moved to optional deps ([a05202a](https://github.com/botpress/botpress/commit/a05202a))
* **nlu:** fixes loading of custom entities ([f63cfab](https://github.com/botpress/botpress/commit/f63cfab))
* **nlu:** LUIS custom entity resolution ([d813233](https://github.com/botpress/botpress/commit/d813233))
* **web:** unused code ([832a3db](https://github.com/botpress/botpress/commit/832a3db))
* **webchat:** conversations list last message postgres query ([4657efa](https://github.com/botpress/botpress/commit/4657efa))
* **webchat:** createConvo btn color is configurable ([b7eba94](https://github.com/botpress/botpress/commit/b7eba94))


### Features

* **core:** implemented validation fot bp module version (resolve [#663](https://github.com/botpress/botpress/issues/663)) ([596528d](https://github.com/botpress/botpress/commit/596528d))
* **web:** implemented btn for create convo (ref [#804](https://github.com/botpress/botpress/issues/804)) ([ae42664](https://github.com/botpress/botpress/commit/ae42664))




<a name="10.29.0"></a>
# [10.29.0](https://github.com/botpress/botpress/compare/v10.28.0...v10.29.0) (2018-08-07)


### Bug Fixes

* wip ([c36ab78](https://github.com/botpress/botpress/commit/c36ab78))
* **core:** improve long strings readability ([904f784](https://github.com/botpress/botpress/commit/904f784))
* **nlu:** custom entity names ([8e04763](https://github.com/botpress/botpress/commit/8e04763))
* **nlu:** DialogFlow moved to optional deps ([a05202a](https://github.com/botpress/botpress/commit/a05202a))
* **nlu:** fixes loading of custom entities ([f63cfab](https://github.com/botpress/botpress/commit/f63cfab))
* **web:** unused code ([832a3db](https://github.com/botpress/botpress/commit/832a3db))
* **webchat:** conversations list last message postgres query ([4657efa](https://github.com/botpress/botpress/commit/4657efa))
* **webchat:** createConvo btn color is configurable ([b7eba94](https://github.com/botpress/botpress/commit/b7eba94))


### Features

* **core:** implemented validation fot bp module version (resolve [#663](https://github.com/botpress/botpress/issues/663)) ([596528d](https://github.com/botpress/botpress/commit/596528d))
* **web:** implemented btn for create convo (ref [#804](https://github.com/botpress/botpress/issues/804)) ([ae42664](https://github.com/botpress/botpress/commit/ae42664))




<a name="10.28.0"></a>
# [10.28.0](https://github.com/botpress/botpress/compare/v10.27.1...v10.28.0) (2018-08-03)


### Bug Fixes

* **hitl:** sqlite alert ([544aa41](https://github.com/botpress/botpress/commit/544aa41))
* **web:** added config options for showAvatar and showUserName ([c90ff5a](https://github.com/botpress/botpress/commit/c90ff5a))
* **web:** default config ([6f7fe72](https://github.com/botpress/botpress/commit/6f7fe72))
* **web:** download transcript config ([fe1a1c4](https://github.com/botpress/botpress/commit/fe1a1c4))
* **webchat:** display user's avatar and name if available (resolve [#803](https://github.com/botpress/botpress/issues/803)) ([2bc7f34](https://github.com/botpress/botpress/commit/2bc7f34))


### Features

* **channel-web:** implement the new  message type ([68cfbc9](https://github.com/botpress/botpress/commit/68cfbc9)), closes [#780](https://github.com/botpress/botpress/issues/780)
* **web:** implemented downloading conversation (resolve [#802](https://github.com/botpress/botpress/issues/802)) ([ee8ec8a](https://github.com/botpress/botpress/commit/ee8ec8a))
* **webchat:** start new feature on timeout (resovle [#805](https://github.com/botpress/botpress/issues/805)) ([f64fde1](https://github.com/botpress/botpress/commit/f64fde1))




<a name="10.27.1"></a>
## [10.27.1](https://github.com/botpress/botpress/compare/v10.27.0...v10.27.1) (2018-08-01)


### Bug Fixes

* **nlu:** LUIS should fetch  not only top-scored one ([ba0e034](https://github.com/botpress/botpress/commit/ba0e034))




<a name="10.27.0"></a>
# [10.27.0](https://github.com/botpress/botpress/compare/v10.26.0...v10.27.0) (2018-07-31)


### Bug Fixes

* resolve broken links (resolve [#783](https://github.com/botpress/botpress/issues/783)) ([#785](https://github.com/botpress/botpress/issues/785)) ([b745daa](https://github.com/botpress/botpress/commit/b745daa))
* **core:** export entry-point from bot's index.js (resolve [#796](https://github.com/botpress/botpress/issues/796)) ([a83724a](https://github.com/botpress/botpress/commit/a83724a))
* **hitl:** made text column longer (resolve [#578](https://github.com/botpress/botpress/issues/578)) ([fe3ad87](https://github.com/botpress/botpress/commit/fe3ad87))


### Features

* **core:** var in Execute code can merge {{var}} with str(resolve [#530](https://github.com/botpress/botpress/issues/530)) ([74512bb](https://github.com/botpress/botpress/commit/74512bb))




<a name="10.26.0"></a>
# [10.26.0](https://github.com/botpress/botpress/compare/v10.25.2...v10.26.0) (2018-07-31)


### Bug Fixes

* **flow:** change state initializing and ver-control path (resolve [#633](https://github.com/botpress/botpress/issues/633)) ([75a599a](https://github.com/botpress/botpress/commit/75a599a))
* **logs:** fix logs ordering ([62c2679](https://github.com/botpress/botpress/commit/62c2679))
* **logs:** safely serialize objects with cyclic refs ([270a7e4](https://github.com/botpress/botpress/commit/270a7e4))
* **nlu:** provide default nlu interface (resolve [#685](https://github.com/botpress/botpress/issues/685)) ([62b9ba6](https://github.com/botpress/botpress/commit/62b9ba6))


### Features

* **core:** support Phusion Passenger (resolve [#671](https://github.com/botpress/botpress/issues/671)) ([ab4098b](https://github.com/botpress/botpress/commit/ab4098b))




<a name="10.25.2"></a>
## [10.25.2](https://github.com/botpress/botpress/compare/v10.25.1...v10.25.2) (2018-07-26)


### Bug Fixes

* **nlu:** don't throw if intent to delete not found ([1731f43](https://github.com/botpress/botpress/commit/1731f43))




<a name="10.25.1"></a>
## [10.25.1](https://github.com/botpress/botpress/compare/v10.25.0...v10.25.1) (2018-07-26)


### Bug Fixes

* **nlu:** don't sync luis if syncing in progress ([961312c](https://github.com/botpress/botpress/commit/961312c))
* **nlu:** don't throw if intent to delete is absent ([ce88c93](https://github.com/botpress/botpress/commit/ce88c93))




<a name="10.25.0"></a>
# [10.25.0](https://github.com/botpress/botpress/compare/v10.24.4...v10.25.0) (2018-07-23)


### Bug Fixes

* cleanup ([bdd769b](https://github.com/botpress/botpress/commit/bdd769b))
* **channel-web:** don't set last_heard_on for new convos ([3448fc3](https://github.com/botpress/botpress/commit/3448fc3))
* **channel-web:** import bluebird ([dc5359d](https://github.com/botpress/botpress/commit/dc5359d))
* **channel-web:** init new convo with last_heard_on ([16e0816](https://github.com/botpress/botpress/commit/16e0816))
* **channel-web:** set last_heard_on for new convos ([6c05b92](https://github.com/botpress/botpress/commit/6c05b92))
* **core:** fix _findNode check ([85795a4](https://github.com/botpress/botpress/commit/85795a4))
* **core:** fix dialog engine ([b8cd753](https://github.com/botpress/botpress/commit/b8cd753))
* **core:** keep choice-skills' links on skill edit (resolve [#693](https://github.com/botpress/botpress/issues/693)) ([b2a91ce](https://github.com/botpress/botpress/commit/b2a91ce))


### Features

* **logs:** implement minimum log level ([5f160d8](https://github.com/botpress/botpress/commit/5f160d8))
* **nlu:** limit requests per hour ([f81873f](https://github.com/botpress/botpress/commit/f81873f))




<a name="10.24.4"></a>
## 10.24.4


### Bug Fixes

* **core:** fix prepublish script ([45cce40](https://github.com/botpress/botpress/commit/45cce40))




<a name="10.24.3"></a>
## 10.24.3


### Bug Fixes

* **core:** copy README on compiling botpress ([c6ccddb](https://github.com/botpress/botpress/commit/c6ccddb))
* **core:** just use new README for now ([90362e5](https://github.com/botpress/botpress/commit/90362e5))




<a name="10.24.2"></a>
## 10.24.2


### Bug Fixes

* **core:** copy README on compiling botpress ([c6ccddb](https://github.com/botpress/botpress/commit/c6ccddb))
* **core:** just use new README for now ([90362e5](https://github.com/botpress/botpress/commit/90362e5))




<a name="10.24.1"></a>
## 10.24.1


### Bug Fixes

* **core:** copy botpress README before publishing (resovle [#729](https://github.com/botpress/botpress/issues/729)) ([4e50546](https://github.com/botpress/botpress/commit/4e50546))




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


### BREAKING CHANGES

* **logs:** it fails on the old botfile
and requires manual migration.
It also ignores the old log files.




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
## 10.13.3




**Note:** Version bump only for package botpress-fake-root

<a name="10.13.2"></a>
## 10.13.2




**Note:** Version bump only for package botpress-fake-root

<a name="10.13.1"></a>
## 10.13.1




**Note:** Version bump only for package botpress-fake-root

<a name="10.13.0"></a>
# 10.13.0


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
# 10.12.0


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
