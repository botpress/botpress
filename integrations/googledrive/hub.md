# Description

Enable your bot to sync Google Drive files into a Botpress knowledge base. This integration reads and lists all files in your Google Drive and transfers them to the Botpress files API for indexing.

# Configuration

This integration requires OAuth authorization to connect your Google Drive account to Botpress.

## Automatic configuration with OAuth

Click the authorization button and follow the on-screen instructions. A Botpress-managed Google Drive application with read-only access will be used to connect to your account.

Actions taken by the bot will be attributed to the user who authorized the connection. **We recommend using a service account** rather than a personal Google Drive account. Share the relevant folders with the service account to control what the knowledge base can access.

## Configuring the integration in Botpress

1. Authorize the Google Drive Knowledge Base integration by clicking the authorization button.
2. Follow the on-screen instructions to connect your Botpress chatbot to Google Drive.
3. Once the connection is established, save the configuration and enable the integration.

# Using the integration

Use this integration as a knowledge base source. It connects with the **Knowledge Connector** plugin to automatically sync files from Google Drive folders into a Botpress knowledge base.

Use the `syncChannels` action to maintain subscription channels on all available files and folders. These channels notify your bot when files are created, updated, or deleted. Channels are valid for up to one day — call this action once daily to prevent event loss.

# Limitations

Standard Google Drive API limitations apply. These include rate limits, file size restrictions, and other constraints imposed by the Google Drive platform.

More details are available in the [Google Drive API documentation](https://developers.google.com/drive/api/guides/about-sdk).
