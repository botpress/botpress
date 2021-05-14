---
id: configuration
title: Configuration
---

Botpress uses `JSON` files for most configurations. Environment variables can also set configuration. In this topic, you will learn about Botpress global configuration, individual chatbot configuration, module configuration, and environment variables.

## Botpress Global Config
The Botpress global config file is the main file used to configure the Botpress server. Your instance of Botpress creates this file automatically if it is missing. Default values should work well when using Botpress, but we will show you other configurations you may need to change on this page.

To get more information about each option, check out the [comments on the configuration schema](https://github.com/botpress/botpress/blob/master/src/bp/core/config/botpress.config.ts)

## HTTP Server Configuration
By default, Botpress will start an HTTP server on localhost, listening to port 3000. If the configured port is already in use, it will pick the next available one. You can change the port by editing `httpServer.host` and `httpServer.port`.

### Exposing your chatbot to the internet
When you are ready to expose your chatbot externally, you will need to change some server settings. The server doesn't support HTTPS connections, so you will need to set up a reverse proxy in front of it (for example, NGINX).

Your server will still listen for connections on port 3000, but your reverse proxy will answer queries on port 80. It's also the reverse proxy that will handle secure connections if you want to access your chatbot using `https`

At this point, Botpress doesn't know how to access the chatbot from the web.  You will need to set the `httpServer.externalUrl` configuration to the complete hostname, for example, `https://bot.botpress.com`

### Changing the base URL of your bot
By default, Botpress is accessible at the root of your domain (ex: https://bot.botpress.com/). It is possible to change that to serve it from a different URL, for example, `https://bot.botpress.com/botpress/somepath/`. All you need to do is set the External URL as either an environment variable (`EXTERNAL_URL`) or via the `botpress.config.json` file.

The path will be automatically extracted from that URL and will function as the root path.

## Logs Configuration
Logs are handy to debug and understand the root cause when your chatbot doesn't behave as expected.

When you start Botpress from the binary (or using the Docker image), the chatbot is in `debug` mode. As such, the console will display a lot of information to understand what happens.

There are five different levels of logs:

- Debug: display very detailed information about the chatbot operations
- Info: gives general information or "good to know" stuff
- Warn: means that something didn't go as expected, but the chatbot was able to recover
- Error: there was an error that you should address
- Critical: something prevents the chatbot or the server from behaving correctly (may not work at all)

### Log Verbosity
Verbosity is the amount of information contained in the debug log. There are three different configurations of verbosity for the logger:

- Production (verbosity: 0)
- Developer (verbosity: 1)
- Debug (verbosity: 2)

By default, Botpress uses the `Debug` configuration. When you run Botpress in production `BP_PRODUCTION=true` or with cluster mode `CLUSTER_ENABLED=true`, logs will be configured as `Production`

You can configure the level of verbosity using an environment variable (`VERBOSITY_LEVEL=0` for production) or using a command line (ex: `-vv` for Debug)

#### Production
- The console will display `info`, `warn`, `error`, and `critical` logs
- In the studio's log console, chatbot developers will see `debug` logs for their chatbot
-The console will display-No stack traces\* 

#### Developer
- Logs will contain the same information `Production`, but the console will also include stack traces\*

#### Debug
- Includes everything from `Production` and `Developer`
- The central ui will display debug logs in the main console

\* Stack traces are additional information used by developers to identify the source of an error. They are helpful when developing, but in production, they can hide more important log messages.

### Saving Logs
It is also possible to send log output to a file in a specific folder. To save logs, edit your `botpress.config.json` file as follows:

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

### Advanced Logging
In a production environment, you can persist additional logs such as a full audit trail. To enable more granular logs, use the debug environment variable and save those extra logs to a separate file:

```sh
# Linux & OSX
# Append audit trail to the log file
DEBUG=bp:audit:* ./bp -p 2>> ./botpress.log
```

> **Tip**: You can combine this with a log rotation tool such as [newsyslog](https://www.real-world-systems.com/docs/newsyslog.1.html) or [logrotate](https://linux.die.net/man/8/logrotate).

## Enable/Disable modules
When you start Botpress for the first time, it will add the most popular modules included with the binary to your `botpress.config.json` file. If you want to disable or enable modules, you may either do so on the admin page or edit the `modules` property in `botpress.config.json`.

![Admin Modules Page](assets/admin_modules.png)

Should you choose the latter, note that the special string `MODULE_ROOT` is replaced when your configuration file is read. It represents the modules folder's location on your hard drive; therefore, you shouldn't have to change it.

```js
{
  ..."modules": [
    {// When you add new modules, you need to set their location and if they are enabled or not.
      "location": "MODULES_ROOT/analytics",
      "enabled": true // You can change this to false to disable the module.
    },
    {
      "location": "MODULES_ROOT/basic-skills",
      "enabled": true
    }
}
```

## Individual Chatbot Configuration
Every chatbot that you create will have its configuration file. This file is in the directory `data/bots/BOT_ID/bot.config.json`. You can edit most of the available options by clicking on the `Config` link next to the chatbot name on the administration panel or accessing the chatbot studio's configuration panel.

## Module Configuration
When you enable a module on Botpress, it is available globally, which means that you can't disable or enable it for a specific bot. However, you can configure every chatbot differently.

Each module has a different configuration, so when you run a module for the first time, Botpress will create the default configuration in `data/global/config/MODULE_NAME.json`. If you need a unique configuration for your bot, you can right-click any global configuration from the Code Editor, then **duplicate to the current bot**.

Alternatively, you can manually create a `config` folder in the chatbot folder, copy the configuration file in it: `data/bots/BOT_ID/config/MODULE_NAME.json`.

## Environment Variables
The configuration file found in `data/global/botpress.config.json` can set most of these variables. Infrastructure configuration (like the database, cluster mode, etc.) isn't available in the configuration file since it is required before the config is loaded.

Botpress supports `.env` files, so you don't have to set environment variables every time you start the app. Save the file in the same folder as the executable.

### Common

| Environment Variable     | Description                                                                         | Default          |
| --------------------     | ----------------------------------------------------------------------------------- | ---------------- |
| PORT                     | Sets the port that Botpress will listen to                                          | 3000             |
| BP_HOST                  | The host to check for incoming connections                                          | localhost        |
| EXTERNAL_URL             | This is the external URL that users type in the address bar to talk with the bot.   | http://HOST:PORT |
| DATABASE_URL             | Full connection string to connect to the DB. For Postgres, start with `postgres://` | -                |
| BP_PRODUCTION            | Sets Botpress in production mode, which has the same effect as starting it with `-p`| false            |
| BPFS_STORAGE             | Storage destination used by BPFS to read and write files (global and bots)          | disk             |
| BP_CONFIG_PRO_ENABLED    | Enables the pro version of Botpress, the license key will be required               | false            |
| BP_CONFIG_PRO_LICENSEKEY | Your license key (can also be specified in `botpress.config.json`)                  | -                |
| CLUSTER_ENABLED          | Enables multi-node support using Redis                                              | false            |
| REDIS_URL                | The connection string to connect to your Redis instance                             | -                |
| AUTO_MIGRATE             | Automatically migrates bots up to the running Botpress version                      | -                | 
| DEBUG                    | Namespaces to [debug](#advanced-logging)                                            | -                |

### Runtime and Modules

| Environment Variable      | Description                                                                                 | Default |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------- |
| VERBOSITY_LEVEL           | Botpress will be more chatty when processing requests which have the same effect as `-v`    |         |
| BP_DECISION_MIN_CONFIENCE | Sets the minimum threshold required for the Decision Engine to elect a suggestion           | 0.3     |
| FAST_TEXT_VERBOSITY       | Define the level of verbosity that FastText will use when training models                   | 0       |
| FAST_TEXT_CLEANUP_MS      | The model will be kept in memory until it receives no messages to process for that duration | 60000   |
| REVERSE_PROXY             | When enabled, it uses "x-forwarded-for" to fetch the user IP instead of remoteAddress       | false   |

It is also possible to use environment variables to override module configuration. The pattern is `BP_MODULE_%MODULE_NAME%_%OPTION_PATH%`, all in the upper case. For example, to define the `languageSources` option of the module `nlu`, you would use `BP_MODULE_NLU_LANGUAGESOURCES`. 

> **Tip**: You can list the available environment variables for each module by enabling the `DEBUG=bp:configuration:modules:*` flag.

### Security

You can use these variables to disable some sensitive features destined to Super Admins.

| Environment Variable            | Description                                                                                                                                        | Default |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| BP_CODE_EDITOR_DISABLE_ADVANCED | The advanced editor, lacks some safeguard and is only intended for experienced users. It can be disabled completely using this environment variable | false   |
| BP_CODE_EDITOR_DISABLE_UPLOAD   | Prevent users from uploading files when using the advanced editor                                                                                  | false   |
| BP_DISABLE_SERVER_CONFIG        | Prevent Super Admins from accessing the "Production Checklist" page on the Admin panel, since it may contain sensitive information                | false   |

## NGINX_Config
We recommend the configuration below when deploying Botpress in production.

```bash
http {
  # Disable sending the server identification
  server_tokens off;

  # Prevent displaying Botpress in an iframe (clickjacking protection)
  add_header X-Frame-Options SAMEORIGIN;

  # Prevent browsers from detecting the mimetype if not sent by the server.
  add_header X-Content-Type-Options nosniff;

  # Force enable the XSS filter for the website, in case it was disabled manually
  add_header X-XSS-Protection "1; mode=block";

  # Configure the cache for static assets
  proxy_cache_path /sr/nginx_cache levels=1:2 keys_zone=my_cache:10m max_size=10g
                inactive=60m use_temp_path=off;

  # Set the max file size for uploads (make sure it is larger than the configured media size in botpress.config.json)
  client_max_body_size 10M;

  # Configure access
  log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

  access_log  logs/access.log  main;
  error_log  logs/error.log;

  # Redirect unsecure requests to the HTTPS endpoint
  server {
    listen 80 default;
    server_name  localhost;

    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 http2 ssl;
    server_name localhost;

    ssl_certificate      cert.pem;
    ssl_certificate_key  cert.key;

    # Force the use of secure protocols only
    ssl_prefer_server_ciphers on;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

    # Enable session cache for added performances
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Added security with HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload";

    # Enable caching of assets by NGINX to reduce load on the server
    location ~ .*/assets/.* {
      proxy_cache my_cache;
      proxy_ignore_headers Cache-Control;
      proxy_hide_header Cache-Control;
      proxy_hide_header Pragma;
      proxy_pass http://localhost:3000;
      proxy_cache_valid any 30m;
      proxy_set_header Cache-Control max-age=30;
      add_header Cache-Control max-age=30;
    }

    # We need to add specific headers so the websockets can be set up through the reverse proxy
    location /socket.io/ {
      proxy_pass http://localhost:3000/socket.io/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
    }

    # All other requests should be directed to the server
    location / {
      proxy_pass http://localhost:3000;
    }
  }
}
```

## More Information
- Check out the [database](../infrastructure/database) page for details about `DATABASE_URL`
- Check out the [cluster](../infrastructure/cluster) page for details about `CLUSTER_ENABLED` and `REDIS_URL`
