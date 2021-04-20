# Channel-Vonage

## Requirements

Vonage requires you to have an Application to setup your bot.

- [Create a Vonage Account](https://dashboard.nexmo.com/sign-up)
- [Create a Vonage Application](https://dashboard.nexmo.com/applications/new)
  - Give it a name
  - Under _Authentication_, click _Generate public and private key_ (this will download a file called `private.key`. You will need this file later on.)
  - Click _Generate new application_
- An HTTPS Endpoint to your bot
  - Create an HTTPS tunnel to your machine using Ngrok. [**Tutorial**](https://api.slack.com/tutorials/tunneling-with-ngrok)
  - Using Nginx and Let's Encrypt. [**Tutorial**](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)

## Setup

### Bot-level Configuration

#### Enable the Vonage Channel

- Go to the module admin page and enable `channel-vonage`.
- Create a config file for your bot (`data/bots/<your_bot>/config/channel-vonage.json`) using the content of the **global** `channel-vonage.json` file and prefix the `$schema` property with an additional `../` to point to the correct schema.
- Set the following properties:
  - `enabled: true`
  - `apiKey`: You will find this value in your [Account Settings](https://dashboard.nexmo.com/settings).
  - `apiSecret`: You will find this value in your [Account Settings](https://dashboard.nexmo.com/settings).
  - `applicationId`: You will find this value when selecting your newly created application (https://dashboard.nexmo.com/applications/)
  - `privateKey` The content of the `private.key` file that was generated when you created your Vonage Application. **_Note: You must replace all line breaks with the character `\n`_**.
  - `useTestingApi (optional)`: Set to `true` if you want to use the sandbox instead of the live version of Vonage API (see [Setup a Messages Sandbox](#Setup%20a%20Messages%20Sandbox)).
- Make sure you have an HTTPS url pointing to your Botpress Server and set the [`EXTERNAL_URL`](https://botpress.com/docs/manage/configuration#exposing-your-bot-on-the-internet) environment variable
- Restart Botpress Server to reload the configuration
- Setup your webhook (see below)

#### Setup your webhook

Vonage will use a webhook that you'll need to register to communicate with your bot.

1. Select your application in the [`Your Application`](https://dashboard.nexmo.com/applications) menu.
1. Click the `Edit` button.
1. Under `Capabilities` enable the _Messages (beta)_ functionality.
1. Enter the inbound and status webhooks by suffixing the webhook URL respectively with `/inbound` and `/status`.

> **⭐ Note**: When you setup your webhook, Vonage requires a **secured public** address. To test on localhost, we recommend using services like [pagekite](https://pagekite.net/), [ngrok](https://ngrok.com) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

#### Setup a Messages Sandbox

When wanting to test the integration with Vonage and WhatsApp, you need to enable a Sandbox where you can send test messages.

1. In the left end side menu of [Vonage Dashboard](https://dashboard.nexmo.com/) select _Messages and Dispatch (beta)_ -> _Sandbox_
1. Click on the channel you want to setup and follow the instructions detailed on the page.
1. Under `Webhooks`, type the same URLs as you find in your application configuration.

> **⭐ Note**: Currently, only WhatsApp can be used with this channel-vonage.
