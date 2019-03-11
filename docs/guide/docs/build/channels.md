---
id: channels
title: Messaging Channels
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

#### Create your Facebook App

Go to your [Facebook Apps](https://developers.facebook.com/apps/) and create a new App.

![Create App](assets/messenger-app.png)

#### Enable Messenger on your App

Go to Products > Messenger > Setup

![Setup Messenger](assets/messenger-setup.png)

#### Create a Facebook Page

1. In Products > Messenger > Settings > Create a new page.
1. Then select the newly created page in the `Page` dropdown menu.
1. Copy your Page Access Token, you'll need it to setup your webhook.

![Create Facebook Page](assets/messenger-page.png)

#### Setup your webhook

Messenger will use a webhook that you'll need register in order to communicate with your bot.

1. In Products > Messenger > Settings > Webhooks > Setup Webhooks

1. In Callback URL, enter your secured public url and make sure to point to the `/webhook` endpoint.
1. Paste your Page Access Token in the Verify Token field.
1. Make sure `messages` and `messaging_postbacks` are checked in Subscription Fields.

> **⭐ Note**: When you setup your webhook, Messenger requires a **secured public** address. To test on localhost, we recommend using services like [pagekite](https://pagekite.net/), [ngrok](https://ngrok.com) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

![Setup Webhook](assets/messenger-webhook.png)

#### Add your token to your module config file

Head over to `data/bots/<your_bot>/config/channel-messenger.json` and edit your info or create the file if it doesn't exists.

```json
{
  "$schema": "../../../assets/modules/channel-messenger/config.schema.json",
  "verifyToken": "<your_token>",
  "greeting": "This is a greeting message!!! Hello Human!",
  "getStarted": "You got started!",
  "persistentMenu": [
    {
      "locale": "default",
      "call_to_actions": [
        {
          "title": "Bot's Menu",
          "type": "nested",
          "call_to_actions": [
            {
              "type": "web_url",
              "title": "Latest News",
              "url": "https://news.google.com",
              "webview_height_ratio": "full"
            }
          ]
        }
      ]
    }
  ]
}
```

### Configuration

The config file for channel-messenger can be found at `data/bots/<your_bot>/config/channel-messenger.json`.

| Property       | Description                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| verifyToken    | The Facebook Page Access Token                                                                                                                                                                                                                                            |
| greeting       | The optional greeting message people will see on the welcome screen. Greeting will not appear if left blank.                                                                                                                                                              |
| getStarted     | The optional message of the welcome screen "Get Started" button. Get Started wont appear if this is left blank.                                                                                                                                                           |
| persistentMenu | The optional raw persistent menu object. The menu won't appear if this is left blank. Please refer to Facebook's [Persistent Menu Documentation](https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu/) to know more about menu options. |

### More details

If you need more details on how to setup a bot on Messenger, please refer to Facebook's [documentation](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup) to setup your Facebook App and register your webhook.

# Other Channels

We are in the progress of adding many more channels to Botpress Server. If you would like to help us with that, [pull requests](https://github.com/botpress/botpress#contributing) are welcomed!
