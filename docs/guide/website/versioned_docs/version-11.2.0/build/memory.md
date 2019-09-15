---
id: version-11.2.0-memory
title: Bot Memory and Data Retention
original_id: memory
---

## Dialog Memory

The Dialog Memory is how your bot will remember things in the context of a conversation. The way you can store and retrieve data is by using Actions inside the flows. There are four types of memory available: **user**, **session**, **temp** and **bot**

You can consume a memory action just like any other action from the Botpress Flow Editor.

##### Memory Action Example

![Flow Memory Action](assets/flow-memory-action.png)

### User Memory

Variables stored inside this memory are persisted and remain available for the same user. They survive the different conversations. When a message is received from the user, his informations are automatically loaded and are available to actions and nodes without calling anything,.

They never expires unless there is a data retention policy for some variables.

#### User Memory Data Retention

The botpress global configuration file allows to specify the Time To Live of different user variables. There can be, for example, a policy that says `email expires after 2 months` or `remember user's mood for 1 day`. Expiry is updated whenever data is changed

Here's how it could be configured:

```js
//data/global/botpress.config.json

dataRetention: {
  janitorInterval: '2m', // Check each 2 mins for expired data
  policies: {
    email: '60d', // Keep email for 30 days, reset if it is changed
    mood: '1d' // Forget user's mood after 1 day
    someChoice: '5m' // Keeps the variable alive for 5 minutes
  }
}
```

### Session Memory

Variables stored inside this memory are persisted across the conversation and discarded when the session ends; that is defined by the configuration parameter `sessionIntervalTimeout` (defined by bot in bot.config.json or globally in botpress.config.json)

Botpress also stores the last 5 messages of the user in this variable, which could be useful depending on your use case.

### Temporary Memory

Variables stored inside this memory are alive until the end of the flow or when the dialog engine times out (Configuration: `dialog.intervalTimeout`). This variable replaces the `state` that was previously used before Botpress 11.2

### Bot Memory

Variables stored inside this memory are shared between all users and conversations inside the same bot.

#### Changing the value in memory

Use the action `base.setVariable` to update the value of any scope. There is also the possibility to change directly variables inside actions, check out the [Custom Code](/docs/build/code#actions) section.

## General Storage

If you want to store information differently, or when outside of a flow (e.g. from a [Hook](/docs/build/code#hooks)), you can use the lower-level storage API, the Key-Value-Store (KVS).

The KVS works very similarly to the get/set actions except you have to decide on the storage key yourself. Think of the KVS as an oversimplified NoSQL store where all you need to know to store something is a unique key.

The KVS is available from the [Botpress SDK (**`bp.sdk`**)](https://botpress.io/reference/modules/_botpress_sdk_.kvs.html) and supports expiry as well. In fact, the storage actions are simply wrappers for the KVS.
