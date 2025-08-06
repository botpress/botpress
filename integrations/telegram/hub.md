<iframe src="https://www.youtube.com/embed/w0-UGm4mu74"></iframe>

The Telegram integration allows your AI-powered chatbot to seamlessly interact with Telegram, a popular messaging platform with a large user base. Connect your chatbot to Telegram and engage with your audience in real-time conversations. With this integration, you can automate customer support, provide personalized recommendations, send notifications, and handle inquiries directly within Telegram. Leverage Telegram's rich features, including text messages, inline buttons, media files, and more, to create dynamic and interactive chatbot experiences. Empower your chatbot to deliver exceptional user experiences on Telegram with the Telegram Integration for Botpress.

## Migrating from version `0.x.x` to `1.x.x`

The Telegram integration v1.0.0 update has some breaking changes that will require you to update your workflow.

### Removal of proactive conversations (and proactive users)
- Telegram does not currently support proactive conversations, so any bots using this feature will need to be updated to use the normal conversation flow.

### Removal of dedicated markdown messages type
- The `markdown` channel message type is being deprecated in favor of integrating this behavior into the base `text` message type.
- This new markdown behavior will allow image markdown. However, since Telegram does not support mixed message types, it will split the message into multiple messages with images sent in between text messages.

### Addition of message limits
- Telegram has a message length limit of 4096 characters, so that limit has been added to the text parameter in the `text` message payload. Going over this limit will result the message being rejected.


## Telegram v1.0.0 Changelog

- Add support for standard commonmark markdown in text message type
- [BREAKING] Remove support for proactive user & conversation
- [BREAKING] Remove support for dedicated markdown message type
  - This is now integrated into the "text" message type
- Implement bloc message type
  - This sends a separate message for each type since Telegram doesn't support a mixed type
  - Limited to 20 messages per bloc (Telegram has a rate limit of 20 messages per every 60-second interval)
- [BREAKING] Add message length constraint as per Telegram's message length limit (4096 characters per message)
- Add support for captions on image message types
- Implement error message forwarding from Telegram API
  - This should make errors that come from Telegram more transparent, instead of being masked as a generic botpress integration error
