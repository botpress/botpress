---
id: debugger
title: Debugger
---

--------------------

Botpress uses the [debug](https://www.npmjs.com/package/debug) package to log information about dialogs, hooks, middleware, NLU, and others.

To see all the logs, set:
- In source code: `DEBUG=bp:* yarn start`
- In the binary: `DEBUG=bp:* ./bp`

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

## Available Namespaces

:::note
This feature is experimental and is subject to change
:::

Go to `<your_url>/admin/debug` to see a complete list of the available namespaces. The **super-admin role is required** to access this page.
You can also enable or disable them from this screen:

![Debugging](/assets/debugging.png)
