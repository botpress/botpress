---
id: deploy
title: Deploy
---

---

Botpress has added flexibility for developers who want access to the core codebase. You can clone Botpress from the source repository on Github, allowing you to test code, modules, and components more dynamically.

## Compiling From Source

You can build Botpress from the [source repository](https://github.com/botpress/v12) in a few simple steps. Doing this is useful when you need to create custom modules and components.

### Prerequisites

Install node version 12.18.1 for [your operating system](https://nodejs.org/download/release/v12.18.1/).

:::tip
On Windows, download and use the `.msi` installer.
:::

Install [Yarn package manager](https://yarnpkg.com/).

### Installation

While in the directory where you want to host your instance of Botpress, run the following commands in this sequence:

1. `git clone git@github.com:botpress/v12.git && cd botpress`
2. `yarn cache clean` (proceed to the next step if this command fails)
3. `yarn`
4. `yarn build`
5. `yarn start`

If you bumped into some errors during the execution of the `yarn build` command, you can try resetting your local repository:

1. Go to the [Releases](https://github.com/botpress/v12/releases) page.
1. Click the commit associated with the latest release to open the commit page.
1. Copy the full commit hash.
1. Run this command with the copied commit hash: `git reset <copied hash>`.
1. Run `yarn build` again.

:::note
If you are in a hurry and cannot wait for a fix release, [clone the commit](https://coderwall.com/p/xyuoza/git-cloning-specific-commits). Do not modify files one by one.
:::

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

Replicate this docker file using your distribution (such as Raspbian) and use it. After that, find the file with extension `*.node` for all libraries.

To acess this file (with extension `*.node`), start a docker container with the image you just built. Enter this container using the command:

`docker run -it --rm --name <YOUR_IMG_NAME> bp-bindings`

Inside each of `/build/node-fasttext/*`,`/build/node-crfsuite/*`,`/build/node-svm/*` and `/build/node-sentencepiece/*` there should be a `build/` or `release/` directory where you’ll find a file with extension `*.node`.

If you’re running Botpress from sources, the correct location would either be: `build/native-extensions/linux/default or create` the directory `build/native-extensions/linux/<your-distribution>`. You can look at the file `rewire.ts` if you want to see how the important processes occur.

If you’re using the Botpress official binary, place the files in a directory named `bindings`.

After following the instructions above, you're good to go.

## Config File

Botpress uses `JSON` files for most configurations. Environment variables can also set configuration.

## Botpress Global Config

The Botpress global config file is the main file used to configure the Botpress server. Your instance of Botpress creates this file automatically if it is missing. Default values should work well when using Botpress, but we will show you other configurations you may need to change on this page.

To get more information about each option, check out the [comments on the configuration schema](https://github.com/botpress/v12/blob/master/src/bp/core/config/botpress.config.ts)

## HTTP Server Configuration

By default, Botpress starts an HTTP server on localhost, listening to port 3000. If the configured port is already in use, it will pick the next available one. You can change these by editing `httpServer.host` and `httpServer.port`.

### Going to Production

When going to production and publishing your chatbot, you will need to change some of the server settings.

The server doesn't support HTTPS connections, so you will need to set up a reverse proxy in front of it (for example: NGINX). In the main [repo](https://github.com/botpress/v12), Botpress have created an example with a HTTPS with [docker-compose](https://github.com/botpress/v12/blob/master/examples/docker-compose/docker-compose-community-nginx-https.yaml).

:::note Example

```
$ docker-compose -f docker-compose-community-nginx-https.yaml up -d
```

[![asciicast](https://asciinema.org/a/gexyfstCsIGjLWX1sb8cZIWn3.svg)](https://asciinema.org/a/gexyfstCsIGjLWX1sb8cZIWn3)
:::

Your server still listens to connections on port 3000, but your reverse proxy answers queries on port 80. The reverse proxy handles secure connections if you want to access your bot using `https`.

At this point, Botpress doesn't know how to access the bot from the web. You need to set the configuration variable to the complete host name (URL) in `httpServer.externalUrl`.

### Changing the Base URL of Your Bot

By default, Botpress is accessible at your domain root (ex: https://bot.botpress.com/). You can change that to serve it from a different URL, for example `https://bot.botpress.com/botpress/somepath/`. To do so, set the External URL either in environment variable (`EXTERNAL_URL`) or via the `botpress.config.json` file.

The new root path will be automatically extracted from that URL.

## Logs Configuration

Logs are very useful to debug and understand what happens when the bot doesn't behave as expected.

When you start Botpress from the binary (or using the Docker image), the bot is in `debug` mode. This means that a lot of information will be displayed in the console to understand what happens.

There are 5 different levels of logs:

- Debug: displays very detailed information about the bot operations;
- Info: gives general information or "good-to-know" stuff;
- Warn: means that something didn't go as expected, but the bot was able to recover;
- Error: there was an error that should be addressed;
- Critical: something prevents the bot or the server from behaving correctly (may not work at all).

### Change Log Verbosity

There are three different configuration of verbosity for the logger:

- Production (verbosity: 0)
- Developer (verbosity: 1)
- Debug (verbosity: 2)

By default, Botpress uses the `Debug` configuration.

:::note
When you run Botpress in production `BP_PRODUCTION=true` or with cluster mode `CLUSTER_ENABLED=true`, logs are configured as `Production`.
:::

You can configure the level of verbosity using an environment variable (`VERBOSITY_LEVEL=0` for production) or using command line (ex: `-vv` for Debug).

#### Production

- The console displays `info`, `warn`, `error` and `critical` logs;
- In the studio's log console, bot developers sees `debug` logs for their bot;
- No stack traces are displayed in the console.

#### Developer

- Same thing as `Production`, but the console will also include stack traces.

#### Debug

- Includes everything from `Production` and `Developer`;
- Debug logs are displayed in the main console.

### How to Save Logs on the File System

:::note
You can also send log outputs to a file in a specific folder.
:::

Edit your `botpress.config.json` file and change your file to match the following:

```js
{
  ...
  "logs": {
    ...
    "fileOutput": {
      "enabled": true,
      "folder": "./", // Change this to any folder, by default it will be in the same folder as the executable
      "maxFileSize": 10000 // By default, the maximum file size will be kept under 10mb
    }
  },
}
```

## Advanced Logging

In a production environment, you may want to persist additional logs such as full audit trail. You can enable more granular logs by using the [DEBUG environment variable](/building-chatbots/testing-&-debugging/debugger)) and saving those extra logs to a separate file:

```sh
# Linux & OSX
# Append audit trail to log file
DEBUG=bp:audit:* ./bp -p 2>> ./botpress.log
```

:::tip
You can combine this with a log rotation tool such as [newsyslog](https://www.real-world-systems.com/docs/newsyslog.1.html) or [logrotate](https://linux.die.net/man/8/logrotate).
:::

## Enable or disable modules

When you start Botpress for the first time, the most popular modules included with the binary will be added to your `botpress.config.json` file. If you want to disable or enable modules, you may either do so in the Admin, or edit the `modules` property in `botpress.config.json`.

:::note
The string `MODULE_ROOT` is a special one that is replaced when your configuration file is read. It represents the location of the modules folder on your hard drive; you shouldn't have to change it.
:::

![Admin Modules Page](/assets/admin_modules.png)

```js
{
  ..."modules": [
    {// When you add new modules, you need to set their location, and if they are enabled or not.
      "location": "MODULES_ROOT/analytics",
      "enabled": true // You can change this to false to disable the module.
    },
    {
      "location": "MODULES_ROOT/basic-skills",
      "enabled": true
    }
}
```

## Individual Bot Configuration

Every bot that you create has its own configuration file, located at `data/bots/BOT_ID/bot.config.json`. Most of the available options can be edited by clicking on the `Config` link next to the bot name in the Admin, or accessing the configuration panel from the Conversation Studio.

## Module Configuration

When you enable a module on Botpress, it is available globally, which means that you can't disable or enable them for specific bots. However, you can configure every bot differently.

When you run a module for the first time, the default configuration is created in `data/global/config/MODULE_NAME.json`. If you need a special configuration for your bot, from the Code Editor you can right click any global configuration, then **Duplicate to current bot**.

Alternatively, you can manually create a `config` folder (such as `data/bots/BOT_ID/config/MODULE_NAME.json`) in the bot folder and copy the configuration file there.

### Security

These variables can be used to disable some sensitive features destined to Super Admins.

| Environment Variable              | Description                                                                                                                                         | Default |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `BP_CODE_EDITOR_DISABLE_ADVANCED` | The advanced editor lacks some safeguard and is only intended for experienced users. It can be disabled completely using this environment variable. | `false` |
| `BP_CODE_EDITOR_DISABLE_UPLOAD`   | Prevent users from uploading files when using the advanced editor.                                                                                  | `false` |
| `BP_DISABLE_SERVER_CONFIG`        | Prevent Super Admins from accessing the "Production Checklist" page on the Admin panel, since it may contain sensitive information.                 | `false` |

## More Information

- Check out the database page for details about `DATABASE_URL`.
- Check out the cluster page for details about `CLUSTER_ENABLED` and `REDIS_URL`.
