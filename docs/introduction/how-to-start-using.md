# How to start using

## Installation

Botpress requires [node](https://nodejs.org) (version >= 4.2) and uses [npm](https://www.npmjs.com) as package manager.

```
npm install -g botpress
```

## Creating a bot

Creating a bot is simple, you need to run [`botpress init`](/docs/cli-reference.md#init) in a terminal inside an empty directory:

```
mkdir my-bot && cd my-bot
botpress init
```

Once your bot is created, you need to run [`botpress start`](/docs/cli-reference.md#start--s) to start your bot:

```
botpress start
```

This will provide you locally a web interface available at **`http://localhost:3000`**

## Adding stuff to your bot

At this point, your bot does nothing, you need to add features. There are two ways to add features:
- Installing and configuring modules
- Coding

### Installing and configuring modules

For example, there's a `botpress-messenger` module that will make your bot connect to Facebook Messenger and easily send/receive messages.

You can install modules directly in the web interface, or by using the [`botpress install`](/docs/cli-reference.md#install--i) command:

```
botpress install messenger
```

Once installed, modules expose two things:
- A graphical interface (available in the left panel). This makes configuration easy and convenient. You don't need to know about coding to use the graphical interface.
- Features via APIs. Each module has a detailed documentation on how to use their API.

There are not a lot of modules yet, we count on the community to develop many useful ones! Please [get in touch with us](https://slack.botpress.io) if you would like to develop modules but you are not sure on how to get started.

### Coding to add features

As the number of modules increase, we expect that the amount of code you'll need to write will lower everyday. Developers can add code directly in the bot (i.e. `index.js`) and access the core and modules features. For example, if you wish to respond to a `GETTING_STARTED` event on Facebook Messenger, you might code something along these lines:

```js
bp.hear({ type: 'postback', text: 'GETTING_STARTED' }, (event, next) => {
  bp.messenger.sendText(event.user.id, 'Hello, human!')
})
```

## Having more fun

To create a basic Hello Human bot, please read the [Hello Human in 3 minutes](/docs/hello-human-in-3-minutes.md).

For learn more about what's next, please read the [Creating your bot](/docs/creating-your-bot/) section.