# Google Chat Integration for Botpress

This integration allows you to connect your Botpress chatbot with Google Chat spaces, enabling seamless communication between your bot and Google Chat users.

## Features

- Send and receive messages in Google Chat spaces
- Automatic message handling and responses
- Support for multiple Google Chat spaces
- Secure authentication using Google Service Account

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A Google Chat space where you want to deploy your bot
3. Botpress instance with the Google Chat integration installed

## Setup Instructions

### 1. Enable Google Chat API

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Google Chat API"
4. Click on the Google Chat API
5. Click "Enable" to activate the API for your project

### 2. Create a Google Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Fill in the service account details and click "Create"
6. Create a new key for the service account:
   - Click on the service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the key file

### 3. Configure Google Chat App Settings

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Google Chat API"
3. Click on "Configuration"
4. Set up your app with the following settings:
   - **App Name**: Choose a name for your bot
   - **Description**: Add a description of your bot's functionality
   - **Avatar URL**: Add a URL for your bot's avatar image
   - **Features**:
     - Enable interactive features
     - Enable receiving 1-1 messages
     - Enable joining spaces and group conversations
   - **HTTP Endpoint URL**: Set this to your Botpress webhook URL found in the Google Chat Integration Configuration.

### 4. Configure the Integration in Botpress

1. In your Botpress instance, go to the Integrations section
2. Find and select the Google Chat integration
3. Configure the following settings:
   - **Service Account JSON**: Paste the entire contents of your downloaded service account key file
   - **Default Space**: Enter the ID of your default Google Chat space (optional)

### 5. Add the Bot to Your Google Chat Space

1. Open your Google Chat space
2. Click on the space name to open space details
3. Go to "Apps & integrations"
4. Click "Add apps"
5. Search for your bot using the service account email
6. Add the bot to your space

## Usage

### Sending Messages

The bot can send messages to any Google Chat space it has been added to. Messages can be sent:

- In response to user messages
- Proactively through the Botpress flow editor
- Via API calls from your custom code

### Receiving Messages

The bot automatically receives and processes messages sent in the Google Chat space. It will:

- Parse incoming messages
- Process them through your Botpress flows
- Send appropriate responses back to the space

### Message Format

The integration supports text messages in Google Chat spaces. Messages can include:

- Plain text
- Basic formatting
- Links
- Mentions

## Security Considerations

- Keep your service account key secure and never share it publicly
- Regularly rotate your service account keys
- Use the principle of least privilege when assigning roles to your service account
- Monitor your bot's activity and set up appropriate logging

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Verify the service account has the correct permissions
   - Check if the bot is properly added to the space
   - Ensure the integration is properly configured in Botpress

2. **Authentication errors**
   - Verify the service account JSON is correctly formatted
   - Check if the service account key is valid and not expired
   - Ensure the service account has the necessary API scopes enabled

3. **Message delivery issues**
   - Verify the space ID is correct
   - Check if the bot has permission to post in the space
   - Ensure the message format is valid

## API Reference

For more details about the Google Chat API, refer to the [official documentation](https://developers.google.com/chat/api/reference/rest).
