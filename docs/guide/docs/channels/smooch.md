---
id: smooch
title: Smooch (Sunshine Conversations)
---

## Prerequisite

- An HTTPS Endpoint to your bot

  - Set the `externalUrl` field in botpress.config.json
  - Create an HTTPS tunnel to your machine using Ngrok. [**Tutorial**](https://api.slack.com/tutorials/tunneling-with-ngrok)
  - Using Nginx and Let's Encrypt. [**Tutorial**](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)

- Create a [smooch.io](https://smooch.io/) account (you will need a business email)

## Steps

### Create the app on Smooch

1. On the `app.smooch.io` home page, click on `Create new app`

2. Enter a name for your app and click `Create App`

3. Connect a channel to your app (ex: telegram)

4. You should now see a channel in `Overview` section of your app

### Connect Smooch to botpress

1. Go in the `Settings` section of your app

2. At the bottom you will find an `API Keys` menu. Create a new API key

3. You will need the `id` (the one that starts with app\_) and `secret` key to setup your bot

### Configure your bot

1. Edit `data/bots/YOUR_BOT_ID/config/channel-smooch.json` (or create it) and set

- enabled: Set to `true`
- keyId: Paste the `id` of your key from `Settings` section
- secret: Paste the `secret` of your key from `Settings` section

2. Restart Botpress
