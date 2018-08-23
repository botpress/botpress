# botpress-channel-rocketchat

![botpress-rocketchat](https://github.com/RocketChat/botpress-channel-rocketchat/wiki/images/botpress.gif)

Official Rocket.Chat connector module for [Botpress](http://github.com/botpress/botpress).

This module has been build to accelerate and facilitate development of Rocket.Chat bots.

## Installation

To install this module just run:

```sh
npm install @botpress/channel-rocketchat
```

## Get started

To setup connexion of your chatbot to Rocket.Chat follow this steps:

* If you are in a development environment up a docker instance of Rocket.Chat,
see how to make it in our example repository:

[botpress-kick-starter](https://github.com/RocketChat/botpress-kick-starter)

* Login with your user;

* Create a new user for your bot;

* Add your bot to wanted channels;

## Features

### Incoming

* [Profile](#profile)
* [Text messages](#text-messages)

### Outgoing

* [Text messages](#text-messages-1)

## Reference

### Incoming

You can listen to incoming event easily with Botpress by using `bp` built-in `hear` function. You only need to listen to specific Rocket.Chat event to be able to react to user's actions.

```js
bp.hear({platform:'rocketchat', type: 'message', text:'hello'}, async (event, next) => {
  await bp.rocketchat.sendText(event.channel, 'Hi I\'m alive', {})
  next()
})
```

In fact, this module preprocesses messages and send them to incoming middlewares. When you build a bot or a module, you can access to all information about incoming messages that have been send to  middlewares.

All your flow implementation will work with Rocket.Chat too.

```js
await bp.middlewares.sendIncoming({
    platform: 'rocketchat',
    type: 'message',
    text: message.msg,
    user: user,
    channel: message.rid,
    ts: message.ts.$date,
    direct: false,
    roomType: meta.roomType,
    raw: message
})
```

#### Profile

You can acces to all user's profile information by using this module. A cache have been implemented to fetch all information about users and this information is sent to middlewares.

```js
{
    id: id,
    userId: userId,
    username: message.u.username,
    platform: 'rocketchat',
    first_name: message.u.name,
    number: userId
}
```

**Note**: All new users are automatically saved by this module in Botpress built-in database (`bp.db`).

#### Text messages

An `event` is sent to middlewares for each incoming text message from Rocket.Chat platform with all specific information.

```js
{
    platform: 'rocketchat',
    type: 'message',
    text: message.msg,
    user: user,
    channel: message.rid,
    ts: message.ts.$date,
    direct: false,
    roomType: meta.roomType,
    raw: message
}
```

Then, you can listen easily to this `event` in your module or bot

```js
bp.hear('hello')
```

### Outgoing

By using our module, you can send any text you want to your users on Rocket.Chat.

### Text messages

In code, it is simple to send a message text to a specific users or channels.

#### `sendText(text, options, event)` -> Promise

##### Arguments

1. ` text ` (_String_): Text message that will be send to user.

2. ` options ` (_Object_): Needed options.

3. ` event ` (_Object_): Contain the message, user and options data.

#### Save users in Database

Users are automatically persisted in the built-in botpress database using the built-in `bp.db.saveUser` function.

### Community

There's a [Rocket.Chat](https://slack.botpress.io) where you are welcome to join us, ask any question and even help others.

Check our repositories too:

[botpress-kick-start](https://github.com/RocketChat/botpress-kick-starter)

[botpress-channel-rocketchat](https://github.com/RocketChat/botpress-channel-rocketchat)

### License

botpress-rocketchat is licensed under AGPL-3.0
