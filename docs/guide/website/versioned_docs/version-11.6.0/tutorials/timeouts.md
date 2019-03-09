---
id: version-11.6.0-timeouts
title: Timeouts
original_id: timeouts
---

Occasionally a user may leave a conversation with your bot part way through the interaction, leaving it in an unwanted state.

This could lead to the bot trying to answer the wrong question when the user returns to the conversation at a later time, which is a bad user experience.

To prevent this Botpress has the ability to set the time-to-live on a session and how often these should be checked. You will find the following options in `data/global/botpress.config.json`.

```js
dialogs: {
  timeoutInterval: '2m', // How much time should pass before session is considered stale
  janitorInterval: '10s' // How often do we check for stale sessions
},
```

This means that if you started a conversation and then didn't respond for 2 minutes, the bot would set your session as expired.
When you then resume the conversation, the bot will start from the beginning.

## Receiving an event when a user timeout

There is a [hook](/docs/build/code#hooks) that is called before the user's session timeouts.

## Performing actions on timeout

When a user's conversation session expires, you are able to trigger an action by specifying the node's name or by having a dedicated timeout flow.

There are 4 ways to handle this. The bot will invoke the first handler set, based on the order below:

1. Using the `timeoutNode` key on a node.

```js
{
  "version": "0.1",
  ...
  "nodes": [
    {
      ...
      "timeoutNode": "<target-node-name>",
    }
  ]
}
```

2. Using the `timeoutNode` key on the flow

```js
{
  "version": "0.1",
  "timeoutNode": "<target-node-name>",
  ...
}
```

3. By adding a node called `timeout` within a flow

```js
{
  "version": "0.1",
  "timeoutNode": "<target-node-name>",
  "startNode": "entry",
  "nodes": [
    ...
    {
      "id": "d29fc6b771",
      "name": "timeout",
      "next": [],
      "onEnter": [],
      "onReceive": []
    },
  ]
}
```

4. Having a dedicated timeout flow file called `timeout.flow.json`
