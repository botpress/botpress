> The Botpress app for Zapier is currently in BETA. In order to use Botpress in your Zaps please [click here to obtain access](https://zapier.com/developer/public-invite/179950/04ff1359293c7c382bbfe0806b1212f7/) to the private beta in Zapier.

---

The Zapier integration provides bidirectional webhook-based connectivity between your Botpress chatbot and Zapier, enabling you to trigger Zaps from your bot and receive events from Zapier workflows.

## Key Features

**Botpress → Zapier (Trigger Zaps)**

- Use the `trigger` action in your bot workflows to send data to Zapier REST hooks
- Automatically manages webhook subscriptions when Zaps are created or removed
- Supports correlation IDs for request/response tracking between Botpress and Zapier
- Automatically cleans up invalid webhook subscriptions (HTTP 410 Gone)

**Zapier → Botpress (Receive Events)**

- Receive events from Zapier workflows via webhook
- Events are automatically converted to Botpress events that can trigger your bot workflows
- Supports correlation IDs to correlate responses with trigger requests

## Use Cases

- **Trigger Zaps from your bot**: When a user completes an action in your chatbot, automatically trigger a Zap to update a CRM, send an email, create a task, etc.
- **Receive data from Zaps**: When a Zap runs (e.g., new lead in CRM, new email received), send that data to your bot to trigger conversations or updates
- **Bidirectional workflows**: Create complex automation flows where your bot and Zapier workflows work together seamlessly

This integration uses Zapier's REST hooks (webhooks) to enable real-time, event-driven communication between your Botpress chatbot and thousands of apps available in Zapier's ecosystem.
