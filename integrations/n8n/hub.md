# n8n

This integration connects your Botpress bot to n8n, letting you trigger workflows from your bot and receive results back as events.

## Prerequisites

- An n8n instance
- An n8n API key — found under **Settings → n8n API**. Generating an API key requires a paid n8n plan and is not available on the free trial.

## Receiving data back from n8n

To send data back to Botpress after an n8n workflow finishes, add an **HTTP Request** node at the end of your workflow and configure it to POST to your integration's webhook URL.

You can find the webhook URL in your Botpress dashboard under **Integrations → n8n → Webhook URL**.

**Trigger Workflow** automatically sends `conversationId` to n8n, so `{{ $json.body.conversationId }}` is available in your workflow without any extra configuration.
Set the action's **Conversation ID** input to `{{ event.conversationId }}`.

Set the request body to:

```json
{
  "conversationId": "{{ $json.body.conversationId }}",
  "workflowId": "{{ $workflow.id }}",
  "workflowName": "{{ $workflow.name }}",
  "data": {
    "anyKey": "anyValue"
  }
}
```

## Limitations

- **Trigger Workflow** only works on workflows that have a **Webhook** node (`n8n-nodes-base.webhook`) with a path configured.
- **List Workflows** returns a paginated response. Use the `limit` and `cursor` inputs to page through results for many workflows.
