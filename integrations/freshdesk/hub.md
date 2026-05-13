# Freshdesk

Connect Botpress to Freshdesk to manage support tickets and react to ticket lifecycle events from your bots.

## Prerequisites

- A Freshdesk account with agent or admin access
- Your Freshdesk **subdomain** (e.g. `yourcompany` from `yourcompany.freshdesk.com`)
- A Freshdesk **API key** (found under your profile avatar → Profile Settings → API Key)

## Configuration

| Field                | Description                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Freshdesk Domain** | Your subdomain only — not the full URL. Example: `acme`                                                                                                                |
| **API Key**          | Your personal API key from Freshdesk Profile Settings                                                                                                                  |
| **Webhook Secret**   | Optional. A secret string used to authenticate incoming webhooks. Set it here and add it as the `X-Webhook-Secret` header in each Freshdesk Automation webhook action. |

## Actions

### Create Ticket

Creates a new support ticket.

**Input**

| Field           | Type                                          | Required | Default  | Description                       |
| --------------- | --------------------------------------------- | -------- | -------- | --------------------------------- |
| `subject`       | string                                        | Yes      |          | Subject of the ticket             |
| `description`   | string                                        | Yes      |          | HTML content of the ticket body   |
| `email`         | string                                        | Yes      |          | Requester email address           |
| `priority`      | `low` \| `medium` \| `high` \| `urgent`       | No       | `medium` | Ticket priority                   |
| `status`        | `open` \| `pending` \| `resolved` \| `closed` | No       | `open`   | Ticket status                     |
| `tags`          | string[]                                      | No       |          | Tags to associate with the ticket |
| `custom_fields` | record                                        | No       |          | Custom field key-value pairs      |

**Output**

| Field       | Type   | Description                           |
| ----------- | ------ | ------------------------------------- |
| `id`        | number | Unique Freshdesk ticket ID            |
| `subject`   | string | Subject of the ticket                 |
| `status`    | string | Ticket status as a string enum        |
| `priority`  | string | Ticket priority as a string enum      |
| `createdAt` | string | ISO 8601 timestamp of ticket creation |
| `url`       | string | URL to view the ticket in Freshdesk   |

### Get Ticket

Retrieves a single Freshdesk ticket by ID.

**Input**

| Field      | Type   | Required | Description             |
| ---------- | ------ | -------- | ----------------------- |
| `ticketId` | string | Yes      | The Freshdesk ticket ID |

**Output**

| Field          | Type     | Description                            |
| -------------- | -------- | -------------------------------------- |
| `id`           | number   | Unique Freshdesk ticket ID             |
| `subject`      | string   | Subject of the ticket                  |
| `description`  | string   | HTML content of the ticket description |
| `status`       | string   | Ticket status enum                     |
| `priority`     | string   | Ticket priority enum                   |
| `requesterId`  | number   | Freshdesk requester user ID            |
| `responderId`  | number   | Agent assigned to the ticket           |
| `groupId`      | number   | Group the ticket is assigned to        |
| `createdAt`    | string   | ISO 8601 timestamp of ticket creation  |
| `updatedAt`    | string   | ISO 8601 timestamp of last update      |
| `tags`         | string[] | Tags associated with the ticket        |
| `customFields` | record   | Custom field key-value pairs           |

### List Tickets

Returns a paginated list of tickets. Supports predefined filters (`new_and_my_open`, `watching`, `spam`, `deleted`), sorting, and pagination (`page`, `per_page` up to 100).

### Update Ticket

Updates an existing Freshdesk ticket.

**Input**

| Field           | Type                                          | Required | Description                             |
| --------------- | --------------------------------------------- | -------- | --------------------------------------- |
| `ticketId`      | string                                        | Yes      | The Freshdesk ticket ID to update       |
| `status`        | `open` \| `pending` \| `resolved` \| `closed` | No       | Updated ticket status                   |
| `priority`      | `low` \| `medium` \| `high` \| `urgent`       | No       | Updated ticket priority                 |
| `responderId`   | number                                        | No       | ID of the agent to assign the ticket to |
| `groupId`       | number                                        | No       | ID of the group to assign the ticket to |
| `custom_fields` | record                                        | No       | Custom field key-value pairs            |

**Output**

| Field       | Type   | Description                       |
| ----------- | ------ | --------------------------------- |
| `id`        | number | Unique Freshdesk ticket ID        |
| `status`    | string | Updated ticket status enum        |
| `priority`  | string | Updated ticket priority enum      |
| `updatedAt` | string | ISO 8601 timestamp of last update |

### Reply to Ticket

Sends a customer-facing reply on a ticket.

**Input**

| Field       | Type     | Required | Description                         |
| ----------- | -------- | -------- | ----------------------------------- |
| `ticketId`  | string   | Yes      | The Freshdesk ticket ID to reply to |
| `body`      | string   | Yes      | HTML content of the reply           |
| `cc_emails` | string[] | No       | Email addresses to CC on the reply  |

**Output**

| Field       | Type   | Description                          |
| ----------- | ------ | ------------------------------------ |
| `id`        | number | Unique ID of the reply               |
| `body`      | string | HTML content of the reply            |
| `createdAt` | string | ISO 8601 timestamp of reply creation |

### Add Note

Adds an internal note to a ticket. Notes are private by default (not visible to the requester).

**Input**

| Field      | Type    | Required | Default | Description                            |
| ---------- | ------- | -------- | ------- | -------------------------------------- |
| `ticketId` | string  | Yes      |         | The Freshdesk ticket ID                |
| `body`     | string  | Yes      |         | HTML content of the note               |
| `private`  | boolean | No       | `true`  | Set to `false` to make the note public |

**Output**

| Field       | Type   | Description                         |
| ----------- | ------ | ----------------------------------- |
| `id`        | number | Unique ID of the note               |
| `body`      | string | HTML content of the note            |
| `createdAt` | string | ISO 8601 timestamp of note creation |

### Delete Ticket

Soft-deletes a ticket (it can be restored from the Freshdesk UI). Returns no data on success.

**Input**

| Field      | Type   | Required | Description             |
| ---------- | ------ | -------- | ----------------------- |
| `ticketId` | string | Yes      | The Freshdesk ticket ID |

### Search Tickets

Searches Freshdesk tickets by status, priority, agent, or tag. Returns up to 100 results.

**Input**

| Field      | Type                                          | Required | Default | Description                         |
| ---------- | --------------------------------------------- | -------- | ------- | ----------------------------------- |
| `status`   | `open` \| `pending` \| `resolved` \| `closed` | No       |         | Filter by ticket status             |
| `priority` | `low` \| `medium` \| `high` \| `urgent`       | No       |         | Filter by ticket priority           |
| `agent_id` | number                                        | No       |         | Filter by assigned agent ID         |
| `tag`      | string                                        | No       |         | Filter by tag                       |
| `limit`    | number                                        | No       | 20      | Maximum tickets to return (max 100) |

**Output**

| Field                      | Type   | Description                           |
| -------------------------- | ------ | ------------------------------------- |
| `tickets[].id`             | number | Unique Freshdesk ticket ID            |
| `tickets[].subject`        | string | Subject of the ticket                 |
| `tickets[].status`         | string | Ticket status enum                    |
| `tickets[].priority`       | string | Ticket priority enum                  |
| `tickets[].createdAt`      | string | ISO 8601 timestamp of ticket creation |
| `tickets[].requesterEmail` | string | Email address of the requester        |

### Get Contact

Retrieves a Freshdesk contact by ID.

**Input**

| Field       | Type   | Required | Description              |
| ----------- | ------ | -------- | ------------------------ |
| `contactId` | string | Yes      | The Freshdesk contact ID |

**Output**

| Field       | Type     | Description                            |
| ----------- | -------- | -------------------------------------- |
| `id`        | number   | Unique Freshdesk contact ID            |
| `name`      | string   | Full name of the contact               |
| `email`     | string   | Email address of the contact           |
| `phone`     | string   | Phone number of the contact            |
| `mobile`    | string   | Mobile number of the contact           |
| `companyId` | number   | ID of the associated company           |
| `tags`      | string[] | Tags associated with the contact       |
| `createdAt` | string   | ISO 8601 timestamp of contact creation |

### Search Contacts

Finds contacts by email or name. Use `email` for exact match; use `name` for prefix-based search (case-insensitive). If both `email` and `name` are provided, `email` takes precedence.

**Input**

| Field   | Type   | Required | Description                           |
| ------- | ------ | -------- | ------------------------------------- |
| `email` | string | No       | Filter by exact email address         |
| `name`  | string | No       | Search by name prefix (e.g. `"John"`) |

**Output**

| Field                  | Type   | Description                  |
| ---------------------- | ------ | ---------------------------- |
| `contacts[].id`        | number | Unique Freshdesk contact ID  |
| `contacts[].name`      | string | Full name of the contact     |
| `contacts[].email`     | string | Email address of the contact |
| `contacts[].phone`     | string | Phone number of the contact  |
| `contacts[].companyId` | number | ID of the associated company |

## Ticket Properties

All actions accept `status` and `priority` as string enums. The integration handles conversion to Freshdesk's internal numeric values.

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
| ticketReplied | `{webhook-url}/ticket-replied` |

6. _(Recommended)_ If you set a **Webhook Secret** in the integration configuration, add a custom request header named `X-Webhook-Secret` with that same value in each Freshdesk Automation webhook action. The integration will reject any webhook that omits or mismatches the secret.

7. In the webhook body, include at minimum the ticket fields your bot needs. Example JSON template:

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

- The Search Tickets action scans up to 4 pages (120 results) of Freshdesk search results before applying the `limit` cap
- Freshdesk webhook setup requires manual configuration via Automation Rules — the integration cannot create them automatically
- Deleted tickets are soft-deleted and can be restored via the Freshdesk UI
- Ticket attachments are not supported in this integration

## Changelog

- 0.2.0: Added replyToTicket, addNote, getContact, searchContacts actions. Renamed `customFields` to `custom_fields` for consistency with Freshdesk API.
- 0.1.0: Initial release with createTicket, getTicket, listTickets, updateTicket, deleteTicket, searchTickets actions and ticketCreated, ticketUpdated, ticketReplied events.
