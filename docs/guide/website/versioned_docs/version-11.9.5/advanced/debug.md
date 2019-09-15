---
id: version-11.9.5-debug
title: Debug
original_id: debug
---

## How To Use

Botpress uses the [debug](https://www.npmjs.com/package/debug) package to log information about dialogs, hooks, middleware, nlu and others.

To see all the logs, set `DEBUG=bp:* yarn start` if you're in development or `DEBUG=bp:* ./bp` if you're executing the binary.

You can set multiple namespaces by separating them by a comma:

```shell
# On Linux / Mac
DEBUG=bp:nlu:*,bp:dialog:* yarn start

# On Windows
set DEBUG=bp:nlu*,bp:dialog:*&& yarn start
```

## Setting Default Namespaces

You can add `DEBUG` to your `.env` file located in your root folder to set default namespaces.

```shell
DEBUG=bp:dialog:*,bp:nlu:intents:*
```

## Available namespaces 🔬

> This feature is experimental and is subject to change

Go to `<your_url>/admin/debug` to see a complete list of the available namespaces. The **super-admin role is required** to access this page.

You can also enable or disable them from this screen:

![Debugging](assets/debugging.png)
