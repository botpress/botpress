# Zendesk integration

Optimize your customer support workflow with the Zendesk integration for your
chatbot. Seamlessly manage tickets, engage customers, and access critical
information—all within your bot. Elevate your customer service game and improve
internal processes by triggering automations from real-time ticket updates.

> 🤝 **Usage with HITL (Human in the Loop)**
> If you intend to use the Zendesk integration with HITL,
> ensure that you have the HITL plugin installed.

## ⚠️ migrating from 2.x.x to 3.x.x

Zendesk is tightening its security requirements on January 12th, 2026.
From that date forward,
all third-party integrations must authenticate exclusively through OAuth.
Because the 2.x.x version of the Botpress Zendesk integration relies on API
tokens rather than OAuth, it will be deprecated.

The 3.x.x version introduces full OAuth support and is the required upgrade path.

What changes in 3.x.x?

- Authentication now uses Zendesk OAuth instead of API tokens.
- Existing API-token-based connections will stop working once Zendesk
  enforces the new policy.
- The integration settings UI has been updated to support OAuth app credentials.

## Requirements

- A Zendesk account

### Knowledge Base Sync

1. Toggle the "Sync Knowledge Base With Bot" option to start syncing.
2. Enter the ID of the desired knowledge base where your Zendesk articles will
   be stored.
3. Enable the integration to complete the setup.

Once these steps are completed,
your Zendesk articles will automatically sync to the specified
knowledge base in Botpress.
You can manually sync by using the "Sync KB" action.
