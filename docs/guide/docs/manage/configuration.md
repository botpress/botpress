---
id: configuration
title: Configuration
---

There is currently an interface on Botpress to manage your server, bot's and module configuration. Most of the configuration is done using `JSON` files in the code editor.

There are also some configurations that can be edited by using environment variables.

On this page, you will learn about the Botpress global configuration, individual bot configuration, module configuration, and environment variables.

# Botpress Global Config

This is the main file used to configure the Botpress server. It will be created automatically when it is missing. Default values should be good when discovering Botpress, but in this page you will learn about the most common configuration you may need to change.

To get more information about each individual options, check out the [comments on the configuration schema](https://github.com/botpress/botpress/blob/master/src/bp/core/config/botpress.config.ts)

## HTTP Server Configuration

By default, Botpress will start an HTTP server on localhost, listening to port 3000. If the configured port is already in use, it will pick the next available one. You can change these by editing `httpServer.host` and `httpServer.port`.

### Exposing your bot on the internet

When you are ready to expose your bot externally, you will need to change some of the server settings. The server doesn't support HTTPS connections, so you will need to set up a reverse proxy in front of it (for example: NGINX).

This means that your server will still listen for connections on port 3000, but your reverse proxy will answer for queries on port 80. It's also the reverse proxy that will handle secure connections if you want to access your bot using `https`

At this point, Botpress doesn't know how to access the bot from the web. You will need to edit the configuration of `httpServer.externalUrl`. Set the configuration variable to the complete host name, for example `https://bot.botpress.com`

## Logs Configuration

Logs are very useful to debug and understand what happens when the bot doesn't behave as expected.

When you start Botpress from the binary (or using the Docker image), your chatbots will run in debug mode resulting in a very high logs verbosity.

There are 4 different levels of logs:

- Debug: display very detailed information about the bot operations
- Info: gives general information or "good to know" stuff
- Warn: means that something didn't go as expected, but the bot was able to recover
- Error: there was an error that should be addressed

By default, you will see `debug` with all other log levels in the console, and `errors` will be saved in the database (useful to keep track of them).
When you start Botpress in `production` mode, `debug` logs will be disabled for better performances.

It is also possible to send log output to a file in a specific folder. Check below for the required configuration

### How to save logs on the file system

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

## Enable or disable modules

When you start Botpress for the first time, the most popular modules included with the binary will be added to your `botpress.config.json` file. If you want to disable or enable modules, you need to edit the `modules` option.

The string `MODULE_ROOT` is a special string that is replaced when your configuration file is read. It represents the location of the modules folder on your hard drive, you shouldn't have to change it most of the times.

```js
{
  ..."modules": [
    {// When you new modules, you need to set their location, and if they are enabled or not.
      "location": "MODULES_ROOT/analytics",
      "enabled": true // You can change this to false to disable the module.
    },
    {
      "location": "MODULES_ROOT/basic-skills",
      "enabled": true
    }
}
```

# Individual Bot Configuration

Every bot that you create will have its own configuration file. It is located at `data/bots/NAME_OF_BOT/bot.config.json`. Most of the available options can be edited by clicking on the `Config` link next to the bot name on the administration panel.

If you enable additional modules that adds other

# Module Configuration

When you enable a module on Botpress, they are available globally, which means that you can't disable or enable them for specific bots. You can, however, use a different configuration for every bots.

Each module has a different set of possible configuration, so we won't go through them here. What you need to know is that when you run a module for the first time, the default configuration will be created in `data/global/config/MODULE_NAME.json`. If you need a special configuration for your bot, create a `config` folder in the bot folder, and copy the file in your bot folder: `data/bots/BOT_NAME/config/MODULE_NAME.json`. You will probably need to create the folder the first time.

# Environment Variables

All the `botpress.config.json` file can be set with a environment variable. These must be either defined as environment variables, or defined in a `.env` file in the same folder as the Botpress executable.

Here there are:

| Environment Variable | Description                                                                                               | Default |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------- |
| DATABASE             | The database type to use. `postgres` or `sqlite`                                                          | sqlite  |
| DATABASE_URL         | Full connection string to connect to the DB                                                               |         |
| BP_PRODUCTION        | Sets Botpress in production mode (thus enabling Ghost). This has the same effect as starting it with `-p` | false   |
| CLUSTER_ENABLED      | Enables multi-node support using Redis                                                                    | false   |
| REDIS_URL            | The connection string to connect to your Redis instance                                                   |         |

## Environment Variables for modules

You can modify the value of `config/MODULE_NAME.json` by an environment variable. The value needs to be prefixed by `BP_MODULE_<MODULE_NAME>`. For example, the `nlu.json` has an NLUServer key. To modify this value by an environment variable you can set this value in the `.env`

```
BP_MODULE_NLU_NLUSERVER = { autoStart: false, endpoint: "<URL>" }
```

## More Information

- Check out the [database](../tutorials/database) page for details about `DATABASE` and `DATABASE_URL`
- Check out the [cluster](../developers/cluster) page for details about `CLUSTER_ENABLED` and `REDIS_URL`
