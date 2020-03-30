---
id: slack
title: Slack
---

## Requirements

- Set the `externalUrl` field in botpress.config.json

## Steps

### Create the app on Slack

1. On slack, go to `Administration`, then `Manage apps`

2. In the upper right corner, click on `Build`, then `Your apps` (also in the corner)

3. Click on `Create new app` then give it a name

4. Open the page `Bot Users`, then choose a display name and a username for your bot. Save changes.

5. Open the page `OAuth Tokens & Redirect URLs`, then add the app to your workspace

### Configure your bot

1. Edit `data/bots/YOUR_BOT_ID/config/channel-slack.json` (or create it) and set

- enabled: Set to `true`
- signingSecret: Take the value `Signing Secret` on the page **`Basic Information`**
- botToken: Take the value `Bot User OAuth Access Token` on the page **`OAuth & Permissions`**

2. Restart Botpress

![botToken](assets/slack-botToken.png)
![signingSecret](assets/slack-secret.png)

### Configure Callback on Slack

These steps are required so users can click on quick reply buttons, select dropdown options or any other interactive method.

1. Open the page `Interactive Components`, then turn the switch to `On`

2. Set the request URL to: `EXTERNAL_URL/api/v1/bots/YOUR_BOT_ID/mod/channel-slack/bots/YOUR_BOT_ID/callback`

- Replace EXTERNAL_URL by the value of `externalUrl` in your botpress.config.json
- Replace YOUR_BOT_ID by your bot ID
