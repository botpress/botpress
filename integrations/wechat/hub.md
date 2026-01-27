# WeChat Official Account Integration

Connect your Botpress chatbot to WeChat Official Accounts and engage with your Chinese audience in real-time.

## Prerequisites

Before you begin, you need:

1. **WeChat Official Account** (Service Account or Subscription Account)
   - Create one at: https://mp.weixin.qq.com/
2. **App ID and App Secret** from your WeChat Official Account settings
3. **Server Configuration** enabled in WeChat Admin Panel

## Configuration

### 1. Get Your WeChat Credentials

In your WeChat Official Account admin panel:

1. Go to **Settings & Development** > **Basic Configuration**
2. Copy your **AppID** and **AppSecret**
3. Generate a **Token** (any random string, you'll use this in both WeChat and Botpress)

### 2. Install the Integration in Botpress

1. Install this integration in your Botpress workspace
2. Configure with your credentials:
   - **WeChat Token**: The token you generated (used for signature verification)
   - **App ID**: Your WeChat Official Account AppID
   - **App Secret**: Your WeChat Official Account AppSecret

### 3. Configure WeChat Webhook

In your WeChat Official Account admin panel:

1. Go to **Settings & Development** > **Basic Configuration**
2. Click **Enable** Server Configuration
3. Set the **URL** to https://wechat.botpress.tech/{your Botpress webhook ID}, where the webhook ID is the string provided after installing the integration.
4. Set the **Token** to the same token you used in Botpress configuration
5. Click **Submit** - WeChat will verify your server

## Supported Features

### Receiving Messages

Your bot can receive the following message types from WeChat users:

- **Text messages** - Plain text messages
- **Image messages** - Photos sent by users (PicUrl provided)
- **Video messages** - Video content
- **Link messages** - Shared links with title, description, and URL

### Sending Messages

Your bot can send the following message types to WeChat users:

- **Text messages** - Up to 4,096 characters
- **Image messages** - Images (automatically uploaded to WeChat)

## Limitations

### WeChat Platform Limitations

- **Official Account Required**: Personal WeChat accounts cannot be used
- **Customer Service API Window**: Can only send messages to users who have messaged you within the last 48 hours
- **Message Length**: Text messages limited to 4,096 characters
- **No Proactive Messaging**: Cannot initiate conversations; users must message first

## Troubleshooting

### Webhook Verification Fails

- Ensure your **Token** matches exactly in both Botpress and WeChat
- Check that your webhook URL is publicly accessible
- Verify the URL ends with your integration webhook path

### Messages Not Appearing in Botpress

- Check your WeChat Admin Panel logs for delivery errors
- Verify your **App ID** and **App Secret** are correct
- Ensure Server Configuration is enabled in WeChat

### Bot Not Responding

- Check Botpress logs for errors
- Verify the user messaged you within the last 48 hours
- Ensure your bot flow is properly configured

## Additional Resources

- [WeChat Official Account Platform Docs](https://developers.weixin.qq.com/doc/offiaccount/en/Getting_Started/Overview.html)
- [WeChat API Reference](https://developers.weixin.qq.com/doc/offiaccount/en/Message_Management/Receiving_standard_messages.html)
- [Botpress Documentation](https://botpress.com/docs)
