---
id: hooks
title: Hooks
---

--------------------

Hooks are a handy way to execute JavaScript code (similar to that of actions) when specific events occur.

They are defined globally as JavaScript files in the folder `data/global/hooks/${hookName}`. You can add as many files as you want in this folder; they will be processed sequentially, in alphabetical order.

:::note
Subfolders are allowed but ignored in the ordering.
:::

Hooks have access to the [Botpress SDK](https://botpress.com/reference/).

## Disabling Hooks

Botpress will ignore files starting with a dot (`.`). This way, you can disable a hook or action by prefixing the file's name with a dot.

## Types of Hooks

Hooks are differentiated using the point in the event engine when they are executed. The following are instances where you can inject hooks into your code.

### After Server Starts

This event is called once all modules and bots are loaded and the bot is ready to accept incoming connections.

Location: `data/global/hooks/after_server_start`

Parameters: `bp`

### After Bot Mount

This event is called every time a bot is mounted, be it when the server starts up or when adding new bots at runtime. You can trigger it by going to the settings page of your bot, then setting your bot to "Unmounted", and then back to "Published".
 
Location: `data/global/hooks/after_bot_mount`

Parameters: `bp`, `botId`

### After Bot Unmount

Every time a bot is unmounted, Botpress calls this event to clean up after deleting a bot.

Location: `data/global/hooks/after_bot_unmount`

Parameters: `bp`, `botId`

### Before Incoming Middleware

Botpress calls this hook after receiving an event but before processing any middleware. It is possible to change event properties.

Location: `data/global/hooks/before_incoming_middleware`

Parameters: `bp`, `event`

Botpress often uses this hook to set flags to skip some processing, for example, to prevent the module QNA from processing it when it's a quick reply:

```js
if (event.type === 'quick_reply') {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING, true)
}
```

### After Incoming Middleware

This hook is called right after all incoming middlewares processed the event but before the Dialog Engine starts processing it. You can access all the required data (including NLU intent) for special processing and decide what happens to the event.

Location: `data/global/hooks/after_incoming_middleware`

Parameters: `bp`, `event`

A typical operation here is to tell Botpress to ignore the event and not process it (e.g., not sending it to the dialog engine).

Here is an example:

```js
const messageTypesToDiscard = ['session_reset', 'typing', 'visit', 'session_reference']

if (messageTypesToDiscard.includes(event.type)) {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
}
```

### Before Outgoing Middleware

The Dialogue Manager calls this hook before the bot's reply is sent to the user.

Location: `data/global/hooks/before_outgoing_middleware`

Parameters: `bp`, `event`

Here you can save the bot's complete response.

### Before Session Timeout

This hook is called right before a user timeouts on a node.

Location: `data/global/hooks/before_session_timeout`

Parameters: `bp`, `event`

### Before Conversation End

This hook is called right before a conversation ends.

Location: `data/global/hooks/before_conversation_end`

Parameters: `bp`, `event`

### Before Suggestions Election

This hook is called after the Decision Engine Ranking but before the Suggestion Election. Doing so allows you to override the Decision Engine's ranking by directly altering the `event.suggestions` array.

Location: `data/global/hooks/before_suggestions_election`

Parameters: `bp`, `event`, `suggestions`, `sessionId`

A typical operation here is to add a new (elected) suggestion when there is no elected winner.
