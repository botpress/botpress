## Slack Channel

### Prerequisite

- Set the `externalUrl` field in botpress.config.json

### Steps

1. Create a new app on Slack

2. Edit `data/bots/YOUR_BOT_ID/config/channel-slack.json` (or create it) and set

- enabled: Set to `true`
- signingSecret: Signing Secret on page Basic Information
- botToken: Take the value `Bot User OAuth Access Token` on the page `OAuth & Permissions`

3. Enable Interactive Components

4. Set the request URL to: `EXTERNAL_URL/api/v1/bots/YOUR_BOT_ID/mod/channel-slack/callback`

- Replace EXTERNAL_URL by the value of `externalUrl` in your botpress.config.json
- Replace YOUR_BOT_ID by your bot ID

5. Restart Botpress
