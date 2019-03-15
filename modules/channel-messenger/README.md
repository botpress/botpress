# Channel-Messenger

## Requirements

Messenger requires you to have a Facebook App and a Facebook Page to setup your bot.

- [Create a Facebook App](https://developers.facebook.com/docs/apps/)
- [Create a Facebook Page](https://www.facebook.com/pages/creation/)
- An HTTPS Endpoint to your bot
  - Create an HTTPS tunnel to your marchine using Ngrok. [**Tutorial**](https://api.slack.com/tutorials/tunneling-with-ngrok)
  - Using Nginx and Let's Encrypt. [**Tutorial**](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)

## Setup

### Global Configuration

#### Enable the Messenger Channel

- Run Botpress Server a first time to auto-generate the global configuration file
- Head over to `data/global/config/channel-messenger.json`. If it doesn't exist, restart Botpress Server.
- Set the following properties:
  - `appSecret`. You will find this value in your Facebook App page.
  - `verifyToken`. This is a random string you need to generate and keep secret. You'll need to copy/paste this token in the Facebook App portal when setting up your webhook.
- Make sure you have an HTTPS url pointing to your Botpress Server and set the [`EXTERNAL_URL`](https://botpress.io/docs/manage/configuration/#exposing-your-bot-on-the-internet) environment variable
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

## Advanced Configuration

Read the `http://localhost:3000/assets/modules/channel-messenger/config.schema.json` file to read more about the more advanced configuration.
