The Intercom integration empowers your conversational AI by seamlessly integrating Botpress with Intercom's powerful customer messaging platform. Connect your AI-powered chatbot to Intercom and engage with your customers in real-time through personalized conversations. With this integration, you can automate customer support, handle inquiries, collect feedback, and nurture leads directly within Intercom. Leverage Intercom's features such as live chat, user segmentation, event tracking, and in-app messaging to deliver exceptional customer experiences. Streamline your customer communication and take your conversational AI to new heights with the Intercom Integration for Botpress.

## Migration from 1.x to 2.x

Version 2.0 introduces support for proactive conversations and user management, allowing your bot to proactively interact with Intercom users.

#### Proactive Conversations

The integration now supports the `getOrCreateConversation` action, allowing you to proactively start conversations with Intercom users.

**Input:**

- **Conversation ID** (required): The Intercom conversation ID

**How it works:**

1. Fetches the conversation from Intercom using the provided conversation ID
2. Creates or retrieves the corresponding Botpress conversation
3. Returns the Botpress conversation ID

#### Proactive User

The integration now supports the `getOrCreateUser` action, enabling you to proactively create or retrieve Intercom users from your bot workflows.

**Input:**

- **User ID** (required): The Intercom user ID

**How it works:**

1. Fetches the user contact from Intercom using the provided user ID
2. Retrieves the user's details (ID and email) from Intercom
3. Creates or retrieves the corresponding Botpress user with the Intercom data
4. Returns the Botpress user ID
