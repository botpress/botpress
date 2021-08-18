---
id: twilio
title: Twilio
---

### Prerequisite

- An HTTPS Endpoint to your bot

  - Set the externalUrl field in botpress.config.json
  - Create an HTTPS tunnel to your machine using Ngrok. Tutorial
  - Using Nginx and Let's Encrypt. Tutorial

- Create a Twilio account and create a phone number

### Steps

#### Get your API credentials

1. Go to you twilio console dashboard
2. Go to the settings tab
3. Scroll down and copy your Account SID and Auth Token from the LIVE credentials section

#### Configure your bot

1. Edit `data/bots/<YOUR_BOT_ID>/bot.config.json`. In the `messaging.channels.twilio` section write this configuration :

- enabled: Set to true
- accountSID: Paste your account SID
- authToken: Paste your auth token

  Your `bot.config.json` should look like this :

```json
{
  // ... other data
  "messaging": {
    "channels": {
      "twilio": {
        "enabled": true,
        "accountSID": "your_account_sid",
        "authToken": "your_auth_token"
      }
      // ... other channels can also be configured here
    }
  }
}
```

2. Restart Botpress
3. You should see your webhook endpoint in the console on startup

#### Configure webhook

1. Go to the phone numbers section
2. Click on your registered phone number
3. Scroll down to the messaging webhook section
4. Set it to `<EXTERNAL_URL>/api/v1/messaging/webhooks/<YOUR_BOT_ID/twilio`
