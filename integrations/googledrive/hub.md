# Description

Enable your bot with the ability to list and manage your files in Google Drive and to download/upload data between Google Drive and the Botpress files API.

# Configuration

Due to the potentially sensitive nature of the files in your Google Drive, the Google Drive integration requires a secure connection between Botpress and Google Drive. To establish this secure connection, you **must** configure the Google Drive integration using OAuth.

## Automatic configuration with OAuth

To set up the Google Drive integration using OAuth, click the authorization button and follow the on-screen instructions to connect your Botpress bot to Google Drive.

When using this configuration mode, a Botpress-managed Google Drive application will be used to connect to your Google Drive account. However, actions taken by the bot will be attributed to the user who authorized the connection, rather than the application. For this reason, **we do not recommend using personal Google Drive accounts** for this integration. You should set up a service account and use this account to authorize the connection. You can then share specific folders and files with this service account to give your bot access to these files.

## Configuring the integration in Botpress

1. Authorize the Google Drive integration by clicking the authorization button.
2. Follow the on-screen instructions to connect your Botpress chatbot to Google Drive.
3. Once the connection is established, you can save the configuration and enable the integration.

# Using the integration

Use the available actions to manage your files and download/upload content from and to Google Drive.

Use the available triggers to know when a file or folder was created or deleted.

Use the 'syncChannels' action to create and update subscription channels on all available files and folders. These channels are what allow your bot to be notified on resource creation and deletion. The channels are valid up to one day. Make sure this action is called once a day to prevent event loss. Calling this action too often may result in errors and events being lost due to the Google Drive subscription creation rate limit.

# Limitations

Standard Google Drive API limitations apply to the Google Drive integration in Botpress. These limitations include rate limits, file size restrictions, and other constraints imposed by the Google Drive platform. Ensure that your bot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Google Drive API documentation](https://developers.google.com/drive/api/guides/about-sdk).
