---
id: slack
title: Slack
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

2. Set the request URL to: `<EXTERNAL_URL>/api/v1/messaging/webhooks/<YOUR_BOT_ID/slack/events`

- Replace EXTERNAL_URL by the value of `externalUrl` in your botpress.config.json
- Replace YOUR_BOT_ID with your bot ID

3. Under `Subscribe to bot events`, add `message.im` and `message.channels` (you can also add other types of messages if you want)

4. Save your changes

5. Open the page `Interactivity & Shortcuts`, then turn the switch to `On`

6. Set the request URL to: `<EXTERNAL_URL>/api/v1/messaging/webhooks/<YOUR_BOT_ID/slack/interactive`

- Replace EXTERNAL_URL by the value of `externalUrl` in your botpress.config.json
- Replace YOUR_BOT_ID with your bot ID

7. Save your changes

8. Open the page `OAuth & Permissions` and add `chat:write` under `Scopes`

9. Open the page `App Home` and check `Allow users to send Slash commands and messages from the messages tab` under **Show Tabs** > **Messages Tab** at the bottom of the page.

10. Install the app by clicking the `Install App to Workspace` button

> **⭐ Note**: You might have to quit the Slack app and re-open it before you can converse with your bot.

## Configuration

### Configure your bot

1. Edit `data/bots/<YOUR_BOT_ID>/bot.config.json`. In the `messaging.channels.slack` section write this configuration :

- enabled: Set to `true`
- signingSecret: Take the value `Signing Secret` on the page **`Basic Information`**
- useRTM: false (true if you have a legacy app)
- botToken: Take the value Bot User OAuth Access Token on the page OAuth & Permissions (client ID)

  Your `bot.config.json` should look like this :

```json
{
  // ... other data
  "messaging": {
    "channels": {
      "slack": {
        "enabled": true,
        "signingSecret": "your_signing_secret",
        "useRTM": false,
        "botToken": "your_bot_token"
      }
      // ... other channels can also be configured here
    }
  }
}
```

2. Restart Botpress
