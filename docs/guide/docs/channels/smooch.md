---
id: smooch
title: Smooch (Sunshine Conversations)
---

## Requirements

- An HTTPS Endpoint to your chatbot

  - Set the `externalUrl` field in botpress.config.json
  - Create an HTTPS tunnel to your machine using Ngrok. [**Tutorial**](https://api.slack.com/tutorials/tunneling-with-ngrok)
  - Using Nginx and Let's Encrypt. [**Tutorial**](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)

- Create a [smooch.io](https://smooch.io/) account (you will need a business email)

## Setup

### Smooch App
Firstly, you need to create an app on smooch. To do so, please follow the steps below:

1. On the `app.smooch.io` home page, click on `Create new app`

2. Enter a name for your app and click `Create App`

3. Connect a channel to your app (Telegram, Whatsapp, or any other listed channel)

4. You should see a channel in the `Overview` section of your app

### Botpress Connection

1. Go to the `Settings` section of your app

2. At the bottom, you will find an `API Keys` menu. Create a new API key

3. You will need the `id` (the one that starts with app\_) and `secret` key to setup your bot

## Configuration

1. Edit `data/bots/YOUR_BOT_ID/config/channel-smooch.json` (or create it) and set

- enabled: Set to `true`
- keyId: Paste the `id` of your key from the `Settings` section
- secret: Paste the `secret` of your key from the `Settings` section

The resulting json will appear as follows:

```json
{
  "$schema": "../../assets/modules/channel-smooch/config.schema.json",
  "enabled": true,
  "keyId": "<YOUR_KEY_ID>",
  "secret": "<YOUR_KEY_SECRET>",
  "chatUserAuthDuration": "24h"
}
```

2. Restart Botpress and test if your chatbot has been successfully connected to your desired channel.
