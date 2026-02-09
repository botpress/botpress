The Slack integration enables seamless communication between your AI-powered chatbot and Slack, the popular collaboration platform. Connect your chatbot to Slack and streamline team communication, automate tasks, and enhance productivity. With this integration, your chatbot can send and receive messages, share updates, handle inquiries, and perform actions directly within Slack channels. Leverage Slack's extensive features such as chat, file sharing, notifications, and app integrations to create a powerful conversational AI experience. Enhance team collaboration and streamline workflows with the Slack Integration for Botpress.

## Migrating from version `4.x` to `5.x`

Version 5.0 overhauls how the bot routes and replies to messages. It introduces separate reply location controls for channels and DMs, a new `dmThread` channel type, new conversation context actions, and replaces the legacy `onlyOnBotMention` setting with granular mention controls.

### Breaking Change: New Reply Location Settings

The `replyBehaviour` configuration object now includes two new fields that control **where** the bot sends its replies:

| New Setting | Values | Default | Description |
|---|---|---|---|
| `channelReplyLocation` | `channel`, `thread`, `both` | `channel` | Where the bot replies to channel messages |
| `dmReplyLocation` | `dm`, `thread`, `both` | `dm` | Where the bot replies to DM messages |

**`channelReplyLocation`** controls what happens when a message arrives in a public/private channel:
- `channel` — reply in the channel (same behavior as v4.x default)
- `thread` — reply in a new or existing thread under the message
- `both` — reply in both the channel and a thread

**`dmReplyLocation`** controls what happens when a message arrives in a DM:
- `dm` — reply in the DM conversation (same behavior as v4.x default)
- `thread` — reply in a thread within the DM
- `both` — reply in both the DM conversation and a thread

#### Migration from v4.x `replyBehaviour`

| v4.x Config | v5.x Equivalent |
|---|---|
| Default (reply in channel) | `channelReplyLocation: 'channel'`, `dmReplyLocation: 'dm'` |
| `createReplyThread: true` | `channelReplyLocation: 'thread'` |

### Breaking Change: New Mention Configuration

The `onlyOnBotMention` boolean has been replaced with two new options that let you configure mention requirements separately for channels and threads.

| Old Config | New Config | Description |
|---|---|---|
| `onlyOnBotMention: true` | `channelMention: 'required'` | Bot only responds in channels when mentioned |
| `onlyOnBotMention: true` | `threadMention: 'required'` | Bot only responds in threads when mentioned |
| `onlyOnBotMention: false` | Both set to `notRequired` | Bot responds to all messages (default behavior) |

**`channelMention` values:**
- `required` — Bot only responds in channels when explicitly mentioned
- `notRequired` — Bot responds to all channel messages (default)

**`threadMention` values:**
- `required` — Bot only responds in threads when explicitly mentioned
- `inherit` — Bot responds in threads if it was mentioned in the original message that started the thread
- `notRequired` — Bot responds to all thread messages (default)

### Breaking Change: New `dmThread` Channel Type

Conversations in DM threads are now tracked as a separate `dmThread` channel, distinct from the `dm` channel. Previously, DM thread messages were handled as part of the `dm` channel.

This affects any workflows or automations that check the conversation channel type. The four channel types are now:

| Channel | Description |
|---|---|
| `channel` | A message in a public or private Slack channel |
| `dm` | A top-level direct message |
| `thread` | A thread inside a channel |
| `dmThread` | A thread inside a DM |

### Breaking Change: Message Routing Behavior

The way messages are routed to conversations has changed significantly. The bot now classifies each incoming message by its **origin** (`dm`, `dmThread`, `channel`, `channelThread`) and routes it according to the reply location settings:

| Origin | Reply Location | Behavior |
|---|---|---|
| DM | `dm` | Reply in the DM conversation |
| DM | `thread` | Reply in a DM thread |
| DM | `both` | Reply in both the DM conversation and a DM thread |
| DM thread | `dm` or `thread` | Reply in the existing DM thread |
| DM thread | `both` | Reply in both the DM conversation and the DM thread |
| Channel | `channel` | Reply in the channel (gated by `channelMention`) |
| Channel | `thread` | Reply in a thread (gated by `channelMention`) |
| Channel | `both` | Reply in both (gated by `channelMention`) |
| Channel thread | `channel` or `thread` | Reply in the thread (gated by `threadMention`) |
| Channel thread | `both` | Reply in both channel and thread (gated by `threadMention`) |

### New Actions

The following actions have been added:

- **`startThreadConversation`** — Start a conversation in a specific thread by providing a channel ID and thread timestamp.
- **`addConversationContext`** — Attach messages from a previous conversation as context to a target conversation.
- **`getConversationContextByConversationId`** — Retrieve the message history of a conversation by its Botpress conversation ID.
- **`getConversationContextByTags`** — Retrieve the message history of a conversation by its channel type, channel ID, and optional thread ID.

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
4. Copy the Refresh Token (starts with `xoxe-1-`) or legacy Bot Token (starts with `xoxb-`) and paste it into the integration settings in Botpress. You may need to refresh the page in the Slack API portal to see the new token.

## Configuration

### Automatic configuration with OAuth (recommended)

This is the simplest way to set up the integration. To set up the Slack integration using OAuth, click the authorization button and follow the instructions to connect your Botpress chatbot to Slack. This method is recommended as it simplifies the configuration process and ensures secure communication between your chatbot and Slack.

When using this configuration mode, a Botpress-managed Slack application will be used to connect to your workspace. The application will have the necessary permissions to send and receive messages, access channels, and perform other actions on your behalf. If you require more granular control over the permissions or prefer to use your own Slack application, you can opt for the manual configuration mode instead.

### Manual configuration with a bot token

If you prefer to manually configure the integration, you can provide a bot token to connect your custom Slack application to Botpress. To set up the Slack integration manually, follow these steps:

#### Step 1 - Creating your Slack application

1. In your browser, navigate to the Slack API portal and log in.
2. From the Slack API portal, create a new Slack app.
3. Navigate to the "OAuth & Permissions" section of your Slack app.
4. Scroll down to the "Redirect URLs" section and add the following URL:
   ```
   https://webhook.botpress.cloud/oauth
   ```
5. Still in the "OAuth & Permissions" section, add the following _Bot Token Scopes_ to your bot token:
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
6. **IMPORTANT:** install your Slack app to your workspace. This is a crucial step to ensure that the bot can send and receive messages. To do this, scroll up to the "OAuth Tokens for Your Workspace" section and click "Install App to Workspace". Follow the on-screen instructions to authorize the app.
7. Scroll up to the "Advanced token security via token rotation " section and click "Opt In" to enable token rotation. Confirm you wish to opt in.
8. Copy the Refresh Token (starts with `xoxe-1-`) or legacy Bot Token (starts with `xoxb-`). You will need it to set up the integration on Botpress. You may need to refresh the page in the Slack API portal to see the token.
9. Navigate to the "Basic Information" section of your Slack app.
10. Copy the "Client ID", "Client Secret", and "Signing Secret". You will need them to set up the integration on Botpress.

#### Step 2 - Setting up the integration in Botpress

1. In Botpress, navigate to the integration's settings.
2. Select the "Manual" configuration mode.
3. Paste the "Refresh Token", "Client ID", "Client Secret", and "Signing Secret" you copied from the Slack API portal into the corresponding fields in Botpress.
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
6. Save the changes on Slack.

### Optional: Set a custom Display Name and Avatar

Regardless of the configuration mode you choose, you can optionally set a custom display name or avatar for your bot. To do this, fill in the following fields as needed:

- **Bot Name**: If provided, this name will be displayed as the sender in Slack conversations.
- **Bot Avatar URL**: If provided, the bot's avatar will be updated to the image at this URL. The image should be square, at least 512x512 pixels, and no larger than 1024x1024 pixels. The URL must be publicly accessible. Supported formats include GIF, PNG, JPG, JPEG, HEIC, and HEIF.

## Configuring Reply Behavior

### Reply locations

You can control where the bot sends its replies using the `channelReplyLocation` and `dmReplyLocation` settings inside the `replyBehaviour` configuration object.

- **`channelReplyLocation`**: Where the bot replies to channel messages — `channel` (default), `thread`, or `both`.
- **`dmReplyLocation`**: Where the bot replies to DM messages — `dm` (default), `thread`, or `both`.

Setting `channelReplyLocation` to `thread` or `both` will cause the bot to create threads for channel messages, which can help minimize disruption in busy channels.

### Configuring mention requirements

For more targeted bot interactions, you can configure when the bot requires an explicit mention to respond:

- **Channel Mention** (`channelMention`): Controls whether the bot requires a mention to respond to messages in channels.
  - `required` — Bot only responds when mentioned (e.g., `@YourBot`)
  - `notRequired` — Bot responds to all channel messages (default)

- **Thread Mention** (`threadMention`): Controls whether the bot requires a mention to respond to messages in threads.
  - `required` — Bot only responds in threads when mentioned
  - `inherit` — Bot responds in threads if it was mentioned in the original message that started the thread (useful for "summoned" conversations)
  - `notRequired` — Bot responds to all thread messages (default)

The `inherit` option is particularly useful when you want the bot to continue a conversation in a thread without requiring repeated mentions, but only if someone explicitly started the conversation by mentioning the bot.

## Limitations

Standard Slack API limitations apply to the Slack integration in Botpress. These limitations include rate limits, message size restrictions, and other constraints imposed by the Slack platform. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Slack API documentation](https://api.slack.com/apis/rate-limits).
