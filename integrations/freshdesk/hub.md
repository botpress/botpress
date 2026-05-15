# Freshdesk

Connect Botpress to Freshdesk to manage support tickets and react to ticket lifecycle events from your bots.

## Ticket Properties

`status` and `priority` are represented as string enums. The integration handles conversion to Freshdesk's internal numeric values.

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

### Webhook setup

1. In your Freshdesk dashboard, go to **Admin → Automations**
2. Create a new rule for each event you want to receive
3. Under the rule's **Actions**, add a **Trigger Webhook** action
4. Set the **Request Type** to `POST` and **encoding** to `json`
5. Use the following URLs (replace `{webhook-url}` with the URL shown in Botpress after installing the integration):

| Event         | Webhook URL                    |
| ------------- | ------------------------------ |
| ticketCreated | `{webhook-url}/ticket-created` |
| ticketUpdated | `{webhook-url}/ticket-updated` |
| ticketReplied | `{webhook-url}/ticket-replied` |

6. _(Recommended)_ If you set a **Webhook Secret** in the integration configuration, add a custom request header named `X-Webhook-Secret` with that same value in each Freshdesk Automation webhook action. The integration will reject any webhook that omits or mismatches the secret.

7. In the webhook body, include at minimum the ticket fields your bot needs. The `ticket.id` field is **required** — webhooks missing it will be rejected. All other ticket fields are optional.

   For `ticketCreated` and `ticketUpdated`:

```json
{
  "ticket": {
    "id": "{{ticket.id}}",
    "subject": "{{ticket.subject}}",
    "status": "{{ticket.status_id}}",
    "priority": "{{ticket.priority_id}}",
    "requester_id": "{{ticket.requester.id}}",
    "responder_id": "{{ticket.agent.id}}",
    "group_id": "{{ticket.group.id}}",
    "type": "{{ticket.ticket_type}}"
  }
}
```

For `ticketReplied`, also include reply fields. The `reply.body` field is **required**:

```json
{
  "ticket": {
    "id": "{{ticket.id}}",
    "status": "{{ticket.status_id}}",
    "requester_id": "{{ticket.requester.id}}"
  },
  "reply": {
    "body": "{{ticket.latest_public_comment_html}}",
    "body_text": "{{ticket.latest_public_comment}}",
    "customer_email": "{{ticket.contact.email}}"
  }
}
```

## Human-in-the-Loop (HITL)

The Freshdesk integration supports the **HITL** interface, which lets your bot escalate a conversation to a human agent via a Freshdesk ticket. Install the **HITL** plugin in your Botpress bot to enable this feature.

### hitlTicket entity fields

| Field            | Type                                    | Description                                                                 |
| ---------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `priority`       | `low` \| `medium` \| `high` \| `urgent` | Ticket priority. Defaults to Low if not set.                                |
| `groupId`        | string                                  | Freshdesk group ID to assign the ticket to.                                 |
| `tags`           | string[]                                | Tags to apply to the ticket.                                                |
| `chatbotName`    | string                                  | Name shown in ticket notes sent by the bot. Defaults to `Botpress`.         |
| `requesterName`  | string                                  | Name of the requester. Required if the user is not yet a Freshdesk contact. |
| `requesterEmail` | string                                  | Email of the requester. Used together with `requesterName`.                 |

### HITL webhook setup

Two additional webhook paths notify Botpress when a ticket is assigned to an agent or resolved. Configure them as separate **Automation Rules** in Freshdesk (**Admin → Automations → Ticket Updates**):

#### `/hitl-assigned` — fires `hitlAssigned`

Trigger condition: **Agent Is Assigned**

Webhook body:

```json
{
  "ticket": { "id": "{{ticket.id}}" },
  "agent": { "id": "{{ticket.agent.id}}", "name": "{{ticket.agent.name}}" }
}
```

#### `/hitl-message-received` — routes agent reply into the Botpress conversation

Trigger condition: **Reply Sent By Agent** (use this condition specifically — it excludes notes added via the API, which would otherwise echo bot messages back)

Webhook body:

```json
{
  "ticket": { "id": "{{ticket.id}}" },
  "reply": { "body_text": "{{ticket.latest_public_comment}}" },
  "agent": { "id": "{{ticket.agent.id}}", "name": "{{ticket.agent.name}}" }
}
```

#### `/hitl-stopped` — fires `hitlStopped`

Trigger condition: **Status Is Resolved** OR **Status Is Closed**

Webhook body:

```json
{
  "ticket": { "id": "{{ticket.id}}" }
}
```

The `X-Webhook-Secret` header (optional) works identically to the other webhook paths.

## Limitations

- The Search Tickets action scans up to 4 pages (120 results) of Freshdesk search results before applying the `limit` cap
- Freshdesk webhook setup requires manual configuration via Automation Rules. The integration cannot create them automatically
- Deleted tickets can be found in the trash page of the Freshdesk UI and can be restored for up to 30 days
- Ticket attachments are not supported in this integration

## Changelog

- 0.3.0: Added HITL support — `startHitl`, `stopHitl`, and `createUser` actions; `hitlAssigned` and `hitlStopped` events; `hitl` channel for bot-to-ticket messaging.
- 0.1.0: Initial release with `createTicket`, `getTicket`, `listTickets`, `updateTicket`, `deleteTicket`, `addNote`, `searchTickets`, `searchContacts`, `getContact` actions and `ticketCreated`, `ticketUpdated`, `ticketReplied` events.
