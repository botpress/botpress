---
id: version-11.8.3-messenger
title: Facebook Messenger
original_id: messenger
---

## Requirements

Messenger requires you to have a Facebook App and a Facebook Page to setup your bot.

- [Enable Channel-Messenger Module](../main/module#enabling-or-disabling-modules)
- [Create a Facebook App](https://developers.facebook.com/docs/apps/)
- [Create a Facebook Page](https://www.facebook.com/pages/creation/)
- An HTTPS Endpoint to your bot
  - Create an HTTPS tunnel to your marchine using Ngrok. [**Tutorial**](https://api.slack.com/tutorials/tunneling-with-ngrok)
  - Using Nginx and Let's Encrypt. [**Tutorial**](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)

## Setup

### Global Configuration

#### Enable the Messenger Channel

- Head over to `data/global/config/channel-messenger.json`. If it doesn't exist, restart Botpress Server.
- Set the following properties:
  - `appSecret`. You will find this value in your Facebook App page.
  - `verifyToken`. This is a random string you need to generate and keep secret. You'll need to copy/paste this token in the Facebook App portal when setting up your webhook.
- Make sure you have an HTTPS url pointing to your Botpress Server and set the [`EXTERNAL_URL`](../advanced/configuration/#exposing-your-bot-on-the-internet) environment variable
- Restart Botpress Server to reload the configuration
- Setup your webhook (see below)

#### Setup your webhook

Messenger will use a webhook that you'll need register in order to communicate with your bot.

1. In Products > Messenger > Settings > Webhooks > Setup Webhooks
1. In Callback URL, enter your secured public url and make sure to point to the `/webhook` endpoint.
1. Paste your verifyToken (the random string that you generated) in the Verify Token field.
1. Make sure `messages` and `messaging_postbacks` are checked in Subscription Fields.

> **⭐ Note**: When you setup your webhook, Messenger requires a **secured public** address. To test on localhost, we recommend using services like [pagekite](https://pagekite.net/), [ngrok](https://ngrok.com) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

### Bot-level Configuration

Head over to `data/bots/<your_bot>/config/channel-messenger.json` and create the file if it doesn't exist. If it doesn't exist, copy & paste the content of the **global** `channel-messenger.json` file and prefix the `$schema` property with an additional `../` to point to the correct schema.

> **Important:** One bot is connected to **one** facebook page.

You will need to setup the following properties:

- `accessToken` has to be set to your [Page Access Token](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup). [Official Reference](https://developers.facebook.com/docs/facebook-login/access-tokens/#pagetokens)
- `enabled` has to be set to `true`

Restart Botpress Server to reload the configuration.

## Configurations

Read the [config definition file](https://github.com/botpress/botpress/blob/master/modules/channel-messenger/src/config.ts) to learn more about configurations.

> All changes to the configuration will take effect on `onBotMount`. To refresh the configuration at runtime, you can disable and enable the bot again without having to restart the server.

### Greeting Text

```json
"greeting": "Hello, I'm your bot!"
```

Read more about [greeting](https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/greeting).

### Get Started

```json
"getStarted": "<GET_STARTED_PAYLOAD>"
```

Read more about [get started](https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/get-started-button).

### Persistent Menu

The raw persistent menu object. Read more about persistent menu [here](https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu).

> The persistent menu is cached locally on the user's client, but updates are fetched periodically. If you change the persistent menu, it can take some time for the menu to update. You can force refresh by deleting the conversation and starting a new one.

**Configuration example**:

```json
 "persistentMenu": [
    {
      "locale": "default",
      "call_to_actions": [
        {
          "title": "My Account",
          "type": "nested",
          "call_to_actions": [
            {
              "title": "Pay Bill",
              "type": "postback",
              "payload": "PAYBILL_PAYLOAD"
            },
            {
              "type": "web_url",
              "title": "Latest News",
              "url": "https://www.messenger.com/",
              "webview_height_ratio": "full"
            }
          ]
        }
      ]
    }
  ]
```
