---
id: session-memory
title: Session Memory
---

--------------------

## Dialog Memory

The Dialog Memory is how your chatbot remembers things in the context of a conversation. The way you can store and retrieve data is by using actions inside the flows. There are four types of memory available: **user**, **session**, **temp** and **bot**. The value of type in the **Set Variable** user interface must be set to one of these four types.

You can consume a memory action just like any other action from the Botpress Flow Editor.

**Example:**

![Flow Memory Action](/assets/flow-memory-action.png)

## Temporary Memory 

The `temp` memory is the most frequently used type of memory in Botpress. This memory is kept from the beginning of flow until the end. As long as nodes are linked together, `temp` memory will be available.

:::note
If you were a user of Botpress 10.x, this was better known as the `state` of the dialog.
:::

Typical use cases include calling an action, saving the result in the `temp` memory, and send a content element including the answer to the user.

:::note Example
You want to list the name of your servers, which your chatbot should fetch from an API.

This would be your action, `fetch_servers.js`:

```js
const listServers = async () => {
  try {
    const { data } = await axios.get(`https://mysite.com/servers`)
    temp.servers = data.servers.join(', ')
  } catch (error) {}
}

return listServers()
```

That action would fetch the name of your servers; then you could send a content element similar to this:

`Here's the list of our servers: {{temp.servers}}`
:::