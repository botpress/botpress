# Freshchat HITL

## Description

This integration makes Freshchat available as a channel for Human-in-the-loop on Botpress

## Configuration

You will need to have access to the **Admin Settings** (https://YOUR_COMPANY.freshworks.com/crm/sales/settings) page from Freshchat to configure this integration

### Configuration fields on Botpress

- **Topic name**: Name from the default topic that is going to be used for HITL, found at **Admin Settings** -> **Channels** -> **Web Chat** -> **Bot Mapping**

- **Api Key**: API key from **Freshchat**, get yours at https://YOUR_COMPANY.freshworks.com/crm/sales/personal-settings/api-settings (example: **eyJgtWQiOiJjdHK0b20tb2G1...**)

- **Domain Name**: Your Freshchat domain from the chat URL, get at https://YOUR_COMPANY.freshworks.com/crm/sales/personal-settings/api-settings (example: **yourcompany-5b321a95b1dfee217185497**)

### Configuring the webhook

You also will need to copy the webhook URL and set it on Freshchat

1. Copy the webhook URL (URL above the configuration fields on Botpress, example: https://webhook.botpress.cloud/c59a20b8-48t7-407f-82e8-81a66e9e556a)
2. Go to https://YOUR_COMPANY.freshworks.com/crm/sales/settings (**Admin Settings**)
3. Click on **Marketplace and Integrations**
4. Click on **Conversation Webhooks**
5. Paste the copied webhook URL on the **Webhook** input field
6. Click on **Save**

After setting both the Configuration Fields on Botpress and Webhook on Freshchat, you can click on **Save Configuration** on Botpress.

## Using the Integration

This Integration uses the **HITL Interface**, so you can use the [HITL Agent](https://botpress.com/docs/hitl-agent) to set your bot for **HITL**

[Youtube tutorial](https://www.youtube.com/watch?v=AAkARl8_cTo)
