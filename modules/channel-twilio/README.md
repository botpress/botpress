# @botpress/channel-twilio

<img src="https://cdn.rawgit.com/botpress/botpress/7e007114/assets/supports_UMM.png" height="60px" />

Official Twilio (SMS/WhatsApp) connector module for [Botpress](http://github.com/botpress/botpress).

This module has been build to accelerate and facilitate development of SMS/WhatsApp bots.

## Configuration

There's 2 required configuration variables:

- `accountSID` or env `BP_MODULE_CHANNEL_TWILIO_ACCOUNTSID`
- `authToken` or env `BP_MODULE_CHANNEL_TWILIO_AUTHTOKEN`

You must set the SMS/WhatsApp webhook to `POST` on the Twilio dashboard and the url is the following:
`https://{hostname}/api/v1/bots/{BOT_ID}/mod/channel-twilio/webhook`

> **Note on webhook**
>
> Protocol must be https. We recommend you use a tool like ngrok or pagekite in dev.
