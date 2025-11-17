<iframe src="https://www.youtube.com/embed/pOIrLMpZZqc"></iframe>

The Facebook and Messenger integration empowers your chatbot to seamlessly interact across Facebook's messaging ecosystem, combining both Messenger and Facebook Page capabilities into one powerful solution. Connect your AI-powered chatbot to engage with your audience through multiple touchpoints: respond to direct messages, reply to comments on Facebook Page posts, and even initiate private conversations directly from post comments.

## Configuration (Updates)

### Manual configuration

#### Webhook Subscriptions

Using the Messenger App in your Meta app, subscribe to the following fields:

- **messages**: Required to receive incoming direct messages
- **messaging_postbacks**: Required to handle button clicks and quick replies
- **(NEW) feed**: Required to receive and respond to comments on Facebook page posts. This field is essential for the comment interaction features and proactive conversation from comments.

## Proactive Conversations

The integration now supports proactive conversation creation, letting you seamlessly move from public interactions to private DMs. When someone comments on a post from your Facebook Page, you can use that comment’s ID to automatically initiate a private conversation with the user.

## Migrating from 4.x to 5.x

### Reauthorization for comment replies

If your bot was previously connected to your Facebook page using OAuth, you will need to complete the authorization flow again in order to receive messages on the `commentReplies` channel.

### Changes to the 'Get Or Create Conversation' card

The following changes have been implemented:

- Renaming of the `id` parameter to `userId`. The ID still corresponds to the Messenger ID of the user that is or will be taking part in the conversation.
- It is now the responsibility of the Bot developer to ensure the validity of the provided user ID. No additional checks are made in the action.

### Removal of `recipientId` and `senderId` conversation tags

The `recipientId` and `senderId` conversation tags were removed because of their redundancy. The recipient ID, which corresponded to the Bot's Messenger ID, can still be found in the `recipientId` message tag of incoming messages or in the `senderId` message tag of outgoing messages. The sender ID, which corresponded to the user's Messenger ID, can still be found in the `id` conversation tag.

### Markdown message type

The Markdown message type has been deprecated, so its support has been removed in the `channel` channel. You can use the text message type to send Markdown instead.

## Migrating from 3.x to 4.x

### _postback_ and _say_ messages prefix

In version 4.0 of Messenger, _postback_ and _say_ messages no longer use the prefixes `postback:` or `say:`. If your bot relied on these prefixes for logic or transitions, you can update it to depend solely on the value set for the postback.
