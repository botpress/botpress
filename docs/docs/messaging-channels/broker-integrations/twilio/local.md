## Prerequisite

- An HTTPS Endpoint to your bot

  - Set the externalUrl field in `botpress.config.json`.
  - Create an HTTPS tunnel to your machine using Ngrok.
  - Using Nginx and Let's Encrypt.

- Create a Twilio account and create a phone number

### Get your API Credentials

1. Go to you Twilio console dashboard.
2. Go to the settings tab.
3. Scroll down and copy your Account SID and Auth Token from the LIVE credentials section.

### Configure Your Bot

1. Edit `data/bots/<YOUR_BOT_ID>/bot.config.json`. In the `messaging.channels.twilio` section write this configuration:

- `enabled`: set to `true`
- `accountSID`: paste your account SID
- `authToken`: paste your auth token

  Your `bot.config.json` should look like this:

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

2. Restart Botpress.
3. You should see your webhook endpoint in the console on startup.

### Configure Webhook

1. Go to the phone numbers section and click **Manage**, then **Active Numbers**.
2. Click on your registered phone number. If you don't have one, click **Buy a new number**.
3. Scroll down to the messaging webhook section.
4. Set 'A Message Comes In' to `<EXTERNAL_URL>/api/v1/messaging/webhooks/<YOUR_BOT_ID/twilio`.

### Setting up WhatsApp sandbox
1. Go to WhatsApp sandbox settings under messaging section and add the above twilio url in 'A Message Comes In"
![twilio-botpress](https://user-images.githubusercontent.com/88099328/196814357-cf581d65-5c08-49dc-aa8b-2c4d9f5b9e1d.png)



