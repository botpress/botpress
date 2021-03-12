---
id: deploying
title: Building From Source
---
Botpress has added flexibility for developers who want access to the core codebase. You can clone Botpress from the source repository on Github, allowing you to test code, modules, and components more dynamically. 

## Compiling From Source
You can build Botpress from the (source repository)[https://github.com/botpress/botpress] in a few simple steps. Doing this is useful when you need to create custom modules and components.

### Prerequisites

Install node version 12.18.1 for (your operating system)[https://nodejs.org/download/release/v12.18.1/]. **Tip:** on windows, download and use the .msi installer 

Install (Yarn package manager)[https://yarnpkg.com/]

### Installation
While in the directory where you want to host your instance of Botpress, run the following commands in this sequence:

> git clone git@github.com:botpress/botpress.git && cd ./botpress/ or git clone https://github.com/botpress/botpress.git && cd ./botpress/
> yarn clean cache (proceed to the next step if this command fails)
> yarn
> yarn build
> yarn start

After following the instructions above, your command line should look as follows:


```js
$ yarn start
yarn run v1.22.10
$ cd ./out/bp && cross-env NODE_PATH=./ cross-env BP_MODULES_PATH=./data/modules/:../../modules:../../internal-modules node index.js
03/05/2021 14:45:14.967 Launcher ========================================
                                             Botpress Server
                                             Version 12.18.0
                                                OS win32
                                 ========================================
03/05/2021 14:45:14.975 Launcher App Data Dir: "C:\Users\Michael\botpress"
03/05/2021 14:45:14.976 Launcher Using 10 modules
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
03/05/2021 14:45:14.977 Server Running in DEVELOPMENT MODE
03/05/2021 14:45:22.944 Server Loaded 10 modules
03/05/2021 14:45:23.217 CMS Loaded 7 content types
03/05/2021 14:45:23.224 Server Botpress Pro must be enabled to use a custom theme and customize the branding.
03/05/2021 14:45:28.320 HTTP External URL is not configured. Using default value of http://localhost:3000. Some features may not work properly
03/05/2021 14:45:28.343 Server Discovered 0 bots
03/05/2021 14:45:28.346 Server Local Action Server will only run in experimental mode
03/05/2021 14:45:28.434 Server Started in 13457ms
03/05/2021 14:45:28.436 Launcher Botpress is listening at: http://localhost:3000
03/05/2021 14:45:28.436 Launcher Botpress is exposed at: http://localhost:3000
```
