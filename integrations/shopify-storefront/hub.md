Connect your Botpress chatbot with the Shopify Storefront API to power buyer-facing shopping experiences: browse products, navigate collections, and manage carts and checkout. The integration auto-provisions a Storefront API access token during OAuth so no additional configuration is required.

For back-office access to products, customers, and orders — plus order webhooks — use the separate **Shopify Admin** integration.

## Setup

When you connect the integration, the setup wizard asks how you want to connect: with OAuth, or with the credentials of a Shopify app you create yourself.

### OAuth

1. Install the Shopify Storefront integration in your bot and start the setup wizard.
2. Select **Connect with OAuth**.
3. Enter your Shopify store domain (e.g. `my-store.myshopify.com`) when prompted.
4. Click **Authorize** to connect via OAuth. You will be redirected to Shopify to grant permissions.

Once authorized, the integration creates a Storefront API access token for this bot and stores it securely. No additional configuration is required.

### Your own Shopify app

#### Create the app

1. Open the [Shopify Dev Dashboard](https://dev.shopify.com/dashboard) and go to **Apps**.
2. Click **Create app**, then select **Create app manually**.
3. Enter a name for the app. Leave the URLs empty.
4. In the **API Access** section, add the Storefront API scopes `unauthenticated_read_product_listings`, `unauthenticated_read_checkouts`, and `unauthenticated_write_checkouts`.
5. Click **Create app**, then click **Release**.

#### Install the app on your store

1. Go back to the **App overview**.
2. Click **Install app** in the top right corner.

#### Connect the integration in Botpress

1. In Botpress, install the Shopify Storefront integration and start the setup wizard.
2. Select **Use my own Shopify app**. The wizard repeats the steps above for reference.
3. Enter your store domain (e.g. `my-store.myshopify.com`), and copy the app's **Client ID** and **Client Secret** from its settings in the Dev Dashboard.

You can find your store domain in **Settings → Domains** in the Shopify admin. Use the `.myshopify.com` domain, not a custom domain.

The integration uses these credentials once, to create a Storefront API access token for this bot, and doesn't store them. If you uninstall the app, run the setup wizard again.

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
