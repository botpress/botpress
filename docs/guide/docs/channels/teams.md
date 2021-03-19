---
id: teams
title: Microsoft Teams
---

## Requirements

### Configure Microsoft Account
Your Microsoft Account should have access to Azure and Teams. You can check out the [Azure](https://docs.microsoft.com/en-us/azure/devops/?view=azure-devops) and [Teams](https://docs.microsoft.com/en-us/microsoftteams/) documentation for information on how to make these connections.

### Enable the Teams Channel

You can do this by opening the file `data/global/botpress.config.json` in a text editor and setting the value to `true` as below. You can also access this file from the Code Editor in the Botpress Studio user interface.

```js
"modules": [
  ...
    {
      "location": "MODULES_ROOT/channel-teams",
      "enabled": true
    },
```
### Configure HTTPS Endpoint

To connect to Microsoft Teams, an HTTPS endpoint is required. This is set in the `externalUrl` field in botpress.config.json. You can use the following methods to create this endpoint:

  - Create an HTTPS tunnel to your machine using Ngrok. This tutorial works on pretty much any Operating System. [**Tutorial**](https://api.slack.com/tutorials/tunneling-with-ngrok)
  - Using Nginx and Let's Encrypt. This tutorial is based on the Linux Ubuntu 16.04 Operating System. [**Tutorial**](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)
  - Use Serveo to create an HTTPS tunnel to your machine. [**Tutorial**](https://medium.com/automationmaster/how-to-forward-my-local-port-to-public-using-serveo-4979f352a3bf)  

> **⭐ Note**: To test on localhost, you can also use services like [pagekite](https://pagekite.net/) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

### Before getting started...

Since the framework V4 is still in active development, some of these instructions may be slightly different. If you ever get stuck, check the [Official Bot Framework documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/bots/bots-create).

## Setup

These instructions will guide you through any steps required to be up and running with that channel.

### Create application & generate password

1. Log on to your account on [Microsoft Azure](https://azure.microsoft.com)

2. In the Azure portal, open the [App registrations](https://portal.azure.com#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) page.

3. Click on `New registration`, then choose a name for your application.

4. In the section `Supported account types`, choose `Accounts in any organizational directory and personal Microsoft accounts`, then click on `Register`.

5. Write down the value of `Application (client) ID`; we'll need it later for the channel configuration.

6. Click on `Certificates & secrets`, then click on `New client secret`, then fill in the required fields.

7. Write down the value of the generated secret, **you can't access it later**

### Create your bot

1. Navigate to the [Bot Framework Registration Page](https://dev.botframework.com/bots/new) and fill in the required information:

- Display name
- Bot handle
- The Microsoft App ID (that we generated in step 1)
- Messaging endpoint (keep it blank for now - more on that later)

You can also fill the other fields as you wish, but they will not impact Botpress.

2. Click on `Register`

3. On the next page (`Connect to channels`), under the section, `Add a featured channel`, click on `Configure Microsoft Teams Channel`, then click on `Save`. No other configuration is needed at this point.

## Configuration


### Configure channel on Botpress

1. Open MS Teams (either the web version or the desktop client), then start a new conversation. In the search bar, paste your Microsoft App Id. You should see your registered bot.

2. Try talking to your bot. If you get a message saying that an administrator has disabled your bot, you must enable App sideloading in your Microsoft admin portal. See this [article](https://docs.microsoft.com/en-us/microsoftteams/enable-features-office-365) for more details.

You can now continue to next [section](#setting-up-ms-teams-channel-from-an-already-configured-ms-bot-with-an-appid-and-password).

3. Copy the file `data/global/config/channel-teams.json` to your bot-specific configuration folder:

   > data/bots/YOUR_BOT_ID/config/channel-teams.json

4. Open the file, then set `enabled` to `true`, and set your `appId` and `appPassword` created in step 1

### Final configuration

1. Start Botpress, then you should see your Messaging Endpoint in the startup logs.

2. Open the [Bot Framework](https://dev.botframework.com/bots) page, then click on the name of your bot.

3. Click on the `Settings` tab, then scroll down to `Messaging endpoint`.

4. Set the value of the endpoint that was displayed in the logs. If it is missing, it should looks like that:

> YOUR_BASE_URL/api/v1/bots/YOUR_BOT_ID/mod/channel-teams/api/messages
