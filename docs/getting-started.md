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

## Middlewares

Middlewares are a critical component of botpress. Simply put, they are functions that process messages. Think of it this way: everything that enter or leave your bot is coming in (or out) from middlewares.

If you have used [Express](TODO) before, botpress middlewares are very similar to express's middlewares.

Botpress has two middlewares: [incoming](TODO) and [outgoing](TODO)

**To receive messages**: An installed module must pipe messages into the [incoming middleware](TODO)

**To send messages**: You (or a module) must pipe messages into the [outgoing middleware](TODO) and have a module able to send it to the right platform

### Example

**Incoming**: [botpress-messenger](TODO) connects to Facebook and receives messages from its built-in Webhook. It then pipes messages into the incoming middleware, which your bot can process.

**Outgoing**: [botpress-messenger](TODO) listens (through a middleware function) for messages it can process on the outgoing middleware and sends them to Facebook through the Messenger Send API.

## Processing messages

Botpress comes with an utility function to capture messages on the incoming middleware: `bp.hear`

## Notifications

## Logging

## Authentication
