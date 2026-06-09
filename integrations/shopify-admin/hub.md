Connect your Botpress chatbot with the Shopify Admin API to give your bot back-office access to your store: browse products, look up orders, and search customers. Order webhooks fire in real time so your bot can react to new, updated, cancelled, fulfilled, and paid orders.

For the public-facing shopping experience (product browsing, collections, cart/checkout) use the separate **Shopify Storefront** integration.

## Setup

1. Install the Shopify Admin integration in your bot.
2. Enter your Shopify store domain (e.g. `my-store.myshopify.com`) when prompted.
3. Click **Authorize** to connect via OAuth. You will be redirected to Shopify to grant permissions.

Once authorized, the integration registers webhooks for order events. No additional configuration is required.

## Actions

These actions use the Shopify Admin API to access back-office data such as internal product details, customer records, and order history.

- **List Products** — Search and list products with optional query filtering and cursor-based pagination.
- **Get Product** — Retrieve a single product and its variants by Shopify GID (e.g. `gid://shopify/Product/12345`).
- **Search Customers** — Search for customers by email, name, or phone number.
- **Get Order** — Retrieve full order details including line items and customer information by order GID.
- **List Customer Orders** — List orders for a specific customer, optionally filtered by status (`open`, `closed`, `cancelled`, or `any`).

## Events

The integration automatically listens for Shopify order webhooks. Your bot can respond to the following events:

- **Order Created** — Triggered when a new order is placed.
- **Order Updated** — Triggered when an order is modified.
- **Order Cancelled** — Triggered when an order is cancelled.
- **Order Fulfilled** — Triggered when all items in an order are fulfilled.
- **Order Paid** — Triggered when payment for an order is confirmed.

## Limitations

- Only order-related webhook events are currently supported. Product, customer, and inventory webhooks are not available in this version.
- Pagination uses cursor-based navigation. To retrieve the next page of results, pass the `after` cursor from the previous response's `pageInfo`.
