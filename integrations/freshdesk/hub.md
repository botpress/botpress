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

Creates a new support ticket.

**Input**

| Field          | Type             | Required | Default  | Description                        |
| -------------- | ---------------- | -------- | -------- | ---------------------------------- |
| `subject`      | string           | Yes      |          | Subject of the ticket              |
| `description`  | string           | Yes      |          | HTML content of the ticket body    |
| `email`        | string           | Yes      |          | Requester email address            |
| `priority`     | `low` \| `medium` \| `high` \| `urgent` | No | `medium` | Ticket priority |
| `status`       | `open` \| `pending` \| `resolved` \| `closed` | No | `open` | Ticket status |
| `tags`         | string[]         | No       |          | Tags to associate with the ticket  |
| `customFields` | record           | No       |          | Custom field key-value pairs       |

**Output**

| Field       | Type   | Description                              |
| ----------- | ------ | ---------------------------------------- |
| `id`        | number | Unique Freshdesk ticket ID               |
| `subject`   | string | Subject of the ticket                    |
| `status`    | string | Ticket status as a string enum           |
| `priority`  | string | Ticket priority as a string enum         |
| `createdAt` | string | ISO 8601 timestamp of ticket creation    |
| `url`       | string | URL to view the ticket in Freshdesk      |

### Get Ticket

Retrieves a single Freshdesk ticket by ID.

**Input**

| Field      | Type   | Required | Description           |
| ---------- | ------ | -------- | --------------------- |
| `ticketId` | string | Yes      | The Freshdesk ticket ID |

**Output**

| Field         | Type     | Description                                  |
| ------------- | -------- | -------------------------------------------- |
| `id`          | number   | Unique Freshdesk ticket ID                   |
| `subject`     | string   | Subject of the ticket                        |
| `description` | string   | HTML content of the ticket description       |
| `status`      | string   | Ticket status enum                           |
| `priority`    | string   | Ticket priority enum                         |
| `requesterId` | number   | Freshdesk requester user ID                  |
| `responderId` | number   | Agent assigned to the ticket                 |
| `groupId`     | number   | Group the ticket is assigned to              |
| `createdAt`   | string   | ISO 8601 timestamp of ticket creation        |
| `updatedAt`   | string   | ISO 8601 timestamp of last update            |
| `tags`        | string[] | Tags associated with the ticket              |
| `customFields`| record   | Custom field key-value pairs                 |

### List Tickets

Returns a paginated list of tickets. Supports predefined filters (`new_and_my_open`, `watching`, `spam`, `deleted`), sorting, and pagination (`page`, `per_page` up to 100).

### Update Ticket

Updates an existing Freshdesk ticket.

**Input**

| Field          | Type             | Required | Description                              |
| -------------- | ---------------- | -------- | ---------------------------------------- |
| `ticketId`     | string           | Yes      | The Freshdesk ticket ID to update        |
| `status`       | `open` \| `pending` \| `resolved` \| `closed` | No | Updated ticket status |
| `priority`     | `low` \| `medium` \| `high` \| `urgent` | No | Updated ticket priority |
| `responderId`  | number           | No       | ID of the agent to assign the ticket to  |
| `groupId`      | number           | No       | ID of the group to assign the ticket to  |
| `customFields` | record           | No       | Custom field key-value pairs             |

**Output**

| Field       | Type   | Description                           |
| ----------- | ------ | ------------------------------------- |
| `id`        | number | Unique Freshdesk ticket ID            |
| `status`    | string | Updated ticket status enum            |
| `priority`  | string | Updated ticket priority enum          |
| `updatedAt` | string | ISO 8601 timestamp of last update     |

### Delete Ticket

Soft-deletes a ticket (it can be restored from the Freshdesk UI). Returns no data on success.

### Search Tickets

Searches Freshdesk tickets by email, status, or priority. Returns up to 100 results.

**Input**

| Field      | Type             | Required | Default | Description                              |
| ---------- | ---------------- | -------- | ------- | ---------------------------------------- |
| `email`    | string           | No       |         | Filter by requester email address        |
| `status`   | `open` \| `pending` \| `resolved` \| `closed` | No | | Filter by ticket status |
| `priority` | `low` \| `medium` \| `high` \| `urgent` | No | | Filter by ticket priority |
| `limit`    | number           | No       | 20      | Maximum tickets to return (max 100)      |

**Output**

| Field                    | Type   | Description                           |
| ------------------------ | ------ | ------------------------------------- |
| `tickets[].id`           | number | Unique Freshdesk ticket ID            |
| `tickets[].subject`      | string | Subject of the ticket                 |
| `tickets[].status`       | string | Ticket status enum                    |
| `tickets[].priority`     | string | Ticket priority enum                  |
| `tickets[].createdAt`    | string | ISO 8601 timestamp of ticket creation |
| `tickets[].requesterEmail` | string | Email address of the requester      |

## Ticket Properties

The Create Ticket action accepts `status` and `priority` as string enums. Other actions (Update Ticket, Search Tickets) use the raw Freshdesk numeric values.

| Status   | String value | Numeric value |
| -------- | ------------ | ------------- |
| Open     | `open`       | 2             |
| Pending  | `pending`    | 3             |
| Resolved | `resolved`   | 4             |
| Closed   | `closed`     | 5             |

| Priority | String value | Numeric value |
| -------- | ------------ | ------------- |
| Low      | `low`        | 1             |
| Medium   | `medium`     | 2             |
| High     | `high`       | 3             |
| Urgent   | `urgent`     | 4             |

## Events

Events are triggered by Freshdesk **Automation Rules** which you configure manually. Each event corresponds to a different webhook path.

### ticketCreated

Fires when a new ticket is opened. Set up an Automation Rule under **Admin → Automations → Ticket Creation**.

### ticketUpdated

Fires when a ticket is updated (status change, reassignment, priority change, etc.). Set up a rule under **Admin → Automations → Ticket Updates**.

### ticketReplied

Fires when a customer adds a reply to a ticket. Set up a rule under **Admin → Automations → Ticket Updates**, with a condition that triggers on new replies.

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
| ticketReplied  | `{webhook-url}/ticket-replied`  |

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

For `ticketReplied`, also include reply fields:

```json
{
  "ticket": { "id": "{{ticket.id}}", "status": {{ticket.status}} },
  "reply": {
    "body": "{{ticket.latest_public_comment_html}}",
    "body_text": "{{ticket.latest_public_comment}}",
    "customer_email": "{{ticket.contact.email}}"
  }
}
```

## Limitations

- The Search Tickets action supports a maximum of 10 pages of results
- Freshdesk webhook setup requires manual configuration via Automation Rules — the integration cannot create them automatically
- Deleted tickets are soft-deleted and can be restored via the Freshdesk UI
- Ticket attachments are not supported in this integration

## Changelog

- 0.1.0: Initial release with createTicket, getTicket, listTickets, updateTicket, deleteTicket, searchTickets actions and ticketCreated, ticketUpdated, ticketReplied events.
