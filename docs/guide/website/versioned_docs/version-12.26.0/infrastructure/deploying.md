---
id: version-12.26.0-deploying
title: Building From Source
original_id: deploying
---
Botpress has added flexibility for developers who want access to the core codebase. You can clone Botpress from the source repository on Github, allowing you to test code, modules, and components more dynamically. 

## Compiling From Source
You can build Botpress from the [source repository](https://github.com/botpress/botpress) in a few simple steps. Doing this is useful when you need to create custom modules and components.

### Prerequisites

Install node version 12.18.1 for [your operating system](https://nodejs.org/download/release/v12.18.1/). **Tip:** on windows, download and use the .msi installer 

Install [Yarn package manager](https://yarnpkg.com/)

### Installation
While in the directory where you want to host your instance of Botpress, run the following commands in this sequence:

- `git clone git@github.com:botpress/botpress.git && cd botpress`
- `yarn cache clean` (proceed to the next step if this command fails)
- `yarn`
- `yarn build`
- `yarn start`

> If you are in a hurry and cannot wait for a, fix release, [clone the commit](coderwall.com/p/xyuoza/git-cloning-specific-commits) **(do not modify files one by one)**. 

## Ubuntu Systems 
You might run into issues while trying to build and start botpress via yarn on Rasberry Pi OS x64 or other Ubuntu Systems. Its ARM Architecture means none of the pre-built binaries will work. On trying to run the command `yarn start`, you might run into an error like the one below:

```bash
yarn start
yarn run v1.22.10
$ cd ./out/bp && cross-env NODE_PATH=./ cross-env BP_MODULES_PATH=./data/modules/:../../modules:../../internal-modules node index.js
Error starting botpress
Error: Could not require NativeExtension "crfsuite.node" for OS "linux debian_10".
	...
Could not require NativeExtension "crfsuite.node" for OS "linux debian_10".
	...
---STACK---
Error: Could not require NativeExtension "crfsuite.node" for OS "linux debian_10".
	...
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
``` 

To avoid this error, you can build native extensions for Ubuntu using the docker file below:

```dockerfile
FROM ubuntu:18.04
RUN apt update && apt install -y gnupg curl git build-essential cmake pkg-config
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
   apt install -y nodejs && \
   npm install -g yarn node-pre-gyp
RUN mkdir /build

WORKDIR /build/node-fasttext
RUN git clone https://github.com/botpress/node-fasttext.git .
RUN git submodule update --init && sh linux-build.sh && npm install && npm run-script build

WORKDIR /build/node-crfsuite
RUN git clone https://github.com/botpress/node-crfsuite.git .
RUN git submodule update --init && npm install && npm run-script build

WORKDIR /build/node-svm
RUN git clone https://github.com/botpress/node-svm.git .
RUN git submodule update --init && npm install && npm run-script build

WORKDIR /build/node-sentencepiece
RUN git clone https://github.com/botpress/node-sentencepiece.git .
RUN git submodule update --init && npm install && npm run-script build

CMD ["bash"]
```

Replicate this docker file using your distribution (e.g., Raspbian) and use it. After that, find the file with extension `*.node` for all libraries. 

To acess this file (with extension *.node), start a docker container with the image you just built.Thereafter, enter this container using the command
`docker run -it --rm --name <YOUR_IMG_NAME> bp-bindings`
Inside each of `/build/node-fasttext/*`,` /build/node-crfsuite/*`,` /build/node-svm/*` and `/build/node-sentencepiece/*` there should be a build/ or release/ directory where you’ll find a file with extension `*.node`.

If you’re running botpress from sources, the correct location would either be : `build/native-extensions/linux/default or create` the directory `build/native-extensions/linux/<your-distribution>`. You can look at the file rewire.ts 2 if you want to see how the important processes occur.

If you’re using the Botpress official binary, place the files in a directory named `bindings`.

After following the instructions above, your command line should look as follows:


```bash
User@DESKTOP-T1ORLFU MINGW64 /c/BotpressBuild/botpress-master
$ yarn

yarn install v1.22.10
[1/5] Validating package.json...
[2/5] Resolving packages...
[3/5] Fetching packages...
[4/5] Linking dependencies...
[5/5] Building fresh packages...
$ yarn cmd install:nlu
yarn run v1.22.10
$ yarn run gulp install:nlu
$ C:\BotpressBuild\botpress-master\node_modules\.bin\gulp install:nlu
[06:51:11] Using gulpfile C:\BotpressBuild\botpress-master\gulpfile.js
[06:51:11] Starting 'install:nlu'...
[06:51:11] Starting 'buildNLUInstaller'...
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...
$ tsc
[06:51:29] Finished 'buildNLUInstaller' after 18 s
[06:51:29] Starting '<anonymous>'...
$ node ./dist/index.js -c=C:\BotpressBuild\botpress-master/package.json -o=C:\BotpressBuild\botpress-master/out/bp
[NLU Installer] About to download from https://github.com/botpress/nlu/releases/download/v0.0.2/nlu-v0_0_2-win-x64.exe
[NLU Installer] Output file is C:\BotpressBuild\botpress-master\out\bp\nlu-v0_0_2-win-x64.exe
NLU binary executable Download: [----------------------------------------] (0%), 0s
NLU binary executable Download: [----------------------------------------] (0%), 2s
NLU binary executable Download: [----------------------------------------] (0%), 4s
NLU binary executable Download: [----------------------------------------] (0%), 6s
NLU binary executable Download: [----------------------------------------] (0%), 8s
NLU binary executable Download: [----------------------------------------] (0%), 10s
NLU binary executable Download: [----------------------------------------] (0%), 12s
NLU binary executable Download: [----------------------------------------] (0%), 14s
NLU binary executable Download: [----------------------------------------] (0%), 16s
NLU binary executable Download: [=---------------------------------------] (2%), 18s
NLU binary executable Download: [==--------------------------------------] (4%), 20s
NLU binary executable Download: [==--------------------------------------] (5%), 22s
NLU binary executable Download: [===-------------------------------------] (7%), 24s
NLU binary executable Download: [====------------------------------------] (9%), 26s
NLU binary executable Download: [====------------------------------------] (11%), 28s
NLU binary executable Download: [======----------------------------------] (13%), 30s
NLU binary executable Download: [======----------------------------------] (14%), 32s
NLU binary executable Download: [=======---------------------------------] (16%), 34s
NLU binary executable Download: [========--------------------------------] (19%), 36s
NLU binary executable Download: [=========-------------------------------] (21%), 38s
NLU binary executable Download: [=========-------------------------------] (22%), 40s
NLU binary executable Download: [==========------------------------------] (25%), 42s
NLU binary executable Download: [===========-----------------------------] (27%), 44s
NLU binary executable Download: [===========-----------------------------] (28%), 46s
NLU binary executable Download: [===========-----------------------------] (28%), 48s
NLU binary executable Download: [===========-----------------------------] (28%), 50s
NLU binary executable Download: [===========-----------------------------] (28%), 52s
NLU binary executable Download: [============----------------------------] (28%), 54s
NLU binary executable Download: [============----------------------------] (28%), 56s
NLU binary executable Download: [============----------------------------] (29%), 58s
NLU binary executable Download: [============----------------------------] (29%), 60s
NLU binary executable Download: [============----------------------------] (29%), 62s
NLU binary executable Download: [=============---------------------------] (31%), 64s
NLU binary executable Download: [=============---------------------------] (33%), 66s
NLU binary executable Download: [==============--------------------------] (35%), 68s
NLU binary executable Download: [==============--------------------------] (36%), 70s
NLU binary executable Download: [===============-------------------------] (36%), 72s
NLU binary executable Download: [===============-------------------------] (36%), 74s
NLU binary executable Download: [===============-------------------------] (37%), 76s
NLU binary executable Download: [===============-------------------------] (38%), 78s
NLU binary executable Download: [================------------------------] (39%), 80s
NLU binary executable Download: [================------------------------] (40%), 82s
NLU binary executable Download: [=================-----------------------] (41%), 84s
NLU binary executable Download: [=================-----------------------] (42%), 86s
NLU binary executable Download: [==================----------------------] (44%), 88s
NLU binary executable Download: [====================--------------------] (49%), 90s
NLU binary executable Download: [=====================-------------------] (53%), 92s
NLU binary executable Download: [======================------------------] (54%), 94s
NLU binary executable Download: [=======================-----------------] (58%), 96s
NLU binary executable Download: [=========================---------------] (61%), 98s
NLU binary executable Download: [==========================--------------] (63%), 100s
NLU binary executable Download: [===========================-------------] (67%), 102s
NLU binary executable Download: [============================------------] (70%), 104s
NLU binary executable Download: [==============================----------] (74%), 106s
NLU binary executable Download: [===============================---------] (77%), 108s
NLU binary executable Download: [================================--------] (81%), 110s
NLU binary executable Download: [==================================------] (86%), 112s
NLU binary executable Download: [====================================----] (89%), 114s
NLU binary executable Download: [=====================================---] (92%), 116s
NLU binary executable Download: [======================================--] (95%), 118s
NLU binary executable Download: [========================================] (99%), 120s
NLU binary executable Download: [========================================] (100%), 121s

[06:53:30] Finished '<anonymous>' after 2.02 min
[06:53:30] Finished 'install:nlu' after 2.3 min
Done in 142.72s.
Done in 579.00s.


User@DESKTOP-T1ORLFU MINGW64 /c/BotpressBuild/botpress-master
$ yarn build


yarn run v1.22.10
$ yarn cmd build
$ yarn run gulp build
$ C:\BotpressBuild\botpress-master\node_modules\.bin\gulp build
[07:06:20] Using gulpfile C:\BotpressBuild\botpress-master\gulpfile.js
[07:06:20] Starting 'build'...
[07:06:20] Starting 'build:sharedLite'...
[07:06:20] Starting 'sharedLiteBuild'...
warning package.json: No license field
warning ui-shared-lite@1.0.0: No license field
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...
[07:06:43] Finished 'sharedLiteBuild' after 23 s
[07:06:43] Finished 'build:sharedLite' after 23 s
[07:06:43] Starting 'clearMigrations'...
[07:06:43] Finished 'clearMigrations' after 9.76 ms
[07:06:43] Starting 'maybeFetchPro'...
[07:06:43] Finished 'maybeFetchPro' after 4.83 ms
[07:06:43] Starting 'writeMetadata'...
[07:06:43] Finished 'writeMetadata' after 7.92 ms
[07:06:43] Starting 'compileTypescript'...
[07:06:57] Finished 'compileTypescript' after 14 s
[07:06:57] Starting 'buildSchemas'...
[07:07:01] Finished 'buildSchemas' after 3.42 s
[07:07:01] Starting 'createOutputDirs'...
[07:07:01] Finished 'createOutputDirs' after 20 ms
[07:07:01] Starting 'copyBinaries'...
[07:07:01] Finished 'copyBinaries' after 2.68 ms
[07:07:01] Starting 'copyPreTrained'...
[07:07:01] Finished 'copyPreTrained' after 1.39 ms
[07:07:01] Starting 'copyStopWords'...
[07:07:01] Finished 'copyStopWords' after 1.19 ms
[07:07:01] Starting 'build:shared'...
[07:07:01] Starting 'cleanShared'...
[07:07:01] Finished 'cleanShared' after 1.59 ms
[07:07:01] Starting 'sharedBuild'...
[1/5] Validating package.json...
[2/5] Resolving packages...
[3/5] Fetching packages...
info fsevents@2.1.3: The platform "win32" is incompatible with this module.
info "fsevents@2.1.3" is an optional dependency and failed compatibility check. Excluding it from installation.
info fsevents@1.2.13: The platform "win32" is incompatible with this module.
info "fsevents@1.2.13" is an optional dependency and failed compatibility check. Excluding it from installation.
[4/5] Linking dependencies...
warning " > ts-loader@6.2.2" has unmet peer dependency "typescript@*".
[5/5] Building fresh packages...
$ cross-env NODE_ENV=production node ./webpack.config.js --compile --nomap && yarn scss
[07:10:53] Shared    409 modules

WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
This can impact web performance.
Assets:
  index.js (878 KiB)

WARNING in entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (244 KiB). This can impact web performance.
Entrypoints:
  main (878 KiB)
      index.js


WARNING in webpack performance recommendations:
You can limit the size of your bundles by using import() or require.ensure to lazy load some parts of your application.
For more info visit https://webpack.js.org/guides/code-splitting/
$ node-sass src/theme/main.scss dist/theme.css --importer=node_modules/node-sass-tilde-importer
Rendering Complete, saving .css file...
Wrote CSS to C:\BotpressBuild\botpress-master\src\bp\ui-shared\dist\theme.css
[07:10:57] Finished 'sharedBuild' after 3.93 min
[07:10:57] Finished 'build:shared' after 3.93 min
[07:10:57] Starting 'initStudio'...
warning " > react-dock@0.2.4" has unmet peer dependency "babel-runtime@^6.3.13".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react@^16.12.0".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react-dom@^16.12.0".
warning " > ts-loader@6.2.1" has unmet peer dependency "typescript@*".
[07:15:52] Finished 'initStudio' after 4.92 min
[07:15:52] Starting 'buildModuleBuilder'...
[1/4] Resolving packages...
[2/4] Fetching packages...
info fsevents@1.2.11: The platform "win32" is incompatible with this module.
info "fsevents@1.2.11" is an optional dependency and failed compatibility check. Excluding it from installation.
info fsevents@1.2.4: The platform "win32" is incompatible with this module.
info "fsevents@1.2.4" is an optional dependency and failed compatibility check. Excluding it from installation.
[3/4] Linking dependencies...
[4/4] Building fresh packages...
$ ./node_modules/.bin/babel src --out-dir bin --extensions ".ts,.js"
Successfully compiled 6 files with Babel.

[07:17:59] Finished 'buildModuleBuilder' after 2.1 min
[07:17:59] Starting 'cleanSdk'...
[07:17:59] Finished 'cleanSdk' after 5.67 ms
[07:17:59] Starting 'build-module analytics'...
[07:19:07] Finished 'build-module analytics' after 1.13 min
[07:19:07] Starting 'build-module basic-skills'...
[07:19:55] Finished 'build-module basic-skills' after 48 s
[07:19:55] Starting 'build-module bot-improvement'...
[07:20:14] Finished 'build-module bot-improvement' after 19 s
[07:20:14] Starting 'build-module broadcast'...
[07:20:44] Finished 'build-module broadcast' after 30 s
[07:20:44] Starting 'build-module builtin'...
[07:20:52] Finished 'build-module builtin' after 7.83 s
[07:20:52] Starting 'build-module channel-messenger'...
[07:21:05] Finished 'build-module channel-messenger' after 13 s
[07:21:05] Starting 'build-module channel-slack'...
[07:21:27] Finished 'build-module channel-slack' after 22 s
[07:21:27] Starting 'build-module channel-smooch'...
[07:21:37] Finished 'build-module channel-smooch' after 9.88 s
[07:21:37] Starting 'build-module channel-teams'...
[07:22:06] Finished 'build-module channel-teams' after 29 s
[07:22:06] Starting 'build-module channel-telegram'...
[07:22:17] Finished 'build-module channel-telegram' after 11 s
[07:22:17] Starting 'build-module channel-twilio'...
[07:22:37] Finished 'build-module channel-twilio' after 20 s
[07:22:37] Starting 'build-module channel-vonage'...
[07:23:07] Finished 'build-module channel-vonage' after 29 s
[07:23:07] Starting 'build-module channel-web'...
[07:25:20] Finished 'build-module channel-web' after 2.22 min
[07:25:20] Starting 'build-module code-editor'...
[07:26:43] Finished 'build-module code-editor' after 1.38 min
[07:26:43] Starting 'build-module examples'...
[07:26:52] Finished 'build-module examples' after 8.29 s
[07:26:52] Starting 'build-module extensions'...
[07:27:26] Finished 'build-module extensions' after 34 s
[07:27:26] Starting 'build-module google-speech'...
[07:27:52] Finished 'build-module google-speech' after 26 s
[07:27:52] Starting 'build-module hitl'...
[07:28:12] Finished 'build-module hitl' after 20 s
[07:28:12] Starting 'build-module hitlnext'...
[07:28:59] Finished 'build-module hitlnext' after 47 s
[07:28:59] Starting 'build-module libraries'...
[07:31:50] Finished 'build-module libraries' after 2.85 min
[07:31:50] Starting 'build-module misunderstood'...
[07:32:42] Finished 'build-module misunderstood' after 52 s
[07:32:42] Starting 'build-module ndu'...
[07:33:33] Finished 'build-module ndu' after 52 s
[07:33:33] Starting 'build-module nlu-testing'...
[07:33:50] Finished 'build-module nlu-testing' after 17 s
[07:33:50] Starting 'build-module nlu'...
[07:34:36] Finished 'build-module nlu' after 46 s
[07:34:36] Starting 'build-module qna'...
[07:35:05] Finished 'build-module qna' after 29 s
[07:35:05] Starting 'build-module testing'...
[07:35:20] Finished 'build-module testing' after 15 s
[07:35:20] Starting 'build-module uipath'...
[07:35:29] Finished 'build-module uipath' after 8.48 s
[07:35:29] Starting 'build:shared'...
[07:35:29] Starting 'cleanShared'...
[07:35:29] Finished 'cleanShared' after 1.4 ms
[07:35:29] Starting 'sharedBuild'...
[1/5] Validating package.json...
[2/5] Resolving packages...
success Already up-to-date.
$ cross-env NODE_ENV=production node ./webpack.config.js --compile --nomap && yarn scss
[07:35:50] Shared    409 modules

WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
This can impact web performance.
Assets:
  index.js (878 KiB)

WARNING in entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (244 KiB). This can impact web performance.
Entrypoints:
  main (878 KiB)
      index.js


WARNING in webpack performance recommendations:
You can limit the size of your bundles by using import() or require.ensure to lazy load some parts of your application.
For more info visit https://webpack.js.org/guides/code-splitting/
$ node-sass src/theme/main.scss dist/theme.css --importer=node_modules/node-sass-tilde-importer
Rendering Complete, saving .css file...
Wrote CSS to C:\BotpressBuild\botpress-master\src\bp\ui-shared\dist\theme.css
[07:35:53] Finished 'sharedBuild' after 24 s
[07:35:53] Finished 'build:shared' after 24 s
[07:35:53] Starting 'build:studio'...
[07:35:53] Starting 'buildStudio'...
warning " > react-dock@0.2.4" has unmet peer dependency "babel-runtime@^6.3.13".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react@^16.12.0".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react-dom@^16.12.0".
warning " > ts-loader@6.2.1" has unmet peer dependency "typescript@*".
clean-webpack-plugin: C:\BotpressBuild\botpress-master\src\bp\ui-studio\public has been removed.
[hardsource:21236849] Writing new cache 21236849...
[hardsource:21236849] Tracking node dependencies with: yarn.lock.
[07:37:14] Finished 'buildStudio' after 1.35 min
[07:37:14] Starting 'cleanStudio'...
[07:37:14] Finished 'cleanStudio' after 1.48 ms
[07:37:14] Starting 'cleanStudioAssets'...
[07:37:14] Finished 'cleanStudioAssets' after 1.01 ms
[07:37:14] Starting 'copyStudio'...
[07:37:15] Finished 'copyStudio' after 378 ms
[07:37:15] Finished 'build:studio' after 1.35 min
[07:37:15] Starting 'build:admin'...
[07:37:15] Starting 'buildAdmin'...
warning " > connected-react-router@6.9.1" has unmet peer dependency "history@^4.7.2".
warning " > react-table@6.11.5" has unmet peer dependency "prop-types@^15.7.0".
warning " > css-loader@5.2.1" has unmet peer dependency "webpack@^4.27.0 || ^5.0.0".
warning " > expose-loader@1.0.3" has unmet peer dependency "webpack@^4.0.0 || ^5.0.0".
warning " > hard-source-webpack-plugin@0.13.1" has unmet peer dependency "webpack@*".
warning "react-scripts > @typescript-eslint/eslint-plugin > tsutils@3.21.0" has unmet peer dependency "typescript@>=2.8.0 || >= 3.2.0-dev || >= 3.3.0-dev || >= 3.4.0-dev || >= 3.5.0-dev || >= 3.6.0-dev || >= 3.6.0-beta || >= 3.7.0-dev || >= 3.7.0-beta".
The following changes are being made to your tsconfig.json file:
  - compilerOptions.paths must not be set (aliased imports are not supported)

[hardsource:869f0543] Writing new cache 869f0543...
[hardsource:869f0543] Tracking node dependencies with: yarn.lock.
Browserslist: caniuse-lite is outdated. Please run next command `yarn upgrade`
[07:46:11] Finished 'buildAdmin' after 8.93 min
[07:46:11] Starting 'cleanAdmin'...
[07:46:11] Finished 'cleanAdmin' after 12 ms
[07:46:11] Starting 'copyAdmin'...
[07:46:11] Finished 'copyAdmin' after 142 ms
[07:46:11] Finished 'build:admin' after 8.93 min
[07:46:11] Starting 'build:lite'...
[07:46:11] Starting 'buildLite'...
warning " > ts-loader@6.2.2" has unmet peer dependency "typescript@*".
clean-webpack-plugin: C:\BotpressBuild\botpress-master\src\bp\ui-lite\public has been removed.
[07:47:15] Finished 'buildLite' after 1.05 min
[07:47:15] Starting 'cleanLite'...
[07:47:15] Finished 'cleanLite' after 3.91 ms
[07:47:15] Starting 'copyLite'...
[07:47:15] Finished 'copyLite' after 11 ms
[07:47:15] Finished 'build:lite' after 1.05 min
[07:47:15] Finished 'build' after 41 min
Done in 2468.76s.


User@DESKTOP-T1ORLFU MINGW64 /c/BotpressBuild/botpress-master
$ yarn start


yarn run v1.22.10
$ cd ./out/bp && cross-env NODE_PATH=./ cross-env BP_MODULES_PATH=./data/modules/:../../modules:../../internal-modules STAN_DEV_MODE=true node index.js
06/01/2021 07:54:20.054 Database Created table 'srv_metadata'
06/01/2021 07:54:20.224 Database Created table 'srv_channel_users'
06/01/2021 07:54:20.309 Database Created table 'workspace_users'
06/01/2021 07:54:20.394 Database Created table 'workspace_invite_codes'
06/01/2021 07:54:20.663 Database Created table 'srv_logs'
06/01/2021 07:54:20.748 Database Created table 'dialog_sessions'
06/01/2021 07:54:20.833 Database Created table 'srv_ghost_files'
06/01/2021 07:54:20.918 Database Created table 'srv_ghost_index'
06/01/2021 07:54:21.003 Database Created table 'srv_kvs'
06/01/2021 07:54:21.110 Database Created table 'data_retention'
06/01/2021 07:54:21.195 Database Created table 'telemetry'
06/01/2021 07:54:21.354 Database Created table 'events'
06/01/2021 07:54:21.513 Database Created table 'conversations'
06/01/2021 07:54:21.682 Database Created table 'messages'
06/01/2021 07:54:21.940 Database Created table 'mapping'
06/01/2021 07:54:22.025 Database Created table 'tasks'
06/01/2021 07:54:22.110 Database Created table 'bot_chat_users'
06/01/2021 07:54:22.195 Database Created table 'srv_migrations'
06/01/2021 07:54:29.771 Launcher ========================================
                                             Botpress Server
                                             Version 12.22.0
                                                 OS win32
                                 ========================================
06/01/2021 07:54:29.787 Launcher App Data Dir: "C:\botpress"
06/01/2021 07:54:29.788 Launcher Using 10 modules
                        ⦿ analytics
                        ⦿ basic-skills
                        ⦿ builtin
                        ⦿ channel-web
                        ⦿ code-editor
                        ⦿ examples
                        ⦿ extensions
                        ⦿ nlu
                        ⦿ qna
                        ⦿ testing
                        ⊝ bot-improvement (disabled)
                        ⊝ broadcast (disabled)
                        ⊝ channel-messenger (disabled)
                        ⊝ channel-slack (disabled)
                        ⊝ channel-smooch (disabled)
                        ⊝ channel-teams (disabled)
                        ⊝ channel-telegram (disabled)
                        ⊝ channel-twilio (disabled)
                        ⊝ channel-vonage (disabled)
                        ⊝ google-speech (disabled)
                        ⊝ hitl (disabled)
                        ⊝ hitlnext (disabled)
                        ⊝ libraries (disabled)
                        ⊝ misunderstood (disabled)
                        ⊝ ndu (disabled)
                        ⊝ nlu-extras (disabled)
                        ⊝ nlu-testing (disabled)
                        ⊝ uipath (disabled)
06/01/2021 07:54:29.789 Server Running in DEVELOPMENT MODE
06/01/2021 07:54:29.827 Server JWT Secret isn't defined. Generating a random key...
06/01/2021 07:54:29.837 ModuleLoader Added missing "analytics.json" configuration file
06/01/2021 07:54:29.849 ModuleLoader Added missing "basic-skills.json" configuration file
06/01/2021 07:54:29.851 ModuleLoader Added missing "builtin.json" configuration file
06/01/2021 07:54:29.855 ModuleLoader Added missing "channel-web.json" configuration file
06/01/2021 07:54:29.857 ModuleLoader Added missing "code-editor.json" configuration file
06/01/2021 07:54:29.860 ModuleLoader Added missing "examples.json" configuration file
06/01/2021 07:54:29.861 ModuleLoader Added missing "extensions.json" configuration file
06/01/2021 07:54:29.863 ModuleLoader Added missing "nlu.json" configuration file
06/01/2021 07:54:29.864 ModuleLoader Added missing "qna.json" configuration file
06/01/2021 07:54:29.866 ModuleLoader Added missing "testing.json" configuration file
06/01/2021 07:54:31.167 Server Loaded 10 modules
06/01/2021 07:54:31.450 Auth Created table for strategy default
06/01/2021 07:54:31.453 WorkspaceService Created workspace
06/01/2021 07:54:31.503 CMS Loaded 10 content types
06/01/2021 07:54:31.512 Server Botpress Pro must be enabled to use a custom theme and customize the branding.
06/01/2021 07:54:32.408 HTTP Configured port 3000 is already in use. Using next port available: 3001
06/01/2021 07:54:32.408 HTTP External URL is not configured. Using default value of http://localhost:3001. Some features may not work properly
06/01/2021 07:54:32.428 Server Discovered 0 bots
06/01/2021 07:54:32.428 Server Local Action Server will only run in experimental mode
06/01/2021 07:54:32.517 Server Started in 2727ms
06/01/2021 07:54:32.517 Launcher Botpress is listening at: http://localhost:3001
06/01/2021 07:54:32.517 Launcher Botpress is exposed at: http://localhost:3001
```
