# @botpress/channel-twilio

<img src="https://cdn.rawgit.com/botpress/botpress/7e007114/assets/supports_UMM.png" height="60px" />

Official Twilio (SMS) connector module for [Botpress](http://github.com/botpress/botpress).

This module has been build to accelerate and facilitate development of SMS bots.

## Sending Text
##### `content.yml`

```yaml
welcome:
  - Hello, world!
  - This is a message on Twilio!
  - text: this works too!
  - |
    This is a multi-line
    message :).
```

To send a message only on Twilio (in case of multi-messenger bots):

```yaml
welcome:
  - platform: twilio
    text: Hello
```

## Configuration

There's 3 required configuration variables:

- `accountSID` or env `TWILIO_SID`
- `authToken` or env `TWILIO_TOKEN`

and one of the two:
- `fromNumber` or env `TWILIO_FROM`
- `messagingServiceSid` or env `TWILIO_MESSAGING_SERVICE`

You must set the SMS webhook to `POST` on the Twilio dashboard and the url is the following:
`https://{hostname}/api/botpress-twilio/webhook`

> **Note on webhook**
>
> Protocol must be https.
