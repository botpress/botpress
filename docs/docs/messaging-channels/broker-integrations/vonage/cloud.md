# Vonage

## Requirements

### Create Vonage Application

You will need a Vonage Account and a Vonage Application to connect Vonage to Botpress

- [Create a Vonage Account](https://dashboard.nexmo.com/sign-up)
- [Create a Vonage Application](https://dashboard.nexmo.com/applications/new)

## Channel Configuration

### API credentials

1. Go to your [API Settings](https://dashboard.nexmo.com/settings).
1. Copy paste the API key to the **API Key** channel configuration
1. Copy paste the API secret from the **Account credentials** section to the **API Secret** channel configuration
1. Copy paste the signature secret from the **Signed webhooks** section to the **Signature Secret** channel configuration

### Save Configuration

Channel configuration is complete, you can now click **Save**

## Webhook Configuration

### Sandbox

You can use the Vonage sandbox to test you channel with Whatsapp

1. Check the **Use Testing API** box in your channel configuration
1. Go to your [Sandbox Settings](https://dashboard.nexmo.com/messages/sandbox)
1. Copy paste the webhook url provided in the channel configuration UI to the **Inbound** and **Status** fields in the **Webhooks** section
