The Slack integration enables seamless communication between your AI-powered chatbot and Slack, the popular collaboration platform. Connect your chatbot to Slack and streamline team communication, automate tasks, and enhance productivity. With this integration, your chatbot can send and receive messages, share updates, handle inquiries, and perform actions directly within Slack channels. Leverage Slack's extensive features such as chat, file sharing, notifications, and app integrations to create a powerful conversational AI experience. Enhance team collaboration and streamline workflows with the Slack Integration for Botpress.

## Configuration

### Automatic configuration with OAuth (recommended)

This is the simplest way to set up the integration. To set up the Slack integration using OAuth, click the authorization button and follow the instructions to connect your Botpress chatbot to Slack. This method is recommended as it simplifies the configuration process and ensures secure communication between your chatbot and Slack.

When using this configuration mode, a Botpress-managed Slack application will be used to connect to your workspace. The application will have the necessary permissions to send and receive messages, access channels, and perform other actions on your behalf. If you require more granular control over the permissions or prefer to use your own Slack application, you can opt for the manual configuration mode instead.

### Manual configuration with a bot token

If you prefer to manually configure the integration, you can provide a bot token to connect your custom Slack application to Botpress. To set up the Slack integration manually, follow these steps:

1. Create a new Slack app in the Slack API portal.
2. Navigate to the "OAuth & Permissions" section of your Slack app.
3. Copy the "Bot User OAuth Token" and paste it into the "Slack Bot User OAuth Token" field in the Botpress integration settings.
4. Still in the "OAuth & Permissions" section, add the following _Bot Token Scopes_ to your bot token:
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
   - `users.profile:read`: needed to retrieve profile informations for channel and DM members.
   - `users:read`: needed to obtain a list of all members of the workspace and to receive notifications when new members join the workspace.
5. Navigate to the "Basic Information" section of your Slack app.
6. Copy the "Signing Secret" and paste it into the "Slack Signing Secret" field in the Botpress integration settings.
7. In the integration settings, copy the webhook URL provided by Botpress.
8. Navigate to the "Event Subscriptions" section of your Slack app.
9. Enable event subscriptions and paste the webhook URL into the "Request URL" field. Save the changes for your Slack app.
10. You may now suscribe to bot events as needed:
    - `message.channels`: Subscribe to these events to allow the bot to receive messages from channels.
    - `messages.groups`: Subscribe to these events to allow the bot to receive messages from private channels.
    - `messages.im`: Subscribe to these events to allow the bot to receive messages from direct messages.
    - `messages.mpim`: Subscribe to these events to allow the bot to receive messages from multi-party direct messages.
    - `reaction_added`: Subscribe to these events to allow the bot to know when reactions are added to messages.
    - `reaction_removed`: Subscribe to these events to allow the bot to know when reactions are removed from messages.
    - `member_joined_channel`: Subscribe to these events to allow the bot to know when members join channels.
    - `member_left_channel`: Subscribe to these events to allow the bot to know when members leave channels.
    - `team_join`: Subscribe to these events to allow the bot to know when new members join the workspace.
11. Save the changes on Slack.
12. Save the configuration in Botpress.

### Optional: Set a custom Display Name and Avatar

Regardless of the configuration mode you choose, you can optionally set a custom display name or avatar for your bot. To do this, fill in the following fields as needed:

- **Bot Name**: If provided, this name will be displayed as the sender in Slack conversations.
- **Bot Avatar URL**: If provided, the bot's avatar will be updated to the image at this URL. The image should be square, at least 512x512 pixels, and no larger than 1024x1024 pixels. The URL must be publicly accessible. Supported formats include GIF, PNG, JPG, JPEG, HEIC, and HEIF.

## Limitations

Standard Slack API limitations apply to the Slack integration in Botpress. These limitations include rate limits, message size restrictions, and other constraints imposed by the Slack platform. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Slack API documentation](https://api.slack.com/apis/rate-limits).
