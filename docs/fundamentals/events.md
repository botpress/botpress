# Events

{% hint style='tldr' %}
**TLDR:** You can listen for incoming messages using the [`bp.hear`](#hear) middleware helper. You can reply to messages using the `event.reply` [UMM](./umm.md) feature.
{% endhint %}

## Receiving Messages (Incoming) {#receive}

Your bot will receive events as soon as it is connected to a chat platform (you need to setup a Connector Module for the platform you want) and a user speaks to it. Incoming messages all go through what we call the **Incoming Middleware Chain**. 

> **Info**: [Middleware Chains](../advanced/middleware.md) are an advanced concept that you likely don't need to know about right now; all you need to know is that modules execute some kind of processing on the incoming message that they can do all sort of things like translating the messages to different languages, tagging the message with NLP entities or even stop the message from being processed by your bot.

There exists a special built-in middleware that allows your bot to listen for messages based on certain conditions. It is the [`hear`](#hear) middleware.

### The Hear Middleware {#hear}

#### `bp.hear(condition, handler) -> void`

Utility function to easily register incoming middlewares. 

The condition can be a string, a regex or an object. In case of an object, all conditions must match for the handler to be called.

The handler takes the MiddlewareEvent as the first argument and takes the `next` middleware caller as the second argument. If the `next` argument is not specified in your handler, botpress assumes you wanted to call it and calls it at the end of the synchronous execution of the handler.

> **Note:** While in theory a bot could be built entirely with the `hear` middleware alone, **it is not very convenient for handling complex conversations**. `hear` should in general be used for catching high-level actions like menu button clicks. You should use [`bp.convo`](./flow.md) for handling complex conversations.

#### Examples (string)

```js
bp.hear('hello', (event, next) => {
  // swallow the event by never calling next()
})
```

#### Examples (regex)

```js
bp.hear(/^hello$/i, event => {
  // next not specified so will be called automatically
})
```

#### Examples (object)

```js
bp.hear({
  text: 'hello', // simple condition
  'user.first_name': /watson$/i, // checking a deep property in object
  'raw.phone.number': value => !Number.isNaN(value), // matcher function
  platform: 'sms'
}, event => {
  // all the conditions matched
})
```

---

## Sending Messages (Outgoing) {#send}

The act of sending a message is called **Outgoing**. There are two ways to send messages: in reaction to an incoming message ([Reactive Outgoing](#reactive)) or at any other time ([Proactive Outgoing](#proactive)).

### Reactive Outgoing {#reactive}

The easiest way to reply to an incoming message is by calling the `reply` method on the incoming `event` itself. The first argument of the `reply` function is the name of a [UMM bloc](../reference/umm.md#bloc), which we will cover a bit later in this guide.

##### Example

```js
bp.hear(/^hello$/i, (event, next) => {
  event.reply('#welcome')
})
```

```js
bp.hear(/^my order$/i, (event, next) => {
  event.reply('#orderSummary', { // You can pass arbitrary data to UMM
    orderId: 12463,
    item: 'Nike Shoes',
    price: '$156'
  })
})
```

### Proactive Outgoing {#proactive}

This section is coming soon
