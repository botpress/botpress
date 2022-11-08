## Requirements

Create a Twilio account and purchase a Twilio phone number

## Channel Configuration

### Account SID and Auth Token

1. Go to you Twilio [console dashboard](https://console.twilio.com/?frameUrl=/console)
1. Scroll down and copy your Account SID and Auth Token from the **Project Info** section and paste them in the **Account SID** and **Auth Token** channel configurations

### Save Configuration

Channel configuration is complete, you can now click **Save**

## Webhook Configuration

To receive messages from Twilio, you will need to setup a webhook

1. Click on **Explore Products** in the left pannel
1. Click on **Messaging**
1. Click on **Services** in the left pannel
1. Click on your service (if you haven't already created your service, create a messaging service and add your phone as a sender)
1. Click on **Sender Pool** in the left pannel
1. Click on your phone number
1. Scroll down the phone number settings page
1. Copy paste the webhook url provided in the channel configuration UI to the **A Message Comes In** field
