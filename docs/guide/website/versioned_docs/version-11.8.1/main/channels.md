---
id: version-11.8.1-channels
title: Messaging Channels
original_id: channels
---

## Converse API

The Converse API is an easy way to integrate Botpress with any application or any other channels. This API will allow you to speak to your bot and get an answer synchronously.

### Usage (Public API)

`POST /api/v1/bots/{botId}/converse/{userId}` where **userId** is a unique string identifying a user that chats with your bot (**botId**).

#### Request Body

```json
{
  "type": "text",
  "text": "Hey!"
}
```

### Usage (Debug API)

There's also a secured route (requires authentication to Botpress to consume this API). Using this route, you can include more data to your response by using the `include` query params separated by commas.

#### Example

```
POST /api/v1/bots/{botId}/converse/{userId}/secured?include=nlu,state,suggestions,decision
```

Possible options:

- **nlu**: The output of Botpress NLU
- **state**: The state object of the user conversation
- **suggestions**: The reply suggestions made by the modules
- **decision**: The final decision made by the Decision Engine

#### API Response

This is a sample of the response given by the `welcome-bot` when its the first time you chat with it.

```json
{
  "responses": [
    {
      "type": "typing",
      "value": true
    },
    {
      "type": "text",
      "markdown": true,
      "text": "May I know your name please?"
    }
  ],
  "nlu": {
    "language": "en",
    "entities": [],
    "intent": {
      "name": "hello",
      "confidence": 1
    },
    "intents": [
      {
        "name": "hello",
        "confidence": 1
      }
    ]
  },
  "state": {}
}
```

### Caveats

Please note that for now this API can't:

- Be used to receive proactive messages (messages initiated by the bot instead of the user)
- Be disabled, throttled or restricted

## Messenger

### Requirements

Messenger requires you to have a Facebook App and a Facebook Page to setup your bot.

- [Create a Facebook App](https://developers.facebook.com/docs/apps/)
- [Create a Facebook Page](https://www.facebook.com/pages/creation/)
- An HTTPS Endpoint to your bot
  - Create an HTTPS tunnel to your marchine using Ngrok. [**Tutorial**](https://api.slack.com/tutorials/tunneling-with-ngrok)
  - Using Nginx and Let's Encrypt. [**Tutorial**](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)

### Setup

#### Global Configuration

##### Enable the Messenger Channel

- Head over to `data/global/config/channel-messenger.json`. If it doesn't exist, restart Botpress Server.
- Set the following properties:
  - `appSecret`. You will find this value in your Facebook App page.
  - `verifyToken`. This is a random string you need to generate and keep secret. You'll need to copy/paste this token in the Facebook App portal when setting up your webhook.
- Make sure you have an HTTPS url pointing to your Botpress Server and set the [`EXTERNAL_URL`](../advanced/configuration/#exposing-your-bot-on-the-internet) environment variable
- Restart Botpress Server to reload the configuration
- Setup your webhook (see below)

##### Setup your webhook

Messenger will use a webhook that you'll need register in order to communicate with your bot.

1. In Products > Messenger > Settings > Webhooks > Setup Webhooks
1. In Callback URL, enter your secured public url and make sure to point to the `/webhook` endpoint.
1. Paste your verifyToken (the random string that you generated) in the Verify Token field.
1. Make sure `messages` and `messaging_postbacks` are checked in Subscription Fields.

> **⭐ Note**: When you setup your webhook, Messenger requires a **secured public** address. To test on localhost, we recommend using services like [pagekite](https://pagekite.net/), [ngrok](https://ngrok.com) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

#### Bot-level Configuration

Head over to `data/bots/<your_bot>/config/channel-messenger.json` and create the file if it doesn't exist. If it doesn't exist, copy & paste the content of the **global** `channel-messenger.json` file and prefix the `$schema` property with an additional `../` to point to the correct schema.

> **Important:** One bot is connected to **one** facebook page.

You will need to setup the following properties:

- `accessToken` has to be set to your [Page Access Token](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup). [Official Reference](https://developers.facebook.com/docs/facebook-login/access-tokens/#pagetokens)
- `enabled` has to be set to `true`

Restart Botpress Server to reload the configuration.

### Advanced Configuration

Read the `http://localhost:3000/assets/modules/channel-messenger/config.schema.json` file to read more about the more advanced configuration.

## Telegram

### Requirements

- Use Telegram's BotFather to create a bot. Please refer to [How do I create a bot?](https://core.telegram.org/bots#3-how-do-i-create-a-bot)
- Have your Telegram bot token ready

### Setup

1. Create or edit this file `data/bots/<your_bot>/config/channel-telegram.json` and enter your Telegram bot token:

```json
{
  "botToken": "<your_bot_token>"
}
```

2. Restart Botpress and talk to your Telegram bot.

## More Channels

We are in the progress of adding many more channels to Botpress Server. If you would like to help us with that, [pull requests](https://github.com/botpress/botpress#contributing) are welcomed!

## FAQ

### How can I test a channel locally?

Some channels (e.g. Messenger) require to have a public secure url. When testing on locally, we recommend using services like [pagekite](https://pagekite.net/), [ngrok](https://ngrok.com) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

### Why are my images missing?

Assets are exposed using a configurable base path. Make sure the `EXTERNAL_URL` environment variable is set so that your assets are accessible from the outside.

You can set the environment variable in a `.env` file located under `/data`.

If you don't know anything about `.env` files, just create a new file named `.env` in your `/data` folder. Then add the following line to it:

```bash
EXTERNAL_URL=<public_url>
```

Replace `<public_url>` by your actual Botpress Server url.
