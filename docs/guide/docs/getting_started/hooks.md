---
id: hooks
title: Hooks
---

Hooks are very useful to execute actions when specific events occurs.

They are defined globally as javascript files in the folder `data/global/hooks/${hookName}`. You can add as many files as you'd like in those, they will be processed sequentially, in alphabetical order

Hooks always have access to the Botpress server (`bp`) and may have additional parameters.

## After bot starts

This event is called once all modules are loaded and the bot is ready to accept incoming connections.

Location: `data/global/hooks/after_bot_start`

Parameters: `bp`

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
