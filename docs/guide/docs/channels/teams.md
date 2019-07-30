---
id: teams
title: Teams
---

## Requirements

Teams requires a Microsoft Azure account and Subscription. To test your bot, you will also need a microsoft Teams access.

## Note

If you are already familiar with Azure and/or botframework and you've succesfully deployed bots on MS Teams in the past then you can directly start by reading this [section](#setting-up-ms-teams-channel-from-an-already-configured-ms-bot-with-an-appid-and-password).

On the other hand, if you've never used Azure or botframework and you've never deployed a bot on MS Teams, you should start by reading this [section](#register-a-microsoft-bot-app-id-and-password).

## Register a microsoft bot, App Id and password

Because the botframework and Azure are not developped by Botpress, the following instructions might not be up to date. If ever you feel like these instructions are irrelevant, please reffer to the official [Microsoft bot framework documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/bots/bots-create) and try deploying one of the sample bots on the [Microsoft bot framework samples repo](https://github.com/microsoft/BotBuilder-Samples). Don't dig to far in their sdk as Botpress handle this part of the logic.

As already mentionned, if you achieved deploying a dummy bot on MS Teams in the past then you can skip this section and directly go to this [section](#setting-up-ms-teams-channel-from-an-already-configured-ms-bot-with-an-appid-and-password).

1. Sign up in [Microsoft Azure](https://azure.microsoft.com)

1. In the Azure portal, look for:

   > Home > App registrations

1. Click New registration and specify the name you wish for the registration. No other information is mandatory. Click register

1. In the Overview pannel, you see the Application (client) ID. This is the microsoft App Id. You have to note it down because it will be usefull later.

1. In the Certificates & secrets, click on New client secret, specify a description than click add. The secret value is a password also required later on. Note it down.

1. Navigate to the [botframework registration page](https://dev.botframework.com/bots/new) and enter all required information and register.

   Leave the Messaging endpoint temporarely empty as it currently unknown. The App Id is the one you registered previously on Azure.

1. Clicking register on the previous step should have navigated to another botframework user interface. In this web application, find channels and then enable Microsoft Teams.

1. Open MS Teams (either the web version or the desktop client), then start a new conversation. In the search bar, paste your microsoft App Id. You should see your registered bot.

1. Try talking to your bot. If you get a message saying that your bot has been disabled by administrator, you have to enable App sideloading in your microsoft admin portal. See this [article](https://docs.microsoft.com/en-us/microsoftteams/enable-features-office-365) for more details.

You can now continue to next [section](#setting-up-ms-teams-channel-from-an-already-configured-ms-bot-with-an-appid-and-password).

## Setting up MS Teams channel from an already configured MS bot with an appId and password

1. Register your bot with Microsoft services (Azure and/or botframework) and note down your MS appId and password. If you followed the previous [section](#register-a-microsoft-bot-app-id-and-password), this step should already be done.

1. Enable the "channel-teams" module in the botpress config file:

   > data/global/botpress.config.json

1. Create the following file:

   > data/bots/YOUR_BOT_ID/config/channel-teams.json

1. Write the following content in the file. You will use the appId and the secret that you've registered in Azure.

   ```
   {
     "enabled": true,
     "microsoftAppId": "YOUR APP ID",
     "microsoftAppPassword": "YOUR APP PW"
   }
   ```

1. Teams channel needs you to deploy your botpress server with a reachable https url. In the botpress config file (data/global/botpress.config.json), specify the external URL like this:

   ```
   "httpServer": {
       ...
       ...
       ...,
       "externalUrl": "https://YOUR_BASE_URL"
     },
   ```

   If don't have an https url but you wish to host a botpress instance locally and still be able to try out the Teams channel, you can use [ngrok](https://ngrok.com/).

   All you need is to download ngrok, launch it and pass it your botpress port as CLI parameter.

   On a unix system, if you run botpress on localhost:3000, you would start ngrok with the following command:

   > \> ./ngrok http 3000

   In the terminal you started ngrok in, you'll have an https url, you can copy and use as your external url.

1. In Microsoft services (either Azure or botframework) use the following messaging end point:

   > YOUR_BASE_URL/api/v1/bots/YOUR_BOT_ID/mod/channel-teams/api/messages

   In the previous [section](#register-a-microsoft-bot-app-id-and-password) this configuration was left volontarely blank. You can edit it in the [botframework web application](https://dev.botframework.com/bots/) in settings menu.

1. Deploy you botpress server and your bot should be good to go.

**_At any point, if you feel like your bot should be responding on Teams but you have no feedback, try to sign out of teams and then sign back in. It curiously solves many weird problems._**
