# Human In The Loop Plugin

This plugin allows your bot to ask for human help when it is not able to answer a user query.

To use this plugin, you must first configure a compatible HITL integration:

- Zendesk
- Freshchat
- Hitl (official Botpress HITL integration)

## Using the plugin in the Studio

Place the card "Start HITL" anywhere in your workflow and fill in the required fields.

In the conversation ID field, you can use the `{{event.conversationId}}` variable to get the current conversation ID.
Likewise, you can use the `{{event.userId}}` variable to get the ID of the current user.
