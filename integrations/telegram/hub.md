<iframe src="https://www.youtube.com/embed/w0-UGm4mu74"></iframe>

The Telegram integration allows your AI-powered chatbot to seamlessly interact with Telegram, a popular messaging platform with a large user base. Connect your chatbot to Telegram and engage with your audience in real-time conversations. With this integration, you can automate customer support, provide personalized recommendations, send notifications, and handle inquiries directly within Telegram. Leverage Telegram's rich features, including text messages, inline buttons, media files, and more, to create dynamic and interactive chatbot experiences. Empower your chatbot to deliver exceptional user experiences on Telegram with the Telegram Integration for Botpress.

## Migrating from version `0.x.x` to `1.x.x`

### Removal of proactive conversations (and proactive users)

- Telegram does not currently support proactive conversations, so any bots using this feature will need to be updated to use the normal conversation flow.

### Removal of dedicated Markdown messages type

- The `markdown` channel message type is being deprecated in favor of integrating this behavior into the base `text` message type.
- This new Markdown behavior (commonmark spec) will allow image Markdown. However, since Telegram does not support mixed message types, it will split the message into multiple messages with images sent in between text messages.

### Addition of message limits

- Telegram has a message length limit of 4096 characters, so that limit has been added to the text parameter in the `text` message payload. Going over this limit will result in the message being rejected.

## Configuration

In order to receive a bot token, you will need to message the telegram BotFather account at [telegram.me/BotFather](https://telegram.me/BotFather). 

1. Message '/start' to telegram.me/BotFather.
2. Message '/newbot' to initiate new bot token creation.
3. Send a message with the title of your new bot.
4. Send a message with the username of your new bot. Please make sure it ends with 'bot'.
5. The BotFather account will respond with message containing your bot token.
6. Paste the bot token in the "Bot Token" field in the Botpress Telegram configuration.
