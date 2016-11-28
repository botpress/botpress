## Introduction to Middlewares

Middlewares are a critical component of botpress. Simply put, they are functions that process messages. Think of it this way: everything that enter or leave your bot is coming in (or out) from middlewares.

If you have used [Express](TODO) before, botpress middlewares are very similar to express's middlewares.

Botpress has two middleware chains: [incoming](TODO) and [outgoing](TODO)

**To receive messages**: An installed module must pipe messages into the [incoming middleware chain](TODO)

**To send messages**: You (or a module) must pipe messages into the [outgoing middleware chain](TODO) and have a module able to send it to the right platform

### Example

**Incoming**: [botpress-messenger](TODO) connects to Facebook and receives messages from its built-in Webhook. It then pipes messages into the incoming middleware, which your bot can process.

**Outgoing**: [botpress-messenger](TODO) listens (through a middleware function) for messages it can process on the outgoing middleware and sends them to Facebook through the Messenger Send API.

## Middleware Chain

A middleware chain is simply a collection of middlewares that are called in a [predertermined order](TODO). Each middleware in the chain has the freedom to:
- execute arbitrary code
- mutate the event
- call the next middleware
- interupting the chain by never calling the next middleware (what we call swallowing the event)
- interrupting the chain by throwing an error

## A simple middleware

A middleware is simply a function that takes an event as the first parameter and a `next` function as the second parameter.

Here's an example of the 5 possible cases:

```js
var middleware = function(event, next) {
    // chain interruption (error)
    if (internetDisconnected()) 
        return next(new Error('Not connected'))
    
    if (isUserBanned(event.user.id))
        return // swallow the event

    // arbitraty code execution
    var translation = Translator.translate(event.text)

    // event mutation
    event.text = translation
    
    // call next middleware
    next()
}
```

The return value of the middleware can be anything or nothing, it isn't used.

## Registering middlewares

You need to register a middleware for botpress to know about it and use it. You may do so with the [`bp.registerMiddleware`](TODO) method:

```js
// ** code taken from botpress-messenger **
bp.registerMiddleware({
    name: 'messenger.sendMessages',
    type: 'outgoing',
    order: 100,
    handler: outgoingMiddleware,
    module: 'botpress-messenger',
    description: 'Sends out messages that targets platform = '
    + 'messenger. This middleware should be placed at the end as it swallows events once sent.'
})
```


## Full Messages Lifecycle Example

Imagine you have a travel bot that is available on Facebook Messenger and Slack and that can handle many languages.

Your bot's installed modules would probably look a bit like:
- [botpress-messenger](TODO) for I/O with Facebook Messenger
- [botpress-slack](TODO) for I/O with Slack
- [botpress-analytics](TODO) to have an overview of how people use your bot
- botpress-translate _(fictive)_ to translate incoming and outgoing messages
- ~/my-bot/private\_modules/botpress-travel _(fictive)_ your bot's travel logic goes here

Now lets look at how a complete interaction might be handled by your bot.

1. A user types a message in French to your bot in Facebook Messenger
2. Facebook pushes the message to your bot via the built-in botpress-messenger's Webhook
3. botpress-messenger retrieves user information and stores them in the built-in database
4. botpress-messenger parses the message and **calls the first incoming middleware** _(botpress-analytics)_
5. botpress-analytics tracks the message then **calls the next middleware** in the chain _(botpress-translate)_
6. botpress-translate translates the message from French to English (by mutating it) then calls the next middleware in the chain _(botpress-travel)_
7. botpress-travel processes the message and responds by calling the `bp.messenger.pipeText` method
8. botpress-messenger takes the response and **calls the outgoing middlewares chain**
9. botpress-translate translates the message from English to French (by mutating it) then calls the next middleware in the outgoing chain _(botpress-analytics)_
10. botpress-analytics tracks the message then calls the next middleware _(botpress-messenger)_
11. botpress-messenger sends the message to Facebook Messenger through the Send API

All of this happens behind the scene and is handled by the modules middlewares. As a bot developer, all you have to worry about is writing the bot's logic.

## Ordering middlewares

TODO

## Error handling

TODO