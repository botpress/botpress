---
id: environment-variables
title: Environment Variables
---

--------------------

## Environment Variables

Most of these variables can be set in the configuration file `data/global/botpress.config.json`. 

Infrastructure configuration (such as the database, cluster mode, etc.) isn't available in the configuration file, since it'ss required before the config is loaded.

Botpress supports `.env` files, so you don't have to set them every time you start the app. Save the file in the same folder as the executable.

### Common Variables

| Environment Variable   | Description                                                                         | Default            |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| `PORT`                 | Sets the port that Botpress will listen to.                                         | `3000`             |
| `BP_HOST`              | The host to check for incoming connections.                                         | `localhost`        |
| `EXTERNAL_URL`         | This is the external URL that users type in the address bar to talk with the bot.   | `http://HOST:PORT` |
| `DATABASE_URL`         | Full connection string to connect to the DB. For Postgres, start with `postgres://`.| -                  |
| `BP_PRODUCTION`        | Sets Botpress in production mode. This has the same effect as starting it with `-p`.| `false`            |
| `BPFS_STORAGE`         | Storage destination used by BPFS to read and write files (global and bots).         | `disk`             |
| `PRO_ENABLED`          | Enables the pro version of Botpress, the license key will be required.              | `false`            |
| `BP_LICENSE_KEY`       | Your license key (can also be specified in `botpress.config.json`).                 | -                  |
| `CLUSTER_ENABLED`      | Enables multi-node support using Redis.                                             | `false`            |
| `REDIS_URL`            | The connection string to connect to your Redis instance.                            | -                  |
| `AUTO_MIGRATE`         | Automatically migrates bots up to the running Botpress version.                     | -                  | 
| `DEBUG`                | Namespaces to [debug](#advanced-logging).                                           | -                  |

### Runtime and Modules

| Environment Variable        | Description                                                                                 | Default   |
| --------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| `VERBOSITY_LEVEL`           | Botpress will be more chatty when processing requests. This has the same effects as `-v`.   |           |
| `BP_DECISION_MIN_CONFIENCE` | Sets the minimum threshold required for the Decision Engine to elect a suggestion.          | `0.5`     |
| `FAST_TEXT_VERBOSITY`       | Define the level of verbosity that FastText will use when training models.                  | `0`       |
| `FAST_TEXT_CLEANUP_MS`      | The model will be kept in memory until it receives no messages to process for that duration.| `60000`   |
| `REVERSE_PROXY`             | When enabled, it uses "x-forwarded-for" to fetch the user IP instead of remoteAddress.      | `false`   |

It is also possible to use environment variables to override module configuration. The pattern is `BP_MODULE_%MODULE_NAME%_%OPTION_PATH%`, all in upper case. For example, to define the `languageSources` option of the module `nlu`, you would use `BP_MODULE_NLU_LANGUAGESOURCES`. 

:::tip
You can list the available environment variables for each module by enabling the `DEBUG=bp:configuration:modules:*` flag.
:::