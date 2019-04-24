---
id: code
title: Actions & Hooks
---

There are two ways of easily adding custom code to enrich your bot's experience: **Actions** and **Hooks**.

Both are executed in a virtual machine to prevent server crash if there is a scripting error. Your scripts may require any module that is loaded by botpress by default (for example: lodash, axios, moment, nanoid, and [much more](https://github.com/botpress/botpress/blob/master/package.json)).

If you want to include other dependency not already included, there are two possible ways. You can add the `node_modules` folder containing your dependency in the same folder as your action, or you can [create a module](../advanced/create-module) that includes your dependency.

To help you vizualize how it works, check the snippet below. We've commented out the portion of the code that is "hidden", since all you need to include in your `.js` files is your actual code.

```js
/** const virtual_machine = (bp: SDK) => { *//

    //The content of your .js file starts here. Example:
    const _ = require('lodash')
    if (event.type === 'text') {
      const text = _.get(event, 'text')
      console.log(text)
      //...
    }
    //End of your file

/** } */
```

It is also possible to wrap your code with an async method:

```js
/** const virtual_machine = async (bp: SDK) => { *//

    //The content of your .js file starts here. Example:
    const myMethod = async () => {
      await axios.get('...')
      console.log('Hello!')
    }

    return myMethod()
    //End of your file

/** } */
```

> Hot Reloading is enabled for these scripts, which means that whenever you edit it, changes are picked up on the next function call, which makes development a lot faster.

## Disabling a file

Files starting with a dot (`.`) will be ignored by Botpress. This way, you can disable a hook or action simply by prefixing the name of the file with a dot.

## Actions

Actions are essentially server-side functions that get executed by the bot as part of a conversational flow. Actions have the power to do many things:

- Alter the state of the conversation
- Send customized messages to the conversation
- Execute arbitrary code like calling an API or storing data in the database

Since they are just regular JavaScript functions, they can, in fact, do pretty much anything.

When an action is invoked by the Dialogue Manager (DM), it gets passed the following arguments:

- `user`: Includes all attributes of a user.
- `session`: Includes variables kept for the session's duration.
- `temp`: Contains variables which are alive only for the duration of the flow.
- `bot`: Object containing global variables for this bot (same for all users)
- `event`: The original (latest) event received from the user in the conversation.
- `args`: The arguments that were passed to this action from the Visual Flow Builder.
- `process`: sandboxed vm containing some of the env-variables (starting with `EXPOSED_`)

Check out the page [Bot Memory and Data Retention](./memory) for more details about the lifetime of these objects.

### Example

Here are some possible ways to use these variables

```js
/** const virtual_machine = (bp: SDK, user, session, temp, bot, event, args) => { */
user['firstname'] = 'Bob'
user['age'] = 17

temp = {
  text: 'hello there'
}

session.store = [{ id: 1, id: 2, id: 3 }]
/** } */
```

### Registering new actions

The only way to register new actions is to add your javascript code in a `.js` file and put them in the folder `data/global/actions`. There is no way to programmatically add new ones during runtime.

There are already a [couple of actions](https://github.com/botpress/botpress/tree/master/modules/builtin/src/actions) that you can use to get some inspiration. We use JavaDoc comments to display meaningful informations (name, description, arguments, default values) on the dialog flow editor. It is possible to keep an action hidden in the flow editor by adding the flag `@hidden true` in the javadoc.

## Hooks

Hooks are very useful to execute actions when specific events occurs.

They are defined globally as javascript files in the folder `data/global/hooks/${hookName}`. You can add as many files as you'd like in those, they will be processed sequentially, in alphabetical order.

> Note: subfolders are allowed, but they are ignored in the ordering. If you have 02_hook.js and 03/01_hook.js, the order will be 01_hook.js then 02_hook.js

They all have access to the (Botpress SDK) [https://botpress.io/reference/](https://botpress.io/reference/).

### After Server Starts

This event is called once all modules and bots are loaded and the bot is ready to accept incoming connections.

Location: `data/global/hooks/after_server_start`

Parameters: `bp`

### After Bot Mount

This event is called everytime a bot is mounted, be it when the server is starting up or when new bots are added at runtime.

Location: `data/global/hooks/after_bot_mount`

Parameters: `bp`, `botId`

### After Bot Unmount

This event is called everytime a bot is unmounted. This is usually to do cleanup when a bot is deleted.

Location: `data/global/hooks/after_bot_unmount`

Parameters: `bp`, `botId`

### Before Incoming Middleware

This hook is called when an event is received, before any middleware. It is possible to change event properties.

Location: `data/global/hooks/before_incoming_middleware`

Parameters: `bp`, `event`

This hook is often used to set flags to skip some processing, for example to prevent the module QNA from processing it when it's a quick reply:

```js
if (event.type === 'quick_reply') {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING, true)
}
```

### After Incoming Middleware

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

### Before Outgoing Middleware

This hook is called before the bot replies are sent to the user

Location: `data/global/hooks/before_outgoing_middleware`

Parameters: `bp`, `event`

Here you can save the bot's complete response

### Before Session Timeout

This hook is called right before a user timeouts on a node.

Location: `data/global/hooks/before_session_timeout`

Parameters: `bp`, `event`

### Before Suggestions Election

This hook is called after the Decision Engine Ranking, but before the Suggestion Election. This allows you to override the ranking of the Decision Engine by altering the `event.suggestions` array directly.

Location: `data/global/hooks/before_suggestions_election`

Parameters: `bp`, `event`, `suggestions`, `sessionId`

A common operation here is to add a new (elected) suggestion when there is no elected winner.
