The Slack integration enables seamless communication between your AI-powered chatbot and Slack, the popular collaboration platform. Connect your chatbot to Slack and streamline team communication, automate tasks, and enhance productivity. With this integration, your chatbot can send and receive messages, share updates, handle inquiries, and perform actions directly within Slack channels. Leverage Slack's extensive features such as chat, file sharing, notifications, and app integrations to create a powerful conversational AI experience. Enhance team collaboration and streamline workflows with the Slack Integration for Botpress.

## Migrating from version `3.x` to `4.x`

Version 4.0 of the Slack integration refines the bot's reply behaviour by introducing the possibility to reply in either `channel`, `thread` or `channel and thread`. This replaces the previous `createReplyThread` configuration option by adding the ability to **only** reply in threads.

Features that have been added are:

- Improved reply behaviour
- Added rich text! Users are now able to input markdown text and it display in rich text in slack

## Migrating from version `2.x` to `3.x`

Version 3.0 of the Slack integration changes the way the mention system works with Botpress.
It now swaps the mention text from slack to fullname and gives a infos about the mention. the payload looks like this:

```JSON
{
   text: 'hey <@John Doe>!'
   mentions: [
      {
         type: 'user',
         start: 6,
         end: 14,
         user: {
            id: 'user_abc123', // This will be a botpress user id
            name: 'John Doe'
         }
      }
   ]
}
```

It will also do the same when the bot sends a string with mentions in it. The payload needs to look like this to work.

```JSON
{
   text: 'hey <@John Doe>!'
   mentions: [
      {
         type: 'user',
         start: 6,
         end: 14,
         user: {
            id: 'U123', // This needs to be a slack member id
            name: 'John Doe'
         }
      }
   ]
}
```

## Migrating from version `1.x` to `2.x`

Version 2.0 of the Slack integration introduces rotating authentication tokens. If you previously configured the integration using automatic configuration, no action is required once you update to the latest version.

If you configured the integration using manual configuration, you will need to update your Slack app to use rotating tokens. To do this, follow these steps:

1. Go to the Slack API portal and navigate to your app.
2. In the "OAuth & Permissions" section, scroll down to the "Advanced token security via token rotation" section.
3. Click "Opt In" to enable token rotation. Confirm you wish to opt in.
4. Copy the legacy Bot Token (starts with `xoxb-`) or Refresh Token (starts with `xoxe-1-`) and paste it into the integration settings in Botpress. Initially, your Slack app will have a legacy token (`xoxb-`), but after the initial authorization (when you press "Save Configuration"), it will be exchanged for a Refresh Token (`xoxe-1`). The refresh token will automatically be added to your configuration, so you should not need to add anything after the initial Bot Token (`xoxb-`). If you need to access your Refresh Token for any reason after the initial authorization, you will be able to see it in your Slack API portal.

## Configuration

### Automatic configuration with OAuth (recommended)

This is the simplest way to set up the integration. To set up the Slack integration using OAuth, click the authorization button and follow the instructions to connect your Botpress chatbot to Slack. This method is recommended as it simplifies the configuration process and ensures secure communication between your chatbot and Slack.

When using this configuration mode, a Botpress-managed Slack application will be used to connect to your workspace. The application will have the necessary permissions to send and receive messages, access channels, and perform other actions on your behalf. If you require more granular control over the permissions or prefer to use your own Slack application, you can opt for the manual configuration mode instead.

### Manual configuration with a bot token

If you prefer to manually configure the integration, you can provide a bot token to connect your custom Slack application to Botpress. To set up the Slack integration manually, follow these steps:

#### Step 1 - Creating your Slack application

1. In your browser, navigate to the Slack API portal and log in.
2. From the Slack API portal, select "Create New App"
3. Select "From a manifest" and select the Slack workplace you would like to install the app to
4. Replace the JSON with the following content (you may update the app name, display name, always online status, event subscription request_url, and scopes, as needed, or you can edit them after the app has been created):

```JSON
{
    "display_information": {
        "name": "Bot (powered by Botpress)"
    },
    "features": {
        "bot_user": {
            "display_name": "Bot (powered by Botpress)",
            "always_online": false
        }
    },
    "oauth_config": {
        "redirect_urls": [
            "https://webhook.botpress.cloud/oauth"
        ],
        "scopes": {
            "bot": [
                "channels:history",
                "channels:manage",
                "channels:read",
                "chat:write",
                "groups:history",
                "groups:read",
                "groups:write",
                "im:write",
                "im:read",
                "im:history",
                "mpim:history",
                "mpim:read",
                "mpim:write",
                "reactions:read",
                "reactions:write",
                "team:read",
                "users.profile:read",
                "users:read",
                "users:read.email",
                "app_mentions:read"
            ]
        }
    },
    "settings": {
        "event_subscriptions": {
            "request_url": "https://webhook.botpress.cloud/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "bot_events": [
                "member_joined_channel",
                "member_left_channel",
                "message.channels",
                "message.groups",
                "message.im",
                "message.mpim",
                "reaction_added",
                "reaction_removed",
                "team_join",
                "app_mention"
            ]
        },
        "org_deploy_enabled": false,
        "socket_mode_enabled": false,
        "token_rotation_enabled": false
    }
}
```

5. Navigate to the "OAuth & Permissions" section of your Slack app.
6. Scroll down to the "Redirect URLs" section and add the following URL:
   ```
   https://webhook.botpress.cloud/oauth
   ```
7. Still in the "OAuth & Permissions" section, add the following _Bot Token Scopes_ to your bot token. These should already be set up if you created the app from manifest:
   - `channels:history`: needed to receive incoming messages and to fetch the history of channels the bot gets invited into.
   - `channels:manage`: needed to open new DMs and to set the current topic.
   - `channels:read`: needed to obtain a list of all available channels, to retrieve details about conversations, and to receive notifications when a user joins or leaves a channel.
   - `chat:write`: needed to send messages as @Botpress in channels or DMs.
   - `groups:history`: needed to receive incoming messages and to fetch the history of private channels the bot gets invited into.
   - `groups:read`: needed to obtain a list of all available private channels, to retrieve details about conversations, and to receive notifications when a user joins or leaves a private channel.
   - `groups:write`: needed to open new DMs and to set the current topic.
   - `im:history`: needed to receive incoming messages and to fetch the history of private channels the bot gets invited into.
   - `im:read`: needed to obtain a list of all available DMs and to retrieve details about specific DMs.
   - `im:write`: needed to open new DMs and to set the current topic of existing DMs.
   - `mpim:history`: needed to receive incoming messages and to fetch the history of multi-person DMs the bot gets invited into
   - `mpim:read`: needed to obtain a list of all available multi-person DMs, to retrieve details about conversations, and to receive notifications when a user joins a multi-person DM.
   - `mpim:write`: needed to open new DMs and to set the current topic.
   - `reactions:read`: needed to receive notifications when reactions are added.
   - `reactions:write`: needed to add new reactions to messages.
   - `team:read`: needed to obtain metadata on your team in order to operate on the right instance of your bot.
   - `users.profile:read`: needed to retrieve profile information for channel and DM members.
   - `users:read`: needed to obtain a list of all members of the workspace and to receive notifications when new members join the workspace.
   - `users:read.email`: needed for the `Get User Profile` action.
   - `app_mentions:read`: needed for the app to receive mentions.
8. If you would like to be able to send messages to the bot directly, go to "App Home", scroll down to "Show Tabs", and enable "Allow users to send Slash commands and messages from the messages tab".
9. **IMPORTANT:** install your Slack app to your workspace. This is a crucial step to ensure that the bot can send and receive messages. To do this, scroll up to the "OAuth Tokens for Your Workspace" section and click "Install App to Workspace". Follow the on-screen instructions to authorize the app.
10. Scroll up to the "Advanced token security via token rotation " section and click "Opt In" to enable token rotation. Confirm you wish to opt in.
11. Copy the Bot Token (starts with `xoxb-`) or Refresh Token (starts with `xoxe-1-`) Initially, your Slack app will have a legacy token (`xoxb-`), but after the initial authorization (when you press "Save Configuration"), it will be exchanged for a Refresh Token (`xoxe-1`). The refresh token will automatically be added to your configuration, so you should not need to add anything after the initial Bot Token (`xoxb-`). If you need to access your Refresh Token for any reason after the initial authorization, you will be able to see it in your Slack API portal.
12. Navigate to the "Basic Information" section of your Slack app.
13. Copy the "Client ID", "Client Secret", and "Signing Secret". You will need them to set up the integration on Botpress.

#### Step 2 - Setting up the integration in Botpress

1. In Botpress, navigate to the integration's settings.
2. Select the "Manual" configuration mode.
3. Paste the "Bot Token" (or "Refresh Token"), "Client ID", "Client Secret", and "Signing Secret" you copied from the Slack API portal into the corresponding fields in Botpress.
4. Click "Save" to save the configuration.

#### Step 3 - Enabling webhooks

1. In the integration settings, copy the webhook URL provided by Botpress. You will need it later.
2. Navigate to the Slack API portal and log in. Open your Slack app.
3. Navigate to the "Event Subscriptions" section of your Slack app.
4. Enable event subscriptions and paste the webhook URL into the "Request URL" field. Save the changes for your Slack app.
5. You may now suscribe to bot events as needed:
   - `message.channels`: Subscribe to these events to allow the bot to receive messages from channels.
   - `messages.groups`: Subscribe to these events to allow the bot to receive messages from private channels.
   - `messages.im`: Subscribe to these events to allow the bot to receive messages from direct messages.
   - `messages.mpim`: Subscribe to these events to allow the bot to receive messages from multi-party direct messages.
   - `reaction_added`: Subscribe to these events to allow the bot to know when reactions are added to messages.
   - `reaction_removed`: Subscribe to these events to allow the bot to know when reactions are removed from messages.
   - `member_joined_channel`: Subscribe to these events to allow the bot to know when members join channels.
   - `member_left_channel`: Subscribe to these events to allow the bot to know when members leave channels.
   - `team_join`: Subscribe to these events to allow the bot to know when new members join the workspace.
   - `app_mention`: Subscribe to these events to allow the bot to know when it is mentioned directly in a Slack message
6. Save the changes on Slack.

### Optional: Set a custom Display Name and Avatar

Regardless of the configuration mode you choose, you can optionally set a custom display name or avatar for your bot. To do this, fill in the following fields as needed:

- **Bot Name**: If provided, this name will be displayed as the sender in Slack conversations.
- **Bot Avatar URL**: If provided, the bot's avatar will be updated to the image at this URL. The image should be square, at least 512x512 pixels, and no larger than 1024x1024 pixels. The URL must be publicly accessible. Supported formats include GIF, PNG, JPG, JPEG, HEIC, and HEIF.

## Replying in threads instead of the main channel

To minimize disruption in busy Slack channels, you can activate reply threading in the integration settings. This feature creates a thread for each incoming message, where the bot will respond. For a more targeted approach, enable the "Require Bot Mention for Replies" to only create threads when the bot is mentioned by name.

## Limitations

Standard Slack API limitations apply to the Slack integration in Botpress. These limitations include rate limits, message size restrictions, and other constraints imposed by the Slack platform. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Slack API documentation](https://api.slack.com/apis/rate-limits).
