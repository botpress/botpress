# n8n

This integration connects your Botpress bot to n8n, letting you trigger workflows from your bot and receive results back as events.

## Configuration

| Field          | Description                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Base URL**   | Root URL of your n8n instance, e.g. `https://example.app.n8n.cloud`                                                             |
| **Access Key** | Your n8n API key, found under **Settings → n8n API** (requires a paid n8n plan, this option is not available on the free trial) |

## Actions

### List Workflows

Retrieves all workflows from your n8n instance. Supports filtering by name, active state, tags, and project ID, with cursor-based pagination.

### Get Workflow

Fetches a single workflow by its ID.

### Trigger Workflow

Triggers an n8n workflow by ID or name. Botpress automatically resolves the workflow's webhook URL — you do not need to find or provide it manually.

**Inputs:**

| Field              | Description                                                                             |
| ------------------ | --------------------------------------------------------------------------------------- |
| `workflowIdOrName` | The n8n workflow ID or name                                                             |
| `conversationId`   | Use `{{conversation.id}}` — passed to n8n so it can call back to the right conversation |
| `payload`          | Optional JSON data to send to the workflow                                              |

The workflow must contain an `n8n-nodes-base.webhook` node with a path parameter. Botpress finds this node, extracts the path, and POSTs to `{baseUrl}/webhook/{path}` automatically.

## n8n Event trigger

Use the **n8n Event** trigger card in your bot flow to receive data back from n8n.

When n8n finishes processing, add an **HTTP Request** node at the end of your n8n workflow that POSTs to the integration's webhook URL with this body.

You can find the webhook URL in your Botpress dashboard under **Integrations → n8n → Webhook URL**.

```json
{
  "conversationId": "{{$json.conversationId}}",
  "workflowId": "{{$workflow.id}}",
  "workflowName": "{{$workflow.name}}",
  "data": {
    "anyKey": "anyValue"
  }
}
```

The event exposes the following fields in your bot flow:

| Field                          | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| `event.payload.data`           | The data object sent by n8n                                               |
| `event.payload.conversationId` | The original conversation ID (use this to route replies back to the user) |
| `event.payload.workflowId`     | The n8n workflow ID                                                       |
| `event.payload.workflowName`   | The n8n workflow name                                                     |
