# Freshdesk

Connect Botpress to Freshdesk to manage support tickets and react to ticket lifecycle events from your bots.

## Prerequisites

- A Freshdesk account with agent or admin access
- Your Freshdesk **subdomain** (e.g. `yourcompany` from `yourcompany.freshdesk.com`)
- A Freshdesk **API key** (found under your profile avatar → Profile Settings → API Key)

## Configuration

| Field                | Description                                             |
| -------------------- | ------------------------------------------------------- |
| **Freshdesk Domain** | Your subdomain only — not the full URL. Example: `acme` |
| **API Key**          | Your personal API key from Freshdesk Profile Settings   |

## Actions

### Create Ticket

Creates a new support ticket. At least one requester identifier must be provided (`email`, `phone`, `twitter_id`, `facebook_id`, `unique_external_id`, or `requester_id`).

### Get Ticket

Retrieves a single ticket by its numeric ID. Use the `include` parameter to embed additional data:

- `conversations` — up to 10 most recent replies
- `requester` — requester email, name, and phone
- `company` — company name
- `stats` — resolved/closed timestamps

### List Tickets

Returns a paginated list of tickets. Supports predefined filters (`new_and_my_open`, `watching`, `spam`, `deleted`), sorting, and pagination (`page`, `per_page` up to 100).

### Update Ticket

Updates any fields on an existing ticket. Common use cases: changing `status` or `priority`, reassigning via `responder_id` or `group_id`.

### Delete Ticket

Soft-deletes a ticket (it can be restored from the Freshdesk UI). Returns no data on success.

### Search Tickets

Queries tickets using Freshdesk's search syntax. Results are paginated (max 10 pages, 30 results per page).

**Query examples:**

```
priority:3
status:2 AND priority:4
tag:'billing' AND status:2
agent_id:null
type:'Question' OR type:'Problem'
due_by:>'2024-01-01' AND due_by:<'2024-12-31'
```

## Ticket Properties

| Status   | Value |
| -------- | ----- |
| Open     | 2     |
| Pending  | 3     |
| Resolved | 4     |
| Closed   | 5     |

| Priority | Value |
| -------- | ----- |
| Low      | 1     |
| Medium   | 2     |
| High     | 3     |
| Urgent   | 4     |

## Events

Events are triggered by Freshdesk **Automation Rules** which you configure manually. Each event corresponds to a different webhook path.

### ticketCreated

Fires when a new ticket is opened. Set up an Automation Rule under **Admin → Automations → Ticket Creation**.

### ticketUpdated

Fires when a ticket is updated (status change, reassignment, priority change, etc.). Set up a rule under **Admin → Automations → Ticket Updates**.

### agentReplied

Fires when an agent adds a reply or note to a ticket. Set up a rule under **Admin → Automations → Ticket Updates**, with a condition that triggers on new replies.

### Webhook setup

1. In your Freshdesk dashboard, go to **Admin → Automations**
2. Create a new rule for each event you want to receive
3. Under the rule's **Actions**, add a **Trigger Webhook** action
4. Set the **Request Type** to `POST` and **Content Type** to `application/json`
5. Use the following URLs (replace `{webhook-url}` with the URL shown in Botpress after installing the integration):

| Event         | Webhook URL                    |
| ------------- | ------------------------------ |
| ticketCreated | `{webhook-url}/ticket-created` |
| ticketUpdated | `{webhook-url}/ticket-updated` |
| agentReplied  | `{webhook-url}/agent-replied`  |

6. In the webhook body, include at minimum the ticket fields your bot needs. Example JSON template:

```json
{
  "ticket": {
    "id": "{{ticket.id}}",
    "subject": "{{ticket.subject}}",
    "status": {{ticket.status}},
    "priority": {{ticket.priority}},
    "responder_id": {{ticket.agent.id}}
  }
}
```

For `agentReplied`, also include reply fields:

```json
{
  "ticket": { "id": "{{ticket.id}}", "status": {{ticket.status}} },
  "reply": {
    "body": "{{ticket.latest_public_comment_html}}",
    "body_text": "{{ticket.latest_public_comment}}",
    "agent_id": {{ticket.agent.id}}
  }
}
```

## Limitations

- The Search Tickets action supports a maximum of 10 pages of results
- Freshdesk webhook setup requires manual configuration via Automation Rules — the integration cannot create them automatically
- Deleted tickets are soft-deleted and can be restored via the Freshdesk UI
- Ticket attachments are not supported in this integration

## Changelog

- 0.1.0: Initial release with createTicket, getTicket, listTickets, updateTicket, deleteTicket, searchTickets actions and ticketCreated, ticketUpdated, agentReplied events.
