# Chat Client

## Installation

```bash
npm install @botpress/chat # for npm
yarn add @botpress/chat # for yarn
pnpm add @botpress/chat # for pnpm
```

## Usage

### API Queries

The `@botpress/chat` package exports a `Client` class that can be used to interact with the Botpress Chat API.

```ts
import _ from 'lodash'
import * as chat from '@botpress/chat'

const main = async () => {
  /**
   * You can find your webhook id in the the Botpress Dashboard.
   * Navigate to your bot's Chat Integration configuration. Look for:
   * https://webhook.botpress.cloud/$YOUR_WEBHOOK_ID
   */
  const webhookId = process.env.WEBHOOK_ID
  if (!webhookId) {
    throw new Error('WEBHOOK_ID is required')
  }

  // 0. connect and create a user
  const client = await chat.Client.connect({ webhookId })

  // 1. create a conversation
  const { conversation } = await client.createConversation({})

  // 2. send a message
  await client.createMessage({
    conversationId: conversation.id,
    payload: {
      type: 'text',
      text: 'hello world',
    },
  })

  // 3. sleep for a bit
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // 4. list messages
  const { messages } = await client
    .listMessages({
      conversationId: conversation.id,
    })
    .then(({ messages }) => ({
      messages: _.sortBy(messages, (m) => new Date(m.createdAt).getTime()),
    }))

  const botResponse = messages[1]
  console.log("Bot's response:", botResponse.payload)
}

void main()
  .then(() => {
    console.log('done')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
```

### Realtime Events

You can also listen for messages and events in real-time.

```ts
// ...

const listener = await client.listenConversation({
  id: conversation.id,
})

const botResponse = await new Promise<chat.Message>((resolve) => {
  const onMessage = (ev: chat.Signals['message_created']) => {
    if (ev.userId === client.user.id) {
      // message created by my current user, ignoring...
      return
    }
    listener.off('message_created', onMessage)
    resolve(ev)
  }
  listener.on('message_created', onMessage)
})

console.log("Bot's response:", botResponse.payload)
```

### Reconnection

The `Client` class does not automatically reconnect to the server if the connection is lost. This allow's you to handle reconnection in a way that makes sense for your application. To be notified when the connection is lost, you can listen for the `error` event:

```ts
const state = { messages } // your application state

const onDisconnection = async () => {
  try {
    await listener.connect()
    const { messages } = await client.listMessages({ conversationId: conversation.id })
    state.messages = messages
  } catch (thrown) {
    console.error('failed to reconnect, retrying...', thrown)
    setTimeout(onDisconnection, 1000) // consider using a backoff strategy
  }
}

listener.on('error', (err) => {
  console.error('connection lost', err)
  void onDisconnection()
})
```
