## Requirements

You will need a Facebook app and a Facebook page to connect you bot to messenger

### Create a Facebook App

To create a Facebook App, log in to your Facebook account and go to the [Facebook for Developers website](https://developers.facebook.com/). Select **My Apps** from the top menu, and create a new app. For more details and assistance, visit the [Facebook developer documentation](https://developers.facebook.com/docs/development)

### Create a Facebook Page

If you do not already have a Facebook page you will need to create one. [You can find details on how to create a new Facebook page here](https://www.facebook.com/pages/creation/)

To link your chatbot to a pre-existing page, you must have an administrator or developer role

## Channel Configuration

### API version

The messenger channel is made to interact with version 12.0 or higher of the Messenger API. It is not the default version so it must be changed in your app's settings

1. Go to your Facebook App
1. In the left sidebar, expand the **Settings** menu and select **Advanced**
1. In the **Upgrade API version** section, select v12.0 or higher as the API version
1. Click on **Save changes**

### Add Messenger Product

Messenger is not added by default in your Facebook App, so it must be added manually

1. In the left sidebar, click on **Add Product**
1. In the Facebook Messenger section click **Set Up**

### App Id and Secret

The app id and secret are used to validate webhook requests

1. In the left sidebar, expand the **Settings** menu and select **Basic**. Here you can find the App ID and App Secret
1. Click on the **Show** button in the **App Secret** text box. Copy the App Id and App Secret to your channel configuration

### Page Id and Access Token

The page id and access token are used to send messages to the Messenger API

1. In the left sidebar, expand the **Messenger** menu and select **Settings**
1. In the **Access Tokens** section, click **Add or remove Pages** and add you facebook page
1. Copy the number under you page name and paste it in you **Page Id** channel configuration
1. Click on **Generate token**. Copy this token and paste it in the **Access Token** channel configuration

### Verify Token

The verify token is used by facebook to verify that you are the real owner of the provided webhook

You can generate any random alphanumerical string for this configuration. Paste it in your **Verify Token** channel configuration

### Save Configuration

Channel configuration is complete, you can now click **Save**. It is important you save your configuration before configuring the webhook, otherwise Messenger will be unable to validate the webhook url

## Webhook Configuration

To receive messages from Messenger, you will need to setup a webhook

1. Go to your Facebook App.
1. In the left sidebar, expand the **Messenger** menu and select **Settings**
1. In the **Webhooks** section, click **Add Callback URL**
1. Copy paste the webhook url provided in the channel configuration UI
1. Copy paste the verify token you generated earlier
1. Click on **Verify and save**. Make sure your channel configuration was saved before doing this step, otherwise the webhook validation will fail
1. Click on **Add subscriptions** and add `messages` and `messaging_postbacks` to your webhook
