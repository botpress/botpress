---
id: version-12.20.2-deploying
title: Building From Source
original_id: deploying
---
Botpress has added flexibility for developers who want access to the core codebase. You can clone Botpress from the source repository on Github, allowing you to test code, modules, and components more dynamically. 

## Compiling From Source
You can build Botpress from the (source repository)[https://github.com/botpress/botpress] in a few simple steps. Doing this is useful when you need to create custom modules and components.

### Prerequisites

Install node version 12.18.1 for (your operating system)[https://nodejs.org/download/release/v12.18.1/]. **Tip:** on windows, download and use the .msi installer 

Install (Yarn package manager)[https://yarnpkg.com/]

### Installation
While in the directory where you want to host your instance of Botpress, run the following commands in this sequence:

- git clone git@github.com:botpress/botpress.git && cd ./botpress/ or git clone https://github.com/botpress/botpress.git && cd ./botpress/
- yarn cache clean (proceed to the next step if this command fails)
- yarn
- yarn build
- yarn start

After following the instructions above, your command line should look as follows:


```bash
User@DESKTOP-T1ORLFU MINGW64 ~/Downloads/botpress-12.19.0/botpress-12.19.0
$ yarn 
yarn install v1.22.10
[1/5] Validating package.json...
[2/5] Resolving packages...
[3/5] Fetching packages...
info fsevents@1.2.7: The platform "win32" is incompatible with this module.
info "fsevents@1.2.7" is an optional dependency and failed compatibility check. Excluding it from installation.
[4/5] Linking dependencies...
warning " > bluebird-global@1.0.1" has unmet peer dependency "bluebird@*".
warning " > bluebird-retry@0.11.0" has unmet peer dependency "bluebird@>=2.3.10".
[5/5] Building fresh packages...
Done in 396.01s.


User@DESKTOP-T1ORLFU MINGW64 ~/Downloads/botpress-12.19.0/botpress-12.19.0
$ yarn build
yarn run v1.22.10
$ yarn cmd build
$ yarn run gulp build
$ C:\Users\User\Downloads\botpress-12.19.0\botpress-12.19.0\node_modules\.bin\gulp build
[05:03:46] Using gulpfile ~\Downloads\botpress-12.19.0\botpress-12.19.0\gulpfile.js
[05:03:46] Starting 'build'...
[05:03:46] Starting 'build:sharedLite'...
[05:03:46] Starting 'sharedLiteBuild'...
warning package.json: No license field
warning studio-ui0lite@1.0.0: No license field
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...
[05:03:46] Finished 'sharedLiteBuild' after 480 ms
[05:03:46] Finished 'build:sharedLite' after 481 ms
[05:03:46] Starting 'clearMigrations'...
[05:03:46] Finished 'clearMigrations' after 10 ms
[05:03:46] Starting 'maybeFetchPro'...
[05:03:46] Finished 'maybeFetchPro' after 5.98 ms
[05:03:46] Starting 'writeMetadata'...
[05:03:46] Finished 'writeMetadata' after 11 ms
[05:03:46] Starting 'compileTypescript'...
[05:04:04] Finished 'compileTypescript' after 18 s
[05:04:04] Starting 'buildSchemas'...
[05:04:07] Finished 'buildSchemas' after 3.42 s
[05:04:07] Starting 'createOutputDirs'...
[05:04:07] Finished 'createOutputDirs' after 14 ms
[05:04:07] Starting 'copyBinaries'...
[05:04:07] Finished 'copyBinaries' after 1.68 ms
[05:04:07] Starting 'copyPreTrained'...
[05:04:07] Finished 'copyPreTrained' after 19 ms
[05:04:07] Starting 'copyStopWords'...
[05:04:07] Finished 'copyStopWords' after 4.88 ms
[05:04:07] Starting 'build:shared'...
[05:04:07] Starting 'cleanShared'...
[05:04:07] Finished 'cleanShared' after 1.84 ms
[05:04:07] Starting 'sharedBuild'...
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
[05:06:58] Shared    398 modules

WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
This can impact web performance.
Assets:
  index.js (689 KiB)

WARNING in entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (244 KiB). This can impact web performance.
Entrypoints:
  main (689 KiB)
      index.js


WARNING in webpack performance recommendations:
You can limit the size of your bundles by using import() or require.ensure to lazy load some parts of your application.
For more info visit https://webpack.js.org/guides/code-splitting/
$ node-sass src/theme/main.scss dist/theme.css --importer=node_modules/node-sass-tilde-importer
Rendering Complete, saving .css file...
Wrote CSS to C:\Users\User\Downloads\botpress-12.19.0\botpress-12.19.0\src\bp\ui-shared\dist\theme.css
[05:07:01] Finished 'sharedBuild' after 2.88 min
[05:07:01] Finished 'build:shared' after 2.88 min
[05:07:01] Starting 'initStudio'...
warning " > react-dock@0.2.4" has unmet peer dependency "babel-runtime@^6.3.13".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react@^16.12.0".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react-dom@^16.12.0".
warning " > ts-loader@6.2.1" has unmet peer dependency "typescript@*".
[05:10:25] Finished 'initStudio' after 3.38 min
[05:10:25] Starting 'buildModuleBuilder'...
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

[05:11:21] Finished 'buildModuleBuilder' after 56 s
[05:11:21] Starting 'cleanSdk'...
[05:11:21] Finished 'cleanSdk' after 6.23 ms
[05:11:21] Starting 'build-module analytics'...
[05:11:53] Finished 'build-module analytics' after 33 s
[05:11:53] Starting 'build-module basic-skills'...
[05:12:11] Finished 'build-module basic-skills' after 17 s
[05:12:11] Starting 'build-module bot-improvement'...
[05:12:24] Finished 'build-module bot-improvement' after 14 s
[05:12:24] Starting 'build-module broadcast'...
[05:12:48] Finished 'build-module broadcast' after 24 s
[05:12:48] Starting 'build-module builtin'...
[05:12:56] Finished 'build-module builtin' after 7.56 s
[05:12:56] Starting 'build-module channel-messenger'...
[05:13:05] Finished 'build-module channel-messenger' after 8.76 s
[05:13:05] Starting 'build-module channel-slack'...
[05:13:19] Finished 'build-module channel-slack' after 14 s
[05:13:19] Starting 'build-module channel-smooch'...
[05:13:27] Finished 'build-module channel-smooch' after 8.18 s
[05:13:27] Starting 'build-module channel-teams'...
[05:13:44] Finished 'build-module channel-teams' after 17 s
[05:13:44] Starting 'build-module channel-telegram'...
[05:13:53] Finished 'build-module channel-telegram' after 9.81 s
[05:13:53] Starting 'build-module channel-twilio'...
[05:14:12] Finished 'build-module channel-twilio' after 19 s
[05:14:12] Starting 'build-module channel-web'...
[05:15:26] Finished 'build-module channel-web' after 1.22 min
[05:15:26] Starting 'build-module code-editor'...
[05:16:17] Finished 'build-module code-editor' after 50 s
[05:16:17] Starting 'build-module examples'...
[05:16:24] Finished 'build-module examples' after 7.73 s
[05:16:24] Starting 'build-module extensions'...
[05:16:46] Finished 'build-module extensions' after 21 s
[05:16:46] Starting 'build-module hitl'...
[05:17:01] Finished 'build-module hitl' after 15 s
[05:17:01] Starting 'build-module hitlnext'...
[05:17:30] Finished 'build-module hitlnext' after 29 s
[05:17:30] Starting 'build-module libraries'...
[05:18:38] Finished 'build-module libraries' after 1.13 min
[05:18:38] Starting 'build-module misunderstood'...
[05:18:58] Finished 'build-module misunderstood' after 20 s
[05:18:58] Starting 'build-module ndu'...
[05:19:10] Finished 'build-module ndu' after 12 s
[05:19:10] Starting 'build-module nlu-extras'...
[05:19:36] Finished 'build-module nlu-extras' after 26 s
[05:19:36] Starting 'build-module nlu-testing'...
[05:19:50] Finished 'build-module nlu-testing' after 15 s
[05:19:50] Starting 'build-module nlu'...
[05:20:12] Finished 'build-module nlu' after 22 s
[05:20:12] Starting 'build-module qna'...
[05:20:30] Finished 'build-module qna' after 18 s
[05:20:30] Starting 'build-module testing'...
[05:20:46] Finished 'build-module testing' after 15 s
[05:20:46] Starting 'build-module uipath'...
[05:20:54] Finished 'build-module uipath' after 8.4 s
[05:20:54] Starting 'build:shared'...
[05:20:54] Starting 'cleanShared'...
[05:20:54] Finished 'cleanShared' after 4.31 ms
[05:20:54] Starting 'sharedBuild'...
[1/5] Validating package.json...
[2/5] Resolving packages...
success Already up-to-date.
$ cross-env NODE_ENV=production node ./webpack.config.js --compile --nomap && yarn scss
[05:21:08] Shared    398 modules

WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
This can impact web performance.
Assets:
  index.js (689 KiB)

WARNING in entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (244 KiB). This can impact web performance.
Entrypoints:
  main (689 KiB)
      index.js


WARNING in webpack performance recommendations:
You can limit the size of your bundles by using import() or require.ensure to lazy load some parts of your application.
For more info visit https://webpack.js.org/guides/code-splitting/
$ node-sass src/theme/main.scss dist/theme.css --importer=node_modules/node-sass-tilde-importer
Rendering Complete, saving .css file...
Wrote CSS to C:\Users\User\Downloads\botpress-12.19.0\botpress-12.19.0\src\bp\ui-shared\dist\theme.css
[05:21:10] Finished 'sharedBuild' after 16 s
[05:21:10] Finished 'build:shared' after 16 s
[05:21:10] Starting 'build:studio'...
[05:21:10] Starting 'buildStudio'...
warning " > react-dock@0.2.4" has unmet peer dependency "babel-runtime@^6.3.13".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react@^16.12.0".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react-dom@^16.12.0".
warning " > ts-loader@6.2.1" has unmet peer dependency "typescript@*".
clean-webpack-plugin: C:\Users\User\Downloads\botpress-12.19.0\botpress-12.19.0\src\bp\ui-studio\public has been removed.
[hardsource:e925aa92] Writing new cache e925aa92...
[hardsource:e925aa92] Tracking node dependencies with: yarn.lock.
[05:22:08] Finished 'buildStudio' after 58 s
[05:22:08] Starting 'cleanStudio'...
[05:22:08] Finished 'cleanStudio' after 1.62 ms
[05:22:08] Starting 'cleanStudioAssets'...
[05:22:08] Finished 'cleanStudioAssets' after 1.08 ms
[05:22:08] Starting 'copyStudio'...
[05:22:10] Finished 'copyStudio' after 1.34 s
[05:22:10] Finished 'build:studio' after 60 s
[05:22:10] Starting 'build:admin'...
[05:22:10] Starting 'buildAdmin'...
warning " > bootstrap@4.3.1" has unmet peer dependency "jquery@1.9.1 - 3".
warning " > bootstrap@4.3.1" has unmet peer dependency "popper.js@^1.14.7".
warning " > react-table@6.11.5" has unmet peer dependency "prop-types@^15.7.0".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react@^16.12.0".
warning "ui-shared > react-command-palette@0.12.0-0" has incorrect peer dependency "react-dom@^16.12.0".
warning " > expose-loader@0.7.5" has unmet peer dependency "webpack@^2.0.0 || ^3.0.0 || ^4.0.0".
warning " > hard-source-webpack-plugin@0.13.1" has unmet peer dependency "webpack@*".
Wrote 1 CSS files to C:\Users\User\Downloads\botpress-12.19.0\botpress-12.19.0\src\bp\ui-admin\src\
The following changes are being made to your tsconfig.json file:
  - compilerOptions.baseUrl must not be set (absolute imports are not supported (yet))
  - compilerOptions.paths must not be set (aliased imports are not supported)

[hardsource:e0056e7b] Writing new cache e0056e7b...
[hardsource:e0056e7b] Tracking node dependencies with: yarn.lock.
Browserslist: caniuse-lite is outdated. Please run next command `yarn upgrade`
[05:27:22] Finished 'buildAdmin' after 5.2 min
[05:27:22] Starting 'cleanAdmin'...
[05:27:22] Finished 'cleanAdmin' after 9.18 ms
[05:27:22] Starting 'copyAdmin'...
[05:27:23] Finished 'copyAdmin' after 615 ms
[05:27:23] Finished 'build:admin' after 5.22 min
[05:27:23] Finished 'build' after 24 min
Done in 1420.88s.

User@DESKTOP-T1ORLFU MINGW64 ~/Downloads/botpress-12.19.0/botpress-12.19.0
$ yarn start
yarn run v1.22.10
$ cd ./out/bp && cross-env NODE_PATH=./ cross-env BP_MODULES_PATH=./data/modules/:../../modules:../../internal-modules node index.js
03/16/2021 11:25:32.600 Database Created table 'srv_metadata'
03/16/2021 11:25:32.928 Database Created table 'srv_channel_users'
03/16/2021 11:25:33.045 Database Created table 'workspace_users'
03/16/2021 11:25:33.142 Database Created table 'workspace_invite_codes'
03/16/2021 11:25:33.470 Database Created table 'srv_logs'
03/16/2021 11:25:33.611 Database Created table 'dialog_sessions'
03/16/2021 11:25:33.773 Database Created table 'srv_ghost_files'
03/16/2021 11:25:33.935 Database Created table 'srv_ghost_index'
03/16/2021 11:25:34.057 Database Created table 'srv_notifications'
03/16/2021 11:25:34.198 Database Created table 'srv_kvs'
03/16/2021 11:25:34.338 Database Created table 'data_retention'
03/16/2021 11:25:34.523 Database Created table 'telemetry'
03/16/2021 11:25:34.893 Database Created table 'events'
03/16/2021 11:25:35.230 Database Created table 'conversations'
03/16/2021 11:25:35.481 Database Created table 'messages'
03/16/2021 11:25:35.587 Database Created table 'tasks'
03/16/2021 11:25:35.705 Database Created table 'bot_chat_users'
03/16/2021 11:25:35.813 Database Created table 'srv_migrations'
03/16/2021 11:25:44.166 Launcher ========================================
                                             Botpress Server
                                             Version 12.19.0
                                                 OS win32
                                 ========================================
03/16/2021 11:25:44.196 Launcher App Data Dir: "C:\Users\User\botpress"
03/16/2021 11:25:44.197 Launcher Using 10 modules
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
                        ⊝ hitl (disabled)
                        ⊝ hitlnext (disabled)
                        ⊝ libraries (disabled)
                        ⊝ misunderstood (disabled)
                        ⊝ ndu (disabled)
                        ⊝ nlu-extras (disabled)
                        ⊝ nlu-testing (disabled)
                        ⊝ uipath (disabled)
03/16/2021 11:25:44.199 Server Running in DEVELOPMENT MODE
03/16/2021 11:25:44.297 Server JWT Secret isn't defined. Generating a random key...
03/16/2021 11:25:44.328 ModuleLoader Added missing "analytics.json" configuration file
03/16/2021 11:25:44.373 ModuleLoader Added missing "basic-skills.json" configuration file
03/16/2021 11:25:44.375 ModuleLoader Added missing "builtin.json" configuration file
03/16/2021 11:25:44.394 ModuleLoader Added missing "channel-web.json" configuration file
03/16/2021 11:25:44.398 ModuleLoader Added missing "code-editor.json" configuration file
03/16/2021 11:25:44.401 ModuleLoader Added missing "examples.json" configuration file
03/16/2021 11:25:44.404 ModuleLoader Added missing "extensions.json" configuration file
03/16/2021 11:25:44.434 ModuleLoader Added missing "nlu.json" configuration file
03/16/2021 11:25:44.437 ModuleLoader Added missing "qna.json" configuration file
03/16/2021 11:25:44.441 ModuleLoader Added missing "testing.json" configuration file
03/16/2021 11:25:50.894 Server Loaded 10 modules
03/16/2021 11:25:51.660 Auth Created table for strategy default
03/16/2021 11:25:51.663 WorkspaceService Created workspace
03/16/2021 11:25:51.754 CMS Loaded 7 content types
03/16/2021 11:25:51.770 Server Botpress Pro must be enabled to use a custom theme and customize the branding.
03/16/2021 11:25:54.488 HTTP External URL is not configured. Using default value of http://localhost:3000. Some features may not work properly
03/16/2021 11:25:54.506 Server Discovered 0 bots
03/16/2021 11:25:54.509 Server Local Action Server will only run in experimental mode
03/16/2021 11:25:54.704 Server Started in 10505ms
03/16/2021 11:25:54.706 Launcher Botpress is listening at: http://localhost:3000
03/16/2021 11:25:54.706 Launcher Botpress is exposed at: http://localhost:3000```
```

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
