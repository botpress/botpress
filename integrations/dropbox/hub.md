# Description

Integrate your bot with Dropbox to list, manage, and transfer files seamlessly between Dropbox and the Botpress files API.

# Configuration

Currently, the Dropbox integration only supports OAuth authentication using your own Dropbox app.

## Configuring the integration with a custom app

1. Sign in to your Dropbox account and access the [Dropbox App Console](https://www.dropbox.com/developers/apps).
2. Create a new app by clicking the "Create app" button.
   - Choose the "Scoped access" option.
   - Give access to either a single folder or your entire Dropbox account.
   - Name your app and click "Create app".
3. From your app's settings page, copy the `App key` and `App secret`. You will need these to configure the integration on Botpress.
4. In your app's Permissions page, add the following scopes:
   - `account_info.read`
   - `files.metadata.write`
   - `files.content.read`
   - `files.content.write`
   - `sharing.read`
5. After adding the scopes, click the "Submit" button to apply the changes.
6. Navigate back to your app's settings page and scroll down to the "OAuth 2" section.
7. Generate an access token by clicking the "Generate" button. Copy the generated access token.
8. On Botpress, enter your `App key`, `App secret`, and `Access token` in the integration configuration page.
9. Save the configuration to enable the integration.

# Using the integration

The integration provides actions to manage your Dropbox files effectively:

- List files and folders in your Dropbox account
- Download files from Dropbox to your bot's storage
- Upload files from your bot to Dropbox
- Create, delete, and organize folders
- Move or copy files between locations

Use these actions in your workflows to seamlessly handle file operations between your bot and Dropbox.

# Limitations

Standard Dropbox API limitations apply. For more information, visit the [Dropbox API documentation](https://www.dropbox.com/developers/documentation).
