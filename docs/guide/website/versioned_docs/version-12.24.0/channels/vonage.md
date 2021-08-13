---
id: version-12.24.0-vonage
title: Vonage
original_id: vonage
---

> **⭐ Note**: Currently, only WhatsApp is supported on this channel.

### Prerequisite

- An HTTPS Endpoint to your bot

  - Set the externalUrl field in botpress.config.json
  - Create an HTTPS tunnel to your machine using Ngrok. Tutorial
  - Using Nginx and Let's Encrypt. Tutorial

- [Create a Vonage Account](https://dashboard.nexmo.com/sign-up)
- [Create a Vonage Application](https://dashboard.nexmo.com/applications/new)
  - Give it a name
  - Under _Authentication_, click _Generate public and private key_ (this will download a file called `private.key`. You will need this file later on.)
  - Click _Generate new application_

### Steps

#### Get your API credentials

1. Go to your [Account Settings](https://dashboard.nexmo.com/settings)
2. Scroll down and copy your API key, API secret and Signature secret from the LIVE credentials section
3. Go to your applications and select your newly created application (https://dashboard.nexmo.com/applications/)
4. Copy the Application ID

#### Configure your bot

1. Edit `data/bots/<YOUR_BOT_ID>/bot.config.json`. In the `messaging.channels.vonage` section write this configuration :

- `enabled`: Set to true
- `apiKey`: Paste your API key.
- `apiSecret`: Paste your API Secret.
- `signatureSecret`: Paste your Signature secret.
- `applicationId`: Paste your Application ID.
- `privateKey`: Paste the content of the `private.key` file that was generated when you created your Vonage Application. **_Note: You must replace all line breaks with the character `\n`_**.
- `useTestingApi (optional)`: Set to `true` if you want to use the _Sandbox_ instead of the _Live_ version of Vonage API (see [Setup a Messages Sandbox](#Setup%20a%20Messages%20Sandbox)).

  Your `bot.config.json` should look like this :

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
        "applicationId": "your_application_id",
        "privateKey": "your_private_key",
        "useTestingApi": false
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
4. Set it to `<EXTERNAL_URL>/api/v1/messaging/webhooks/<YOUR_BOT_ID/vonage`

#### Setup a Messages Sandbox

When wanting to test the integration with Vonage and WhatsApp, you need to enable a Sandbox where you can send test messages.

1. In the left end side menu of [Vonage Dashboard](https://dashboard.nexmo.com/) select _Messages and Dispatch (beta)_ -> _Sandbox_
1. Click on the channel you want to setup and follow the instructions detailed on the page.
1. Under `Webhooks`, type the same URLs as you find in your application configuration.

## File Reception

Vonage currently supports receiving `image` , `audio`, `video`, `file` , and `location`. **Please, keep in mind that the links coming from the Vonage API are only valid for 10 minutes**. An action (Storage - Store File Locally) is available in order to store the file locally.
