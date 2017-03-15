# How Botpress Works

An oversimplified view of the architecture of a Botpress bot could look as below.

<img alt="Lifecycle of a Message" width="600" src="https://raw.githubusercontent.com/botpress/botpress/master/assets/message-lifecycle.png">

In simple terms, every single incoming messages are received (and processed) by the **Incoming Middleware Chain**, and every single outgoing messages are processed (and sent) by the **Outgoing Middleware Chain**.

A middleware chain, as the name suggests, is simply an ordered list of **middleware functions**. These middleware functions are what your bot is principaly made of, as they dictate how your bot reacts to incoming and outgoing messages.

You can learn more reading the section _[Understanding the Middleware](../creating-your-bot/understanding-the-middlewares.md)_.