Connect your Botpress chatbot with the Shopify Admin API to give your bot back-office access to your store: browse products, look up orders, and search customers. Order webhooks fire in real time so your bot can react to new, updated, cancelled, fulfilled, and paid orders.

For the public-facing shopping experience (product browsing, collections, cart/checkout) use the separate **Shopify Storefront** integration.

## Setup

When you connect the integration, the setup wizard asks how you want to connect: with OAuth, or with the credentials of a Shopify app you create yourself.

### OAuth

1. Install the Shopify Admin integration in your bot and start the setup wizard.
2. Select **Connect with OAuth**.
3. Enter your Shopify store domain (e.g. `my-store.myshopify.com`) when prompted.
4. Click **Authorize** to connect via OAuth. You will be redirected to Shopify to grant permissions.

Once authorized, the integration registers webhooks for order events. No additional configuration is required.

### Your own Shopify app

#### Create the app

1. Open the [Shopify Dev Dashboard](https://dev.shopify.com/dashboard) and switch to the Shopify organization that owns your store. The app must be in the same organization as the store, or the integration can't connect.
2. Go to **Apps**.
3. Click **Create app**, then select **Create app manually**.
4. Enter a name for the app. Leave the URLs empty.
5. In the **API Access** section, add the scopes `read_products`, `read_orders`, and `read_customers`.
6. Click **Create app**, then click **Release**.

#### Install the app on your store

1. Go back to the **App overview**.
2. Click **Install app** in the top right corner.

#### Request access to protected customer data

Shopify only sends order webhooks to apps with access to protected customer data.

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com).
2. Under **App distribution**, select **All apps**.
3. Go to **API access requests**.
4. Under **Protected customer data access**, click **Request access** (or **Manage** if you already requested it).
5. Fill out only step 1:
   - Under **Protected customer data**, select **Customer service**.
   - Under **Protected customer fields**, select **Customer service** for **Name**, **Email**, **Phone**, and **Address**.
6. Save your selections.
7. Go back to the **App overview** in the [Shopify Dev Dashboard](https://dev.shopify.com/dashboard) and click **Install app** again.

Because this is a private app installed only on your own store, it doesn't go through Shopify's review process.

#### Connect the integration in Botpress

1. In Botpress, install the Shopify Admin integration and start the setup wizard.
2. Select **Use my own Shopify app**. The wizard repeats the steps above for reference.
3. Enter your store domain (e.g. `my-store.myshopify.com`), and copy the app's **Client ID** and **Client Secret** from its settings in the Dev Dashboard.

You can find your store domain in **Settings → Domains** in the Shopify admin. Use the `.myshopify.com` domain, not a custom domain.

The integration uses these credentials to request access tokens from Shopify automatically, so you only enter them once. It also registers webhooks for order events. If you rotate the Client Secret or uninstall the app, run the setup wizard again.

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
