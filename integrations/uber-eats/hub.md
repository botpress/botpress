# Uber Eats

The **Uber Eats integration** allows your Botpress bot to interact with Uber Eats orders and delivery lifecycle events.

It supports:
- Fetching and listing orders
- Accepting or denying incoming orders
- Marking orders as ready for pickup
- Reacting to real-time Uber Eats webhook events (order created, delivery state changes, failures, etc.)

This integration uses an **OpenAPI-generated Uber Eats client** under the hood and securely manages OAuth tokens via Botpress integration state.

---

## Configuration

To use this integration, you must have an **Uber Eats merchant account** with API access enabled.

### Required configuration

You will need to provide the following values when configuring the integration:

- **Client ID**  
  Your Uber developer application client ID.

- **Client Secret**  
  Your Uber developer application client secret.

- **Store ID**  
  The Uber Eats store ID associated with your merchant account.  
  This is used as the default store when listing or managing orders.

The integration automatically:
- Requests OAuth access tokens using the *client credentials* flow
- Caches tokens securely in integration state
- Refreshes tokens when they expire

No additional manual authentication steps are required.

---

## Usage

### Actions

This integration exposes the following actions to bot developers:

#### **Get Order**
Fetch a single Uber Eats order by ID.

- **Input**
  - `orderId` – The Uber Eats order ID

- **Output**
  - Full order object returned by the Uber Eats API

---

#### **List Store Orders**
List orders for a store with optional filters.

- **Input**
  - `state` (optional) – Filter by order state(s)
  - `status` (optional) – Filter by order status(es)

- **Output**
  - List of orders for the configured store

---

#### **Accept Order**
Accept an incoming Uber Eats order.

- **Input**
  - `orderId`

---

#### **Deny Order**
Deny an Uber Eats order.

- **Input**
  - `orderId`
  - `reason` (optional)

---

#### **Mark Order Ready**
Mark an order as ready for pickup.

- **Input**
  - `orderId`

---

### Events (Webhooks)

The integration listens to Uber Eats webhooks and emits structured Botpress events, including:

- **Orders Notification**
- **Scheduled Orders Notification**
- **Order Release**
- **Order Failure**
- **Fulfillment Issues Resolved**
- **Delivery State Changed**

These events can be used to:
- Trigger workflows when new orders arrive
- Update conversations when delivery status changes
- Notify operators of failures or required actions

Webhook requests are authenticated using Uber’s HMAC signature mechanism.

---

## Security

- OAuth access tokens are stored securely using Botpress integration state
- Webhook requests are verified using Uber’s `X-Uber-Signature` header
- Only redacted, user-safe errors are exposed to bot developers
- Internal errors and API failures are logged for debugging

---

## Limitations

- This integration supports **order and delivery operations only**
- Menu management and catalog APIs are not currently implemented
- Uber Eats API rate limits apply and are enforced by Uber
- Some order actions are **time-sensitive** (e.g. accept/deny must be called within Uber’s SLA)

---

## Changelog

### 0.1.0
- Initial release
- Implemented order retrieval and management actions
- Implemented webhook event handling
- OAuth token management with automatic refresh
- OpenAPI-generated Uber Eats client integration

---

## Integration publication checklist

- [x] The register handler validates Uber Eats credentials
- [x] Title and descriptions for all schemas are present
- [x] Events expose structured, typed payloads
- [x] Webhook security verification implemented
- [x] Runtime errors are user-safe and redacted
- [x] OAuth tokens are stored securely in integration state
