---
id: version-12.1.0-teams
title: Microsoft Teams
original_id: teams
---

## Requirements

- Microsoft account with access to Azure
- Microsoft account with access to Teams
- [Enable the `channel-teams` module](../main/module#enabling-or-disabling-modules)
- Configured a valid **HTTPS** external url ([configuration](../advanced/configuration#exposing-your-bot-on-the-internet))

## Before getting started...

Since the framework V4 is still in active development, some of these instructions may be a little bit different. If you ever get stuck, have a look at the [Official Bot Framework documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/bots/bots-create).

## Step by step instructions

These instructions will guide you through any steps required to be up and running with that channel.

### 1. Create a new application & generate a password

1. Log on to your account on [Microsoft Azure](https://azure.microsoft.com)

1. In the Azure portal, open the [App registrations](https://portal.azure.com#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) page.

1. Click on `New registration`, then choose a name for your application.

1. In the section `Supported account types`, choose `Accounts in any organizational directory and personal Microsoft accounts`, then click on `Register`.

1. Write down the value of `Application (client) ID`, we'll need it later for the channel configuration.

1. Click on `Certificates & secrets`, then click on `New client secret`, then fill in the required fields.

1. Write down the value of the generated secret, **you can't access it later**

### 2. Create your bot

1. Navigate to the [Bot Framework Registration Page](https://dev.botframework.com/bots/new) and fill the required information:

- Display name
- Bot handle
- The Microsoft App ID (that we generated in step 1)
- Messaging endpoint (keep it blank for now - more on that later)

You can also fill the other fields as you wish, but they will not impact Botpress.

1. Click on `Register`

1. On the next page (`Connect to channels`), under the section `Add a featured channel`, click on `Configure Microsoft Teams Channel`, then click on `Save`. No other configuration is needed at this point.

### 3. Configure the channel on Botpress

1. Open MS Teams (either the web version or the desktop client), then start a new conversation. In the search bar, paste your microsoft App Id. You should see your registered bot.

1. Try talking to your bot. If you get a message saying that your bot has been disabled by administrator, you have to enable App sideloading in your microsoft admin portal. See this [article](https://docs.microsoft.com/en-us/microsoftteams/enable-features-office-365) for more details.

You can now continue to next [section](#setting-up-ms-teams-channel-from-an-already-configured-ms-bot-with-an-appid-and-password).

1. Copy the file `data/global/config/channel-teams.json` to your bot-specific configuration folder:

   > data/bots/YOUR_BOT_ID/config/channel-teams.json

1. Open the file, then set `enabled` to `true`, and set your `appId` and `appPassword` created in step 1

### 4. Final configuration

1. Start Botpress, then you should see your Messaging Endpoint in the startup logs.

1. Open the [Bot Framework](https://dev.botframework.com/bots) page, then click on the name of your bot.

1. Click on the `Settings` tab, then scroll down to `Messaging endpoint`.

1. Set the value of the endpoint that was displayed in the logs. If it is missing, it should looks like that:

> YOUR_BASE_URL/api/v1/bots/YOUR_BOT_ID/mod/channel-teams/api/messages
