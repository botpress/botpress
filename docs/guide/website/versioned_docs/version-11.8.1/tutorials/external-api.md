---
id: version-11.8.1-external-api
title: Calling an API in a Custom Action
original_id: external-api
---

One of the most popular use-case for Actions is to call an API, get some data and use it in your flow. That's what we're going to demonstrate here.

We're going to use `axios` as http client because its already a Botpress dependency. See our [Custom Code](../main/code/) section to learn more about how dependencies work in Actions.

Start by creating a new javascript file in `/data/bots/<your_bot>/actions/getQuote.js`. Then copy the following code:

```javascript
const axios = require('axios')

const getQuote = async () => {
  // We declare a new axios instance
  const client = axios.create({
    baseURL: 'https://opinionated-quotes-api.gigalixirapp.com/v1'
  })

  // And we get a new quote
  const quote = await client.get('/quotes').then(res => res.data.quotes[0].quote)
}

// Actions are async, so make sure to return a Promise
return getQuote()
```

## Bot Reply

Let's make the bot reply with the quote:

```javascript
const eventDestination = {
  channel: event.channel,
  target: event.target,
  botId: event.botId,
  threadId: event.threadId
}

const payloads = await bp.cms.renderElement('builtin_text', { text: quote, typing: true }, eventDestination)

await bp.events.replyToEvent(event, payloads)
```

## Memory

In the end, calling an API in an Action works as it would in any other javascript project. The real difference is how you want to handle the data afterwards. So we just made the bot reply, but what if we wanted to return that data and use it later on in the flow?

We're gonna use [Temp Memory](../main/memory/#temporary-memory) to store the data instead.

```javascript
// Assigns the quote to the temporary memory
temp.quote = quote
```

And then use the temp memory in another node:

![Get Quote Flow](assets/get-quote.png)
