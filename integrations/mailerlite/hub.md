# MailerLite Integration

Manage your MailerLite subscribers directly from Botpress. Create or update subscribers, look them up by id/email, delete them, and react to new-subscriber webhooks.

## Features

- Fetch a subscriber by id or email
- Create or upsert a subscriber (standard and custom fields)
- Delete a subscriber by id
- Receive the `subscriber.created` webhook as a Botpress event

## Prerequisites

- MailerLite API key with access to Subscribers and Webhooks

## Setup

1. Install this integration in your Botpress workspace.
2. Configure the API Key in the integration settings.
3. Enable the integration. On register, a MailerLite webhook will be created pointing to your integration handler.

## Actions

### fetchSubscriber

- Input: `{ id?: string, email?: string }` (provide at least one)
- Output: Subscriber
- Notes: Throws a friendly error if neither id nor email is provided. If not found, returns a clear "not found" error.

### createOrUpsertSubscriber

- Input:
  - `email` (required)
  - Optional profile fields: `name, last_name, company, country, city, phone, state, zip`
  - Optional `customFields` (stringified JSON) or provide additional fields directly; all non-email properties are mapped to `fields`.
- Output: Subscriber
- Notes: Creates a new subscriber or updates an existing one when the email already exists.

### deleteSubscriber

- Input: `{ id: string }`
- Output: `{ success: boolean, message: string }`
- Notes: Returns `success: false` if the subscriber does not exist.

## Events

### subscriberCreated

- Emitted when MailerLite sends a `subscriber.created` webhook.
- Payload: Subscriber (normalized; extra properties ignored).

## Data model (Subscriber)

The subscriber payload aligns with MailerLite's API:

- Core fields: `id, email, status, source, sent, opens_count, clicks_count, open_rate, click_rate, ip_address, subscribed_at, unsubscribed_at, created_at, updated_at`
- Nested `fields`: custom profile fields (e.g., `name, last_name, company, country, city, phone, state, zip`) and any additional custom keys

## Troubleshooting

- 404 on fetch/delete: The subscriber does not exist. Verify the id/email.
- Validation errors (Zod): Ensure numeric counters/nullable fields match the API, and `customFields` is valid JSON when provided.
- Webhook registration fails: Check that your API key is valid and the integration is reachable from the internet.

## Uninstall

Disabling/uninstalling the integration will attempt to clean up the webhook created during registration.
