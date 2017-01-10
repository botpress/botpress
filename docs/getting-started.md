# A begineer's Guide to Botpress

Looking to get started with Botpress but unsure how? This page is for you! We'll start by demystifying what botpress is exactly, then we'll create a hello world bot on Messenger.

## What Botpress is not

- A SaaS Bot building platform
- A no-coding bot building platform
- A code-from-scratch bot building platform
- In competition with other bot building tools
- Extremely hard to use and reserved to PhD's
- A side project that will be abandonned in a few weeks
- A cure to cancer

## What Botpress is

- A code-first bot building platform
- On premise (i.e. runs locally, host it yourself)
- Modular & open-source (don't reinvent the wheel)
- Community-focused. We want everybody to contribute and create modules.
- Leveraging as many other tools as possible
- Easy to learn and feeling natural for node developers
- A serious project backed by a real company
- Highly productive

## What you get by using Botpress

Before creating Botpress, we created many bots using all the tools available on the market. When you build a bot, you basically have the choice between using a SaaS platform (like Chatfuel, FlowXO, Motion.ai) or coding a bot from scratch. Let's look at why both don't work:

- The SaaS thing looks very interesting because it's very easy to get started and requires no coding skills. The problems come when you want to actually get your bot to do stuff that are not supported by the SaaS or that you want to customize the overall experience. Some let you call APIs to run custom code, which defies the first purpose of being hassle-free and no-coding-required.

- Coding a bot from scratch is often the first reflex for developers. Sure, it's a bit longer and we need to learn how things work. But that's what makes us programmers. We like to create things ourselves, and that's fine! But... how am I supposed to schedule broadcasts? Fetch and cache user profiles? Save and process customer orders? Add Human-in-the-loop capabilities? See where my bot messed up in production? Edit the content live without redeploying the bot? Do A/B testing? Hmmmm..

That's why we created Botpress. We combined all the advantages of the SaaS and the "from Scratch" into an easy-to-use modular framework. All these things that would take you weeks to implement from scratch are available as Botpress Modules. Everything is accessible from a rich graphical interface, so once your bot is coded literally anybody can manage it.

THe philosophy behind botpress is that if there's something you want your bot to do and that thing is not specific to only your bot, then **there should be a module for it**. If there's not, we hope that you will take the time to make a positive contribution to the rest of us and **create the missing module**.

## Your very first Messenger bot

In this section, we will see how easy it is to build a Messenger bot using Botpress.

### 1. Install the botpress CLI on your computer

You need to have `botpress` installed as a global dependency using `npm`. If it's done yet, run the following command:

```
npm install -g botpress
```

### 2. Creating a new bot

Once botpress has been installed, you need to create a new directory and move into it.

```
# On Mac & Unix
mkdir hello-world-bot && cd hello-world-bot

# On Windows
md hello-world-bot && cd hello-world-bot
```

Then you can use the botpress CLI to initialize a new bot inside this directory. This will automatically create a sample bot inside an empty directory, will all the files you need to run it with botpress.

```
botpress init
```

At this point, **botpress is installed locally** (as a npm dependency) and this is just a regular nodejs application.

### 3. Installing Messenger

You now have a bot, but it does nothing. Your bot is not connected to any messaging platform and does not process incoming text at all. We'll fix that now.

Since your bot is just a regular nodejs program, we can install npm modules to add features to our bot. If you [search NPM for botpress](https://www.npmjs.com/search?q=botpress), you'll see there's many modules.

[**botpress-messenger**](https://github.com/botpress/botpress-messenger) seems to be the module we need to connect our bot to Facebook Messenger. Let's install it as a local dependency:

```
npm install --save botpress-messenger
```

> Tip: There's a shortcut: `botpress install messenger`. And there's also an alias: `botpress i messenger`. An even shorter one: `bp i messenger`.

### 4. Running the bot

Now that we have a bot with Messenger installed, we can run this bot. Just like any nodejs applications, you can use `npm start`, or if you prefer to use the botpress commands:

```
botpress start
```

Head to [**http://localhost:3000**](http://localhost:3000) to see your bot's graphical interface. You should see the Messenger module we just installed showing up at the left!

### 5. Configure Messenger connexion settings

Before we can actually start adding stuff, we need to link your bot to a Facebook Page. The Messenger module [has an entire step-by-step tutorial](https://github.com/botpress/botpress-messenger#get-started) on how to do this, but if you ever created a Messenger bot before you probably don't need to read it.

Summary:

1. Create a [Facebook Page](https://www.facebook.com/pages/create) if you don't already have one.
2. Create a [Messenger Application](https://developers.facebook.com/) if you don't already have one. 
3. Grab your **App ID**, **App Secret** and **Token Access**, and copy them directly in the botpress-messenger UI.
4. Use [**ngrok**](https://ngrok.com/) to create a secure ssl tunnel to your computer (so that facebook can talk to your bot). We added a convenience ngrok button directly in botpress-messenger so that you don't have to update it manually. If you experience any problem, we suggest you use the ngrok CLI instead.
5. Click **connect**. Done.

<img src='https://raw.githubusercontent.com/botpress/botpress/master/assets/screenshot-connexion-settings.png' height=300px />

To test that your bot is well connected to the facebook page, you can talk to the bot and say "BOT_LICENSE".

You should see something like:

> Bot: motivation-bot
> Created by: Botpress Team
> License: AGPL-3.0
> Botpress: 0.0.41

### 6. Simple Hello World

Now, open `index.js` at the root of your bot. You should see these three lines:

```js
module.exports = function(bp) {
  bp.middlewares.load()
}
```

Some explanations:

**Line 1**: The entry point of a botpress bot is always a function accepting `bp`, which is the global botpress context object. Everything you need from botpress and the modules is accessible from this context object. The `bp` object contains the default botpress API, and the **modules augment** (mutates) the bp context object to offer features to your bot.

**Line 2**: Botpress relies on a middlewares architecture to process incoming and outgoing messages/interactions. You can read more about the Botpress middlewares [here](https://docs.botpress.io/middlewares.html) but for now all you need to know is that this line is necessary to correctly setup and load the modules.

Now we are going to implement a simple Hello World:

```js
module.exports = function(bp) {
  bp.middlewares.load()

  bp.hear('hello', event => { // Capture messages that are 'hello'
    bp.messenger.sendText(event.user.id, 'Hello, world!') // Respond to the user with 'Hello, world!'
  })
}
```

Note: Here we listen on a hardcoded "hello" string, but the [`hear`](https://docs.botpress.io/core-reference.html) command is pretty powerful and can do much more.

Now stop your bot (by killing the current nodejs process that runs it, i.e. CTRL-C on Mac) and start it again. Now the bot should answer to 'hello'!

### 7. A bit fancier Hello World

Now let's explore a little more the power of the `botpress-messenger` module.

What if we wanted our bot to respond to the user by its name? The messenger module automatically fetched the user profiles and inject it in the `event.user` object. The user profiles are cached by the module to keep your bot running fast:

```js
module.exports = function(bp) {
  bp.middlewares.load()

  bp.hear(/hello/i, (event, next) => { // We use a regex instead of a hardcoded string
    const first_name = event.user.first_name

    bp.messenger.sendText(event.user.id, 'Hello, ' + first_name, { typing: true })
  })
}
```

Note that the sendText function also takes a third argument, and we configured it to set typing to true. This has the effect of showing typing indicators to simulate the bot typing on a keyboard.

## Having more fun

This was just the very beginning of what you can do with Botpress. If you would like to get started with real fun stuff, make sure to:

1. Read the rest of the documentation
2. Check out the [Cookbook](https://github.com/botpress/cookbook), which contains lots of code recipes for common bot tasks
3. Read our demo bot [Boost](https://github.com/botpress/Boost)'s source code
