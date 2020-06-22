# @botpress/channel-twilio

<img src="https://cdn.rawgit.com/botpress/botpress/7e007114/assets/supports_UMM.png" height="60px" />

Official Twilio (SMS) connector module for [Botpress](http://github.com/botpress/botpress).

This module has been build to accelerate and facilitate development of SMS bots.

## Configuration

There's 3 required configuration variables:

- `accountSID` or env `TWILIO_SID`
- `authToken` or env `TWILIO_TOKEN`
- `fromNumber` or env `TWILIO_FROM`

and optionally:
- `messagingServiceSid` or env `TWILIO_MESSAGING_SERVICE`

You must set the SMS webhook to `POST` on the Twilio dashboard and the url is the following:
`https://{hostname}/api/botpress-twilio/webhook`

> **Note on webhook**
>
> Protocol must be https.  We recommend you use a tool like ngrok or pagekite in dev.
