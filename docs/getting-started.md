## Installation

To install botpress, you need [NPM](https://npmjs.com) version 4.2 or higher.

```
npm install -g botpress
```

**For developers**: Botpress needs to be installed globally on developers machine in order to create a bot and install modules. 

**To run a bot**: botpress does not need to be installed, as botpress is installed as a local dependency in the bot.

## Command line tool

The global command line tool is available as `botpress` and `bp`. For example, running `bp init` is the equivalent of running `botpress init`.

**[!] Ruby users**: If you have Ruby installed, `bp` might already be linked to the `Bundle Package Command`, in which case you must either use `botpress` or change your `bp` symbolic link to point to botpress instead.

## Creating a bot

`botpress init` is the only safe and preffered way of creating a Botpress bot. This command must be run inside an empty directory as it will create some files required to run your bot. The following files will be generated:

```js
    - botfile.js // your bot's configuration. botpress uses this
    - index.js // your bot's entry point. bot logic goes here
    - package.json // regular node package.json file
    - LICENSE // your bot license, either AGPLv3 or Botpress License
    - .gitignore // ignoring some botpress-created files by default
```

## Installing modules

Botpress aims to be as lightweight as possible and includes only what is necessary to almost all bots. Much of the functionalities your bot will have will come from modules. Modules must be installed separately using the [`botpress install`](TODO) command.

A list of all available modules can be found in your bot's web interface. Modules are published to NPM and botpress crawls and indexes available and valid modules to make it easier for you to install them.

The following commands are all valid:

```
botpress install botpress-messenger
botpress install messenger
botpress i messenger
bp i messenger
bp i messenger analytics rivescript broadcast
bp i ~/john/Desktop/botpress-local-module
bp i ../local-module
```

You may uninstall modules with the [`botpress uninstall`](TODO) command:

```
botpress uninstall messenger
```

## The `bp` instance

In your bot's entry point (`index.js`), you have access to the botpress instance `bp`. From now on, we will simply refer to this instance as **`bp`**.

`bp` is the only object you need to work with when creating a bot. It contains everything you need to process messages, send notifications, send messages, communicate with modules, setup custom HTTP routes, log stuff to the console and more.

## Processing messages

[`bp.hear`](TODO) is an utility function to capture and process messages. Behind the scene, botpress simply appends an [incoming middleware](TODO), but we don't need to know about these for now.



## Notifications

## Logging

## Authentication
