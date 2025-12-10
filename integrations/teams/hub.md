The Microsoft Teams integration enables seamless collaboration between your AI-powered chatbot and Microsoft Teams, a popular workplace communication and collaboration platform. Connect your chatbot to Teams and enhance team productivity by automating tasks, providing instant support, and facilitating streamlined communication. With this integration, your chatbot can interact with users in Teams channels, respond to queries, deliver notifications, and perform actions within the Teams environment. Leverage Teams' robust features such as messaging, file sharing, meetings, and app integrations to create a powerful conversational AI experience. Boost teamwork and efficiency with the Microsoft Teams Integration for Botpress.

## Migrating from version `1.x.x` to `2.x.x`

Version `2.0.0` of the Microsoft Teams integration introduces changes to the channels (most notably the markdown channel). If you are migrating from version `1.x.x` to `2.x.x`, please note the following changes:

- The "markdown" channel was removed in favor of integrating the behaviour into the "text" channel
- The "bloc" channel was implemented and can support up to 50 items per bloc message
- The "dropdown" channel was updated to display an actual dropdown instead of a selection of button options
