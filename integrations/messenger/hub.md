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

The integration includes a powerful proactive conversation feature that allows you to create or retrieve direct message conversations on-demand. This feature now supports initiating private conversations from comment IDs, enabling seamless transitions from public post interactions to private support conversations. When a user comments on your Facebook page post, you can use the comment ID to automatically create a private message conversation with that user.

## Migrating from 3.x to 4.x

### _postback_ and _say_ messages prefix

In version 4.0 of Messenger, _postback_ and _say_ messages no longer use the prefixes `postback:` or `say:`. If your bot relied on these prefixes for logic or transitions, you can update it to depend solely on the value set for the postback.
