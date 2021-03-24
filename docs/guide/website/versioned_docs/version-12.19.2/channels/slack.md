---
id: version-12.19.2-slack
title: Slack
original_id: slack
---

## Requirements

### HTTPS Endpoint
To connect to Slack, an HTTPS endpoint is required. Set the `externalUrl` field in botpress.config.json. You can use the following methods to create this endpoint:

  - Create an HTTPS tunnel to your machine using Ngrok. This tutorial works on pretty much any Operating System. [**Tutorial**](https://api.slack.com/tutorials/tunneling-with-ngrok)
  - Using Nginx and Let's Encrypt. This tutorial is based on the Linux Ubuntu 16.04 Operating System. [**Tutorial**](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)
  - Use Serveo to create an HTTPS tunnel to your machine. [**Tutorial**](https://medium.com/automationmaster/how-to-forward-my-local-port-to-public-using-serveo-4979f352a3bf)  

> **⭐ Note**: To test on localhost, you can also use services like [pagekite](https://pagekite.net/) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

## Setup

### Create the app on Slack

1. Go to your [apps page](https://api.slack.com/apps)

2. Click on `Create new app` then give it a name

### Setup Callback on Slack

1. Open the page `Event Subscriptions`, then turn the switch to `On`

2. Set the request URL to: `<EXTERNAL_URL>/api/v1/bots/<YOUR_BOT_ID>/mod/channel-slack/events-callback`

- Replace EXTERNAL_URL by the value of `externalUrl` in your botpress.config.json
- Replace YOUR_BOT_ID with your bot ID

3. Under `Subscribe to bot events`, add `messages.im` and `messages.channels` (you can also add other types of messages if you want)

4. Open the page `Interactive Components`, then turn the switch to `On`

5. Set the request URL to: `HTTPS_ENDPOINT/api/v1/bots/YOUR_BOT/mod/channel-slack/bots/YOUR_BOT/events-callback`

- Replace EXTERNAL_URL by the value of `externalUrl` in your botpress.config.json
- Replace YOUR_BOT_ID with your bot ID

6. Open the page `OAuth & Permissions` and add `chat:write` under `Scopes`

7. Install the app by clicking the `Install App to Workspace` button

## Configuration

### Configure your bot

1. Edit `data/bots/YOUR_BOT_ID/config/channel-slack.json` (or create it) and set

- enabled: Set to `true`
- signingSecret: Take the value `Signing Secret` on the page **`Basic Information`** 
- useRTM: false (true if you have a legacy app)
- Copy the file `YOUR_BP_INSTALL/data/global/config/channel-slack.json` and paste it in `YOUR_BP_INSTALL/data/bots/YOUR_BOT/config/channel-slack.json`

2. Restart Botpress

3. Return to `data/bots/YOUR_BOT_ID/config/channel-slack.json` and set

- botToken: Take the value Bot User OAuth Access Token on the page OAuth & Permissions (client ID)

4. Restart Botpress
