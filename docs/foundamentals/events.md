---
layout: guide
---

**TLDR:** You can listen for incoming messages using the `bp.hear` helper. You can reply to messages using the `event.reply` [UMM](/docs/foundamentals/umm) feature.

## Receiving Messages (Incoming) <a class="toc" id="toc-receiving-messages-incoming" href="#toc-receiving-messages-incoming"></a>

Your bot will receive events as soon as it is connected to a chat platform (you need to setup a Connector Module for the platform you want) and a user speaks to it. Incoming messages all go through what we call the **Incoming Middleware Chain**.

> **Info**: [Middleware Chains](/docs/advanced/middleware) are an advanced concept that you likely don't need to know about right now; all you need to know is that modules execute some kind of processing on the incoming message that they can do all sort of things like translating the messages to different languages, tagging the message with NLP entities or even stop the message from being processed by your bot.

There exists a special built-in middleware that allows your bot to listen for messages based on certain conditions. It is the `hear` middleware.

### The Hear Middleware <a class="toc" id="toc-the-hear-middleware" href="#toc-the-hear-middleware"></a>


#### `bp.hear(condition, handler) -> void` <a class="toc" id="toc-bp-hear-condition-handler-void" href="#toc-bp-hear-condition-handler-void"></a>

Utility function to easily register incoming middlewares.

The condition can be a string, a regex, an object or an array of these. In case of an object, all conditions must match for the handler to be called. In case of an array, it acts as an OR meaning the first condition to match will cause the handler to be called.

The handler takes the MiddlewareEvent as the first argument and takes the `next` middleware caller as the second argument. If the `next` argument is not specified in your handler, botpress assumes you wanted to call it and calls it at the end of the synchronous execution of the handler.

> **Note:** While in theory a bot could be built entirely with the `hear` middleware alone, **it is not very convenient for handling complex conversations**. `hear` should in general be used for catching high-level actions like menu button clicks. You should use [`bp.convo`](/docs/foundamentals/flow) for handling complex conversations.

#### Examples (string) <a class="toc" id="toc-examples-string" href="#toc-examples-string"></a>


```js
bp.hear('hello', (event, next) => {
  // swallow the event by never calling next()
})
```

#### Examples (regex) <a class="toc" id="toc-examples-regex" href="#toc-examples-regex"></a>


```js
bp.hear(/^hello$/i, event => {
  // next not specified so will be called automatically
})
```

#### Examples (object) <a class="toc" id="toc-examples-object" href="#toc-examples-object"></a>


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

#### Examples (array) <a class="toc" id="toc-examples-array" href="#toc-examples-array"></a>


```js
bp.hear([
    {'nlp.metadata.intentName': 'getting_started'}, // first condition
    {'type': 'postback', 'text': 'getting_started'} // second condition
  ], event => {
    // one of the conditions matched
})
```

#### Examples (function)

```js
bp.hear(event => event.text === 'hello' && !!event.raw.phone.number, event => {
    // predicate condition matched
})
```

---

## Sending Messages (Outgoing) <a class="toc" id="toc-sending-messages-outgoing" href="#toc-sending-messages-outgoing"></a>


The act of sending a message is called **Outgoing**. There are two ways to send messages: in reaction to an incoming message ([Reactive Outgoing](#toc-reactive-outgoing)) or at any other time ([Proactive Outgoing](#toc-proactive-outgoing)).

### Reactive Outgoing <a class="toc" id="toc-reactive-outgoing" href="#toc-reactive-outgoing"></a>


The easiest way to reply to an incoming message is by calling the `reply` method on the incoming `event` itself. The first argument of the `reply` function is the name of a [UMM bloc](/docs/foundamentals/umm), which we will cover a bit later in this guide.

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

### Proactive Outgoing <a class="toc" id="toc-proactive-outgoing" href="#toc-proactive-outgoing"></a>


If you want to send a message at any time and that you don't have easy access to a previous `event` that you can `reply()` to, you might want to consider using the **Proactive Sending** feature of UMM.

#### Sending to a user (platform independent) <a class="toc" id="toc-sending-to-a-user-platform-independent" href="#toc-sending-to-a-user-platform-independent"></a>


Since all users are saved to the database, if you have the **userId** (or the full user object), you can send that user a message and the underlying module will do the job. Usually, a userId looks like so: `facebook:7473118532`, but may differ from platform to platform.

##### Examples

```js
// With the full user object
bp.umm.sendToUser(event.user, '#proactiveBloc')
```

```js
// With just the user id
bp.umm.sendToUser('facebook:7562284991', '#proactiveBloc', { some: 'data' })
```

```js
const Promise = require('bluebird')

// Proactively broadcasts a message to all users
// Don't actually do this. If you need to broadcast a message you should use the broadcast module
// The broadcast module handles failures, retries automatically, logs stuff etc.
bp.db.get().then(knex => knex('users').select('id'))
.then(users => users.map(u => u.id))
.then(userIds => {
  return Promise.mapSeries(userIds, userId => {
    bp.umm.sendToUser(userId, '#proactive')
  })
})
.then(() => bp.logger.info('Done sending to all users'))
```

#### Other way of sending to a channel, group, user, etc.. (platform-specific)

**TODO:** Currently unsupported.
