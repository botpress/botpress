---
id: supported-channels
title: Supported Channels
---

--------------------

In this section, you can find  all the supported channels. 

## Supported Channels

| Channel | Official Website |
| ------------- | ------------------- |
| [Botpress Webchat](/messaging-channels/botpress-webchat/website-embedding/) |           N/A        | 
| [Facebook Messenger](/messaging-channels/direct-integrations/facebook-messenger) | [Facebook for Developers website](https://developers.facebook.com/) |
| [Microsoft Teams](/messaging-channels/direct-integrations/microsoft-teams) | [Azure](https://docs.microsoft.com/en-us/azure/devops/?view=azure-devops) and [Teams](https://docs.microsoft.com/en-us/microsoftteams/) |
| [Slack](/messaging-channels/direct-integrations/slack) | [Slack - Apps Page](https://api.slack.com/apps) |
| [Telegram](/messaging-channels/direct-integrations/telegram) | [Telegram Developers website](https://core.telegram.org/bots) |
| [Twilio](/messaging-channels/broker-integrations/twilio) | [Twilio Docs](https://www.twilio.com/docs) |
| [Vonage](/messaging-channels/broker-integrations/vonage) | [Vonage - Start Coding](https://dashboard.nexmo.com/sign-up) |
| [Smooch](/messaging-channels/broker-integrations/smooch-sunshine-conversations) | [Sunshine Conversations - Smooch](https://www.zendesk.com/platform/conversations/) |


## FAQ

### How can I test a channel locally?

Some channels (e.g. Messenger) require to have a public secure url. When testing on locally, we recommend using services like [pagekite](https://pagekite.net/), [ngrok](https://ngrok.com) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

### Why are my images missing?

Assets are exposed using a configurable base path. Make sure the `EXTERNAL_URL` environment variable is set so that your assets are accessible from the outside.

You can set the environment variable in a `.env` file located in the same folder as the Botpress executable.

If you don't know anything about `.env` files, just create a new file named `.env` at the base of your project. Then add the following line to it:

```bash
EXTERNAL_URL=<public_url>
```

Replace `<public_url>` by your actual Botpress Server url.