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

## Customer error messages

Configure `onUserIncompatibleMsgTypeMessage` to customize the warning when a customer sends an unsupported message during a HITL session. The session remains active.

Configure `onUserHitlErrorMessage` to customize the customer notice when a missing conversation or user link causes their local HITL session to be aborted. This does not close the remote ticket or automatically resume the workflow. Messages sent to the human agent are unchanged; `onIncompatibleMsgTypeMessage` still controls the agent's unsupported-message warning.

Both settings are available globally and in the Start HITL card's Configuration Overrides. New sessions save their effective settings; existing sessions keep their saved settings. Omitted or empty values retain the English defaults. Use the exact value `NULL` to suppress a notice without changing session handling.
