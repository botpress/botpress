---
id: version-12.8.0-slack
title: Slack
original_id: slack
---

## Requirements

- Set the `externalUrl` field in botpress.config.json

## Steps

### Create the app on Slack

1. Go to your [apps page](https://api.slack.com/apps)

2. Click on `Create new app` then give it a name

### Configure your bot

1. Edit `data/bots/YOUR_BOT_ID/config/channel-slack.json` (or create it) and set

- enabled: Set to `true`
- signingSecret: Take the value `Signing Secret` on the page **`Basic Information`**
- useRTM: false (true if you have a legacy app)

2. Restart Botpress

### Configure Callback on Slack

1. Open the page `Event Subscriptions`, then turn the switch to `On`

2. Set the request URL to: `EXTERNAL_URL/api/v1/bots/YOUR_BOT_ID/mod/channel-slack/events-callback`

- Replace EXTERNAL_URL by the value of `externalUrl` in your botpress.config.json
- Replace YOUR_BOT_ID by your bot ID

3. Under `Subscribe to bot events` add `messages.im` and `messages.channels` (you can also add other types of messages if you want)

4. Open the page `Interactive Components`, then turn the switch to `On`

5. Set the request URL to: `EXTERNAL_URL/api/v1/bots/YOUR_BOT_ID/mod/channel-slack/bots/YOUR_BOT_ID/callback`

- Replace EXTERNAL_URL by the value of `externalUrl` in your botpress.config.json
- Replace YOUR_BOT_ID by your bot ID

6. Open the page `OAuth & Permissions` and add `chat:write` under `Scopes`

7. Install the app by clicking the `Install App to Workspace` button

### Finish configuring your bot

1. Return to `data/bots/YOUR_BOT_ID/config/channel-slack.json` and set

- botToken: Take the value Bot User OAuth Access Token on the page OAuth & Permissions

2. Restart Botpress
