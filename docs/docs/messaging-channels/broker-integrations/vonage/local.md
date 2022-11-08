## Prerequisite

- An HTTPS Endpoint to your bot

  - Set the externalUrl field in `botpress.config.json`
  - Create an HTTPS tunnel to your machine using Ngrok. Tutorial
  - Using Nginx and Let's Encrypt. Tutorial

- [Create a Vonage Account](https://dashboard.nexmo.com/sign-up)
- [Create a Vonage Application](https://dashboard.nexmo.com/applications/new)

  - Give it a name
  - Click **Generate new application**

### Get your API credentials

1. Go to your [Account Settings](https://dashboard.nexmo.com/settings).
2. Scroll down and copy your API key, API secret and Signature secret from the LIVE credentials section.
3. In this page, under `SMS Settings`, make sure SMS Api is selected. 
4. Under `Signature method method`, select MD5 HASH.
5. Go to your applications and select your newly created application (https://dashboard.nexmo.com/applications/).
6. Copy the Application ID.

### Configure your bot

1. Edit `data/bots/<YOUR_BOT_ID>/bot.config.json`. In the `messaging.channels.vonage` section write this configuration:

- `enabled`: set to `true`;
- `apiKey`: paste your API key;
- `apiSecret`: paste your API Secret;
- `signatureSecret`: paste your Signature secret;
- `useTestingApi (optional)`: set to `true` if you want to use the `Sandbox` instead of the `Live` version of Vonage API (see [Setup a Messages Sandbox](#Setup%20a%20Messages%20Sandbox)).

  Your `bot.config.json` should look like this:

```json
{
  // ... other data
  "messaging": {
    "channels": {
      "vonage": {
        "enabled": true,
        "apiKey": "your_api_key",
        "apiSecret": "your_api_secret",
        "signatureSecret": "your_signature_secret",
        "useTestingApi": false
      }
      // ... other channels can also be configured here
    }
  }
}
```

2. Restart Botpress.
3. You should see your webhook endpoint in the console on startup.

### Setup a Messages Sandbox

When wanting to test the integration with Vonage and WhatsApp, you need to enable a Sandbox where you can send test messages.

1. In the left end side menu of [Vonage Dashboard](https://dashboard.nexmo.com/) select **Messages and Dispatch (beta)**
1. Click **Sandbox**.
1. Click the channel you want to setup and follow the instructions detailed on the page.
1. Under `Webhooks`, type the following URLs:

   _Inbound:_ `<EXTERNAL_URL>/api/v1/messaging/webhooks/v1/<YOUR_BOT_ID>/vonage`

   _Status:_ `<EXTERNAL_URL>/api/v1/messaging/webhooks/v1/<YOUR_BOT_ID>/vonage`

## File Reception

Vonage currently supports receiving `image` , `audio`, `video`, `file` , and `location`.

:::note
Please, keep in mind that the links coming from the Vonage API are only valid for 10 minutes.
:::

An action (Storage - Store File Locally) is available in order to store the file locally.
