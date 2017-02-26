## Understanding the Middlewares

Middleware is a critical component of botpress. Simply put, it is a collection of functions that process messages. Think of it this way: everything that enters or leaves your bot is coming in to (or out of) the middleware.

If you have used [Express](http://expressjs.com/) before, botpress middleware is very similar to express's middleware.

Botpress has two middleware chains: [incoming](creating-your-bot/understading-the-middlewares.md#sendincomingmiddlewareevent---void) and [outgoing](creating-your-bot/understading-the-middlewares.md#sendoutgoingmiddlewareevent---void)

**To receive messages**: An installed module must send messages into the incoming middleware chain

**To send messages**: You (or a module) must send messages into the outgoing middleware chain and have a module able to send it to the right platform

### Example

**Incoming**: [botpress-messenger](https://github.com/botpress/botpress-messenger) connects to Facebook and receives messages from its built-in Webhook. It then sends messages into the incoming middleware, which your bot can process.

**Outgoing**: [botpress-messenger](https://github.com/botpress/botpress-messenger) listens (through a middleware function) for messages it can process on the outgoing middleware and sends them to Facebook through the Messenger Send API.

## Middleware Chain

A middleware chain is simply a collection of middleware functions that are called in a predertermined order. Each middleware function in the chain has the freedom to:
- execute arbitrary code
- mutate the event
- call the next middleware
- interrupt the chain by never calling the next middleware (what we call swallowing the event)
- interrupt the chain by throwing an error

## A simple middleware function

A middleware function is simply a function that takes an event as the first parameter and a `next` function as the second parameter.

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

    // call next middleware function
    next()
}
```

The return value of the middleware function isn't used by Botpress.

## Registering middlewares

You need to register a middleware function for botpress to know about it and use it. You may do so with the [`bp.middlewares.register`](core-reference.md#registermiddlewaredefinition---void) method:

```js
// ** code taken from botpress-messenger **
bp.middlewares.register({
    name: 'messenger.sendMessages', // friendly name
    type: 'outgoing', // either incoming or outgoing
    order: 100, // arbitrary number
    handler: outgoingMiddleware, // the middleware function
    module: 'botpress-messenger', // the name of the module, if any
    description: 'Sends out messages that targets platform = '
    + 'messenger. This middleware should be placed at the end as it swallows events once sent.'
})
```

Once all middleware functions have been registered (usually modules should register middleware functions immediately in their initialization), **you must load them** using [`bp.middlewares.load()`](core-reference.md#load---void), which will create the incoming and outgoing chains automatically.

Once middleware functions are loaded, you'll see them displayed in your bot's interface:

![](/assets/screenshot-middlewares.png)

## Ordering middleware functions

By default, middleware functions are ordered by **ascending order** according to their `order` property set on registration. The order can then be manually overwritten:

![](/assets/screenshot-middlewares-order.png)

You can also re-order them programmatically using middleware function customizations.

## Full Messages Lifecycle Example

Imagine you have a travel bot that is available on Facebook Messenger and Slack and that can handle many languages.

Your bot's installed modules would probably look a bit like:
- [botpress-messenger](https://github.com/botpress/botpress-messenger) for I/O with Facebook Messenger
- [botpress-slack](https://github.com/botpress/botpress-slack) for I/O with Slack
- [botpress-analytics](https://github.com/botpress/botpress-analytics) to have an overview of how people use your bot
- botpress-translate _(fictive)_ to translate incoming and outgoing messages
- ~/my-bot/private\_modules/botpress-travel _(fictive)_ your bot's travel logic goes here

Now lets look at how a complete interaction might be handled by your bot.

1. A user types a message in French to your bot in Facebook Messenger
2. Facebook pushes the message to your bot via the built-in botpress-messenger's Webhook
3. botpress-messenger retrieves the user information and stores it in the built-in database
4. botpress-messenger parses the message and **calls the first incoming middleware function** _(botpress-analytics)_
5. botpress-analytics tracks the message then **calls the next middleware function** in the chain _(botpress-translate)_
6. botpress-translate translates the message from French to English (by mutating it) then calls the next middleware function in the chain _(botpress-travel)_
7. botpress-travel processes the message and responds by calling the `bp.messenger.sendText` method
8. botpress-messenger takes the response and **calls the outgoing middlewares chain**
9. botpress-translate translates the message from English to French (by mutating it) then calls the next middleware function in the outgoing chain _(botpress-analytics)_
10. botpress-analytics tracks the message then calls the next middleware function _(botpress-messenger)_
11. botpress-slack will ignore the message because it doesn't know how to process messages with `type: facebook`
12. botpress-messenger sends the message to Facebook Messenger through the Send API

All of this happens behind the scenes and is handled by the modules middleware. As a bot developer, all you have to worry about is writing the bot's logic.
