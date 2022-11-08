## Requirements

### HTTPS Endpoint

To connect to Slack, an HTTPS endpoint is required. Set the `externalUrl` field in `botpress.config.json`. You can use the following methods to create this endpoint:

- Create an HTTPS tunnel to your machine using Ngrok. This tutorial works on pretty much any Operating System ([tutorial](https://api.slack.com/tutorials/tunneling-with-ngrok)).
- Using Nginx and Let's Encrypt. This tutorial is based on the Linux Ubuntu 16.04 Operating System ([tutorial](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)).
- Use Serveo to create an HTTPS tunnel to your machine ([tutorial](https://medium.com/automationmaster/how-to-forward-my-local-port-to-public-using-serveo-4979f352a3bf)).

:::note
To test on localhost, you can also use services like [pagekite](https://pagekite.net/) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.
:::

## Setup

### Create Your Bot

First, you need a bot in Botpress. Take note of your bot's ID.

### Connecting Your Bot to Slack

1. Go to your [apps page](https://api.slack.com/apps).

2. Click **Create new app**, select **From scratch** then give it a name. Remember your App's name, you'll need it in a few minutes.

3. Open the page **Features**, then select **Interactivity & Shortcuts** and turn the **Interactivity** switch to _On_.

4. Set the request URL to: `<EXTERNAL_URL>/api/v1/messaging/webhooks/<YOUR_BOT_ID>/slack/interactive`.

- Replace `EXTERNAL_URL` by the value of `externalUrl` in your `botpress.config.json`;
- Replace `YOUR_BOT_ID` with your bot ID.

5. Save your changes.

6. Open the page **Features**. Then, click **OAuth & Permissions** and add `chat:write` under the **Scope** > **Bot Token Scopes** section.


7. Open the page **Features**, then click **App Home** and under the **Show Tabs** section, check **Allow users to send Slash commands and messages from the messages tab**.

8. From the **Settings**, go to the **Basic Information**. Then, go to the **Install app** section, install the app by clicking the **Install to Workspace** button. On the next screen, click the **Allow** button.

9. In Botpress, edit `data/bots/<YOUR_BOT_ID>/bot.config.json`. In the `messaging.channels.slack` section write this configuration:

- `enabled`: set to `true`;
- `signingSecret`: take the value `Signing Secret` on the section `Basic Information` > `App Credentials`;
- `useRTM`: `false` (`true` if you have a legacy app);
- `botToken`: take the value `Bot User OAuth Token` on the section **OAuth & Permissions** > **OAuth Tokens for Your Workspace**.

  Your `bot.config.json` should look like this :

```json
{
  // ... other data
  "messaging": {
    "channels": {
      "slack": {
        "enabled": true,
        "signingSecret": "your_signing_secret",
        "useRTM": false,
        "botToken": "your_bot_token"
      }
      // ... other channels can also be configured here
    }
  }
}
```

10. Restart Botpress.

11. Back on the your Slack app's page, open the page **Features**. Then, click **Event Subscriptions** and turn the **Enable Events** switch to **On**.

12. Set the `Request URL` to: `<EXTERNAL_URL>/api/v1/messaging/webhooks/<YOUR_BOT_ID>/slack/events`.

- Replace `EXTERNAL_URL` by the value of `externalUrl` in your `botpress.config.json`;
- Replace `YOUR_BOT_ID` with your bot ID.

:::caution
If the slack endpoint is responding with `Cannot resolve challenge`. The configuration at step 9 is not set in the right place. The configuration need to be inside the **chatbot configuration**.
:::

13. Under **Subscribe to bot event**, add `message.im` and `message.channels` (you can also add other types of messages if you want).

14. Wait for the green `Verified` message to appear next to `Request URL`. Save your changes.

15. A yellow banner will be displayed at the top of the screen. Click the **reinstall your app** link. On the next screen, click the **Allow** button.

16. Quit the Slack app and re-open it.

17. In Slack, under the **Apps** section of the sidebar, click the **+ Add apps** button. In the search bar, type the name of your Slack App. Click on your Slack app in the search results. You can now chat with your Botpress bot in Slack.
