# Structure

## Dissecting your first bot

An oversimplified view of the architecture of a Botpress bot could look as below.

<img alt="Lifecycle of a Message" width="600" src="{{ book.assets }}/message-lifecycle.png">

In simple terms, every single incoming messages are received (and processed) by the **Incoming Middleware Chain**, and every single outgoing messages are processed (and sent) by the **Outgoing Middleware Chain**.

A middleware chain, as the name suggests, is simply an ordered list of **middleware functions**. These middleware functions are what your bot is principaly made of, as they dictate how your bot reacts to incoming and outgoing messages.

You can learn more reading the section _[Understanding the Middleware](../creating-your-bot/understanding-the-middlewares.md)_.

### How Botpress bots run

Bots created on Botpress are very lightweight and contain very few files. The reason for that is because Botpress itself is a dependency of your bot. Have a look inside the `package.json` file of your bot and you'll see something like:

```js
  // ...
  "main": "index.js",
  "dependencies": {
    "botpress": "0.x", // <-- Botpress is a local dependency of your bot
    "botpress-web": "1.x"
  },
  // ...
```

So all the core logic of Botpress is inside the botpress package. When you do `npm start` or `botpress start` (they are the same thing), what happens is that the **local version of Botpress** loads your bot (in this case `index.js` since this is what the package.json says is the "main" file).

> **HEADS UP:** Do *not* confuse the global Botpress (the CLI) with the local version of Botpress installed in your bot. They are two different things. You could in theory have 40 bots on your machine, each running their own different version of Botpress.

### Project Structure

**Your bot is a regular NodeJS program.** This is something very important to understand. Excluding the fact that Botpress itself *loads* your bot, there is no magic or anything special about your bot's code. If you can write NodeJS, you can easily create a bot!

When you used the CLI to create your first bot, some files were added to your bot's directory. Let's go over them quickly so you understand the overall architecture.

```markdown
* index.js
* content.yml
* botfile.js
* package.json
* theme.scss
* LICENSE
* /modules_config
* /data
```

The only important files you'll ever risk to deal with are: `index.js`, `content.yml` and `botfile.js`

#### index.js

**TLDR: This file contains all your bot's logic**.

This is your bot's entry point. This is what Botpress will **load** when doing `npm start`. This file should always export a function accepting an instance of Botpress (abbreviated `bp`).

The simplified booting of a botpress bot works like this:

1. Read your bot's package.json
2. Check its dependencies and see if any is a valid Botpress module
3. Load the modules one by one
4. Start a web server and expose a graphical interface
5. Load the bot's entry point and provide a reference to the global Botpress instance (`bp`)

Since this is the entry point, all the logic goes there. Of course, you are 100% free (and encouraged) to write clean code and separate the code into multiple files and arrange it whichever way you want.

#### content.yaml

This file contains all the conversational content your bot is going to speak to users. It's a Botpress-specific language called UMM ([Universal Message Markdown](./umm.md)). More about this later.

#### botfile.js

This is your bot configuration file. It's pretty self-explanatory, so you can open it and see by yourself what you can configure.