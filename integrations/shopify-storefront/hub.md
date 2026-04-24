Connect your Botpress chatbot with the Shopify Storefront API to power buyer-facing shopping experiences: browse products, navigate collections, and manage carts and checkout. The integration auto-provisions a Storefront API access token during OAuth so no additional configuration is required.

For back-office access to products, customers, and orders — plus order webhooks — use the separate **Shopify Admin** integration.

## Setup

1. Install the Shopify Storefront integration in your bot.
2. Enter your Shopify store domain (e.g. `my-store.myshopify.com`) when prompted.
3. Click **Authorize** to connect via OAuth. You will be redirected to Shopify to grant permissions.

Once authorized, the integration creates a Storefront API access token for this bot and stores it securely. No additional configuration is required.

## Actions

These actions use the Shopify Storefront API to power customer-facing shopping experiences.

### Product and Collection Browsing

- **Search Products** — Search the public product catalog by keyword with pagination support.
- **Get Product** — Retrieve a product by its URL handle or GID, including pricing and availability.
- **List Collections** — List all product collections with pagination.
- **Get Collection** — Retrieve a collection by handle or GID, along with its products.

### Cart Management

- **Create Cart** — Create a new shopping cart with line items. Optionally attach a buyer email, country code, discount codes, and a note. Returns a `checkoutUrl` that you can send to the customer.
- **Get Cart** — Retrieve the current state of a cart by its GID.
- **Add Cart Lines** — Add additional items to an existing cart.
- **Apply Cart Discount** — Apply or update discount codes on a cart.

## Limitations

- Pagination uses cursor-based navigation. To retrieve the next page of results, pass the `after` cursor from the previous response's `pageInfo`.
- Cart actions create Storefront API carts. Removing individual line items or updating quantities on existing lines is not yet supported; create a new cart instead.
