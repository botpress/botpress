## Requirements {#cloud}

### Configure Microsoft Account

Your Microsoft Account should have access to Azure and Teams. You can check out the [Azure](https://docs.microsoft.com/en-us/azure/devops/?view=azure-devops) and [Teams](https://docs.microsoft.com/en-us/microsoftteams/) documentation for information on how to make these connections

## Channel Configuration

## Register App

1. In the Azure portal, open the [App registrations](https://portal.azure.com#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) page
1. Click **New registration**, then choose a name for your application
1. In the section **Supported account types**, choose **Accounts in any organizational directory and personal Microsoft accounts**, then click **Register**
1. Copy paste the value of `Application (client) ID` to the **App Id** channel configuration

## App Password

1. Click **Certificates & secrets**, then click **New client secret**, then fill in the required fields
1. Copy paste the the value in the **Value** column to the **App Secret** channel configuration

### Save Configuration

Channel configuration is complete, you can now click **Save**

## Create Your Bot

1. Navigate to the [Bot Framework Registration Page](https://dev.botframework.com/bots/new)
1. Fill the **Display name** and **Bot handle** fields with whatever value
1. Copy paste you **App Id** to the app id field
1. Copy paste the webhook url provided in the channel configuration UI to the **Messaging endpoint** field
1. Click **Register**
1. On the next page (**Connect to channels**), under the section, **Add a featured channel**, click **Configure Microsoft Teams Channel**, then click **Save**
