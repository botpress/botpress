## Middlewares

Middlewares are a critical component of botpress. Simply put, they are functions that process messages. Think of it this way: everything that enter or leave your bot is coming in (or out) from middlewares.

If you have used [Express](TODO) before, botpress middlewares are very similar to express's middlewares.

Botpress has two middlewares: [incoming](TODO) and [outgoing](TODO)

**To receive messages**: An installed module must pipe messages into the [incoming middleware](TODO)

**To send messages**: You (or a module) must pipe messages into the [outgoing middleware](TODO) and have a module able to send it to the right platform

### Example

**Incoming**: [botpress-messenger](TODO) connects to Facebook and receives messages from its built-in Webhook. It then pipes messages into the incoming middleware, which your bot can process.

**Outgoing**: [botpress-messenger](TODO) listens (through a middleware function) for messages it can process on the outgoing middleware and sends them to Facebook through the Messenger Send API.
