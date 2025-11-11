The Line integration enables your chatbot to seamlessly interact with Line, one of the leading messaging platforms. Connect your AI-powered chatbot to Line and unlock powerful communication capabilities to engage with your audience. With this integration, you can automate customer interactions, provide instant support, deliver personalized messages, and handle inquiries seamlessly within the Line messaging environment. Leverage Line's rich features such as text, images, stickers, and location sharing to create dynamic and engaging conversations. Elevate your chatbot's reach and impact by integrating it with Line using the Line Integration for Botpress.

## Migrating from version `1.x.x` to `2.x.x`

### Changes in proactive conversations (and proactive users)

- The process of proactively creating conversations and users has changed. You must now use the actions `getOrCreateConversation` and `getOrCreateUser` to create conversations and users.

### Removal of `markdown` message type

- The `markdown` message type has been removed. Markdown messages must now be sent as regular `text` messages.
