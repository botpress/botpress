# Freshdesk

Connect Botpress to Freshdesk to manage support tickets and react to ticket lifecycle events from your bots.

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

## Human-in-the-Loop (HITL) |

Three additional webhook paths notify Botpress when a ticket is assigned to an agent or resolved. Configure them as separate **Automation Rules** in Freshdesk (**Admin → Automations → Ticket Updates**).

Tickets created by `startHitl` are tagged with `botpress-hitl`. Include ticket tags in each HITL webhook body; Botpress ignores HITL webhooks for tickets that do not have this tag.

### `/hitl-assigned` — fires `hitlAssigned`

Trigger condition: **Agent Is Assigned**

Webhook body:

```json
{
  "ticket": {
    "id": "{{ticket.id}}",
    "tags": "{{ticket.tags}}"
  },
  "agent": {
    "id": "{{ticket.agent.id}}",
    "name": "{{ticket.agent.name}}"
  }
}
```

### `/hitl-message-received` — routes agent note/comment into the Botpress conversation

Recommended trigger condition: **Public Note Added By Agent** or your Freshdesk account's equivalent public note/comment-added condition.

For HITL tickets, agents should add a public note/comment instead of using **Reply**. Freshdesk replies are email deliveries to the requester and can be marked as undelivered when the requester email is a Botpress/Webchat placeholder. Public notes/comments are routed to Webchat by this webhook and do not need Freshdesk email delivery.

Botpress messages are added to the ticket as public notes by the integration and prefixed as `[Botpress]: message` or `[Chatbot Name]: message`. When Freshdesk sends those public notes back to this webhook, Botpress checks for that prefix and confirms that the unprefixed message text already exists in the HITL conversation before ignoring it. This prevents Webchat messages from echoing back into the conversation while avoiding broad prefix-only filtering.

Webhook body:

```json
{
  "ticket": {
    "id": "{{ticket.id}}",
    "tags": "{{ticket.tags}}"
  },
  "note": {
    "body_text": "{{ticket.latest_public_comment}}"
  },
  "agent": {
    "id": "{{ticket.agent.id}}",
    "name": "{{ticket.agent.name}}"
  }
}
```

Human agent public notes that start with `[Name]:` are only ignored if the text after the prefix matches an existing HITL message. To avoid ambiguity, agents should still avoid starting notes with the Botpress-created note prefix format.

The legacy `reply.body_text` shape is still accepted for existing reply-based setups, but `note.body_text` is recommended for Webchat HITL.

### `/hitl-stopped` — fires `hitlStopped`

Trigger condition: **Status Is Resolved** OR **Status Is Closed**

Webhook body:

```json
{
  "ticket": {
    "id": "{{ticket.id}}",
    "tags": "{{ticket.tags}}"
  }
}
```

The `X-Webhook-Secret` header (optional) works identically to the other webhook paths.

## Limitations

- Freshdesk webhook setup requires manual configuration via Automation Rules. The integration cannot create them automatically
- Deleted tickets can be found in the trash page of the Freshdesk UI and can be restored for up to 30 days
- Ticket attachments are not supported in this integration

## Changelog

- 0.1.1: Added HITL support with `startHitl` and `stopHitl`; `hitlAssigned`, `hitlMessageReceived`, and `hitlStopped` webhook handling; `hitl` channel for Webchat-to-ticket messaging. Added `replyToTicket` action.
- 0.1.0: Initial release with `createTicket`, `getTicket`, `listTickets`, `updateTicket`, `deleteTicket`, `addNote`, `searchTickets`, `searchContacts`, `getContact` actions and `ticketCreated`, `ticketUpdated`, `ticketReplied` events.
