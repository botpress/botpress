---
id: version-11.8.1-memory
title: Memory
original_id: memory
---

In the course of a conversation, you may want to ask questions to the user, and remember his answer to use it later. There are four different kind of memories in Botpress; the difference between each of them is the duration and the scope.

- `user` memory is kept forever for the user it is associated with.
- `session` memory is kept for the duration of the configured session (more on that below).
- `temp` memory is only kept for the duration of the flow.
- `bot` memory is the same value for all users of a same bot.

## Common Use Case

Most of the time, you will rely on the `user` and `temp` type of memory. The temp memory is only alive for the duration of a flow,

## Dialog Memory

The Dialog Memory is how your bot will remember things in the context of a conversation. The way you can store and retrieve data is by using Actions inside the flows. There are four types of memory available: **user**, **session**, **temp** and **bot**

You can consume a memory action just like any other action from the Botpress Flow Editor.

##### Memory Action Example

![Flow Memory Action](assets/flow-memory-action.png)

### User Memory

Variables set using the `user` namespace will be saved as attributes for the user. This means that those attributes will always follow the user, not notwithstanding conversations or time period.

When a user sends a message to the bot, the first middleware is tasked with loading that user's informations. After everything is processed, any changes to the `user` object will be persisted to the database.

This means that you can alter the `user` object using middlwares and actions, and it will be saved at the end.

#### User Memory - Data Retention

Since privacy is an important matter, there is a built-in system that makes it dead-easy to set retention periods for different type of informations. You could have, for example a policy that says `email expires after 2 months` or `remember user's mood for 1 day`. Whenever the user's attribute is changed, the expiration policy is updated.

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

The `session` store is alive for the duration of the user's session. How long is that? Well, it depends on the setting of `sessionIntervalTimeout` in `botpress.config.json`.

This is also where we keep the last messages sent by the user. This information is used by the Decision Engine to better understand the user's will and to avoid repeating meaningless stuff.

### Temporary Memory

The `temp` memory is the most heavily type of memory used on Botpress. To keep it simple, this memory is kept since the beginning of flow until the end. As long as nodes are linked together, it will be available. If you were a user of Botpress 10.x, this was better known as the `state` of the dialog.

Common use case implies calling an action, saving the result in the `temp` memory, then send a content element including the answer to the user.

For example, you want to list the name of your servers, which should be fetched from an API.

This would be your action, fetch_servers.js:

```js
const listServers = async () => {
  try {
    const { data } = await axios.get(`https://mysite.com/servers`)
    temp.servers = data.servers.join(', ')
  } catch (error) {}
}

return listServers()
```

That action would fetch the name of your the servers, then you could send a content element similar to this:

`Here's the list of our servers: {{temp.servers}}`

As you can see, it's very easy to use !

### Bot Memory

The `bot` memory is the same value for all users of the bot. Think of it like a global variable, but scoped to this bot only.

## How to change what's in the memory?

There are two different ways to edit these 4 different types of data. The most simple way is to use the action `base.setVariable`. You only have to specify the type of memory, the name of the variable, and what value it should be set to.

Another common use is using actions. Actions allows you to edit these variables directly. For example, you could write `user.firstname = 'potato'` in your code file to update the user's name.

Please check out the [Custom Code](./code#actions) section for more details about this.

## General Storage

What if the four previous types of storage doesn't fulfill my requirements? Don't worry, we still have other options!

The Key-Value Store is a general-purpose store which allows you to store any type of data. You will need to manage expirations and data update yourself, sice Botpress will not update these values on its own.

The KVS is available from the [Botpress SDK](https://botpress.io/reference/modules/_botpress_sdk_.kvs.html)
