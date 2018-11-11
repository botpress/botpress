---
id: hooks
title: Hooks
---

Hooks are very useful to execute actions when specific events occurs.

They are defined globally as javascript files in the folder `data/global/hooks/${hookName}`. You can add as many files as you'd like in those, they will be processed sequentially, in alphabetical order.

> Note: subfolders are allowed, but they are ignored in the ordering. If you have `02_hook.js` and `03/01_hook.js`, the order will be `01_hook.js` then `02_hook.js`

They all have access to the Botpress SDK (`bp`).

## Virtual Machine

Every hook is executed in a separate virtual machine to prevent server crashes if there is a scripting error. Your scripts may require any module that is loaded by botpress by default (for example: lodash, axios, moment, nanoid, and [much more](https://github.com/botpress/botpress/blob/master/package.json)).

If you want to include anything else, there are two possible ways. You can add the `node_modules` folder containing your dependency or you can [create a module](../modules/hooks) that includes your dependency.

To help you vizualize how it works, check the snippet below.

```js
/** const virtual_machine = async (bp: SDK) => { *//

  //Your code goes here. Example:
  const _ = require('lodash')
  if (event.type === 'text') {
    const id = await bp.dialog.createId(event)
    //...
  }

/** } *//
```

It is also possible to wrap your code with an async method:

```js
const virtual_machine = async (bp: SDK) => {
  //Your code goes here. Example:
  const myMethod = async () => {
    console.log('Hello!')
  }

  return myMethod()
}
```

## After Server Starts

This event is called once all modules and bots are loaded and the bot is ready to accept incoming connections.

Location: `data/global/hooks/after_server_start`

Parameters: `bp`

## After Bot Mount

This event is called everytime a bot is mounted, be it when the server is starting up or when new bots are added at runtime.

Location: `data/global/hooks/after_bot_mount`

Parameters: `bp`, `botId`

## After Bot Unmount

This event is called everytime a bot is unmounted. This is usually to do cleanup when a bot is deleted.

Location: `data/global/hooks/after_bot_unmount`

Parameters: `bp`, `botId`

## Before Incoming Middleware

This hook is called when an event is received, before any middleware. It is possible to change event properties.

Location: `data/global/hooks/before_incoming_middleware`

Parameters: `bp`, `event`

This hook is often used to set flags to skip some processing, for example QNA:

```js
if (event.type === 'quick_reply') {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING, true)
}
```

## After Incoming Middleware

This hook is called right after all incoming middlewares processed the event, but before the Dialog Engine starts processing it. This means that you have access to all the required data (including NLU intent) to make special processing, and decide what happens to the event.

Location: `data/global/hooks/after_incoming_middleware`

Parameters: `bp`, `event`

A common operation here is to tell Botpress to ignore the event and not process it (eg: not sending it to the dialog engine).
Here is an example:

```js
const messageTypesToDiscard = ['session_reset', 'typing', 'visit']

if (messageTypesToDiscard.includes(event.type)) {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
}
```

## Before Session Timeout

This hook is called right before a user timeouts on a node.

Location: `data/global/hooks/before_session_timeout`

Parameters: `bp`, `event`
