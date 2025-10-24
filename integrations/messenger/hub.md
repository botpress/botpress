<iframe src="https://www.youtube.com/embed/pOIrLMpZZqc"></iframe>

The Messenger integration empowers your chatbot to seamlessly interact with Facebook Messenger, one of the most popular messaging platforms. Connect your AI-powered chatbot to Messenger and engage with your audience in real-time conversations. With this integration, you can automate customer support, provide personalized recommendations, send notifications, and handle inquiries directly within Messenger. Leverage Messenger's rich features, including text, images, buttons, quick replies, and more, to create dynamic and engaging chatbot experiences. Take your customer engagement to the next level with the Messenger Integration for Botpress.

## Migrating from 4.x to 5.x

### Changes to the 'Get Or Create Conversation' card

The following changes have been implemented:

- Renaming of the `id` parameter to `userId`. The ID still corresponds to the Messenger ID of the user that is or will be taking part in the conversation.
- It is now the responsibility of the Bot developer to ensure the validity of the provided user ID. No additional checks are made in the action.

### Removal of `recipientId` and `senderId` conversation tags

The `recipientId` and `senderId` conversation tags were removed because of their redundancy. The recipient ID, which corresponded to the Bot's Messenger ID, can still be found in the `recipientId` message tag of incoming message or in the `senderId` message tag of outgoing messages. The sender ID, which corresponded to the user's Messenger ID, can still be found in the `id` conversation tag.

### Markdown message type

The Markdown message type has been deprecated, so its support has been removed in the `channel` channel. You can use the text message type to send Markdown instead.

## Migrating from 3.x to 4.x

### _postback_ and _say_ messages prefix

In version 4.0 of Messenger, _postback_ and _say_ messages no longer use the prefixes `postback:` or `say:`. If your bot relied on these prefixes for logic or transitions, you can update it to depend solely on the value set for the postback.
