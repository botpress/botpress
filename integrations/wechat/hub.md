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
3. Set the **URL** to your Botpress webhook URL (provided after integration installation)
4. Set the **Token** to the same token you used in Botpress configuration
5. Select **Message Encryption Method**: Plain Text (recommended for testing)
6. Click **Submit** - WeChat will verify your server

## Supported Features

### Receiving Messages

Your bot can receive the following message types from WeChat users:

- **Text messages** - Plain text messages
- **Image messages** - Photos sent by users (PicUrl provided)
- **Voice messages** - Audio messages with optional speech recognition
- **Video messages** - Video content
- **Location messages** - User location with latitude, longitude, and label
- **Link messages** - Shared links with title, description, and URL

### Sending Messages

Your bot can send the following message types to WeChat users:

- **Text messages** - Up to 4,096 characters
- **Image messages** - Images (automatically uploaded to WeChat)
- **Audio/Voice messages** - Audio files (automatically uploaded to WeChat)
- **Video messages** - Video files (automatically uploaded to WeChat)
- **Card messages** - Rich cards with title, image, and link (sent as WeChat News)
- **Carousel messages** - Multiple cards (up to 8 articles)
- **Choice/Dropdown messages** - Formatted as text with numbered options

## How It Works

1. **User sends message** → WeChat forwards it to your Botpress webhook
2. **Botpress processes** → Your bot logic analyzes and generates response
3. **Bot sends reply** → Via WeChat Customer Service API (asynchronous)

This integration uses WeChat's **Customer Service API** which allows:

- ✅ Sending messages anytime (not limited to 5-second window)
- ✅ Multiple messages per user interaction
- ✅ Asynchronous bot processing (perfect for AI/LLM responses)

## Limitations

### WeChat Platform Limitations

- **Official Account Required**: Personal WeChat accounts cannot be used
- **Customer Service API Window**: Can only send messages to users who have messaged you within the last 48 hours
- **Message Frequency**: Rate limits apply (typically 100 messages/second)
- **Media Upload**: Images/videos/audio must be uploaded to WeChat servers first (handled automatically)
- **Message Length**: Text messages limited to 4,096 characters
- **Carousel Limit**: Maximum 8 articles per carousel message

### Integration Limitations

- **No Proactive Messaging**: Cannot initiate conversations; users must message first
- **Interactive Elements**: WeChat doesn't support buttons/quick replies natively (rendered as text with numbers)
- **File Messages**: Generic file sending not fully supported by WeChat Customer Service API

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

## Changelog

### v1.0.2 (Current)

- ✅ Full message type support (text, image, audio, video, location, link)
- ✅ WeChat Customer Service API integration for sending messages
- ✅ Automatic media upload to WeChat servers
- ✅ Signature verification for secure webhook handling
- ✅ Rich message support (cards, carousels)
- ✅ Comprehensive error handling and logging

## Additional Resources

- [WeChat Official Account Platform Docs](https://developers.weixin.qq.com/doc/offiaccount/en/Getting_Started/Overview.html)
- [WeChat API Reference](https://developers.weixin.qq.com/doc/offiaccount/en/Message_Management/Receiving_standard_messages.html)
- [Botpress Documentation](https://botpress.com/docs)
