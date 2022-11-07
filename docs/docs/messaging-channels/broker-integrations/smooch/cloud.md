## Requirements

You will need a Smooch app with a channel configured before connecting Smooch to Botpress

### Smooch App

1. On the Smooch [home page](https://app.smooch.io/), click on **Create new app.**
1. Enter a name for your app and click **Create App**
1. Connect a channel to your app (Telegram, Whatsapp, or any other listed channel)
1. You should see a channel in the **Overview** section of your app

## Configuration

### App Id

The smooch channel needs the app id to identify the smooch app when making API calls

1. Go to the **Settings** section of your app
1. You should see an **App Id** section if you scroll down. Copy paste this value to the **App Id** channel configuration

### Key Id and Key Secret

The key id and secret are needed to authenticate API calls to Smooch

1. At the bottom of to the **Settings** section of your app, click **Generate API key**
1. Copy paste the id (the one that starts with `app_`) in the **Key Id** channel configuration
1. Copy paste the secret in the **Key Secret** configuration

### Webhook Secret

The webhook secret is needed to validate webhooks requests. You get a webhook secret for each webhook integration you create

1. Go to the **Integration** section of your app
1. In the **API & Webhooks** section, click on **Webhooks**
1. Click **Connect**, then **Create a webhook**
1. Copy paste the webhook url provided in the UI
1. Select `v2` as your webhook version
1. Select **Conversation message** and **Postbacks** in the basic triggers
1. Click **Create Webhook**. You will see the webhook you created in the table, and the secret in the last column
1. Copy paste the webhook secret in the **Webhook Secret** channel configuration

### Save Configuration

Channel configuration is complete, you can now click **Save**
