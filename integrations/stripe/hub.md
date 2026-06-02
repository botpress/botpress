Connect your Botpress chatbot with Stripe, a popular online payment platform that facilitates transactions between businesses and their customers. Stripe allows you to manage payments, subscriptions, invoices, and more.

## Setup and Configuration

The Stripe integration supports two authentication modes:

- **OAuth (recommended)** — authorize Botpress on your Stripe account through Stripe's hosted consent screen. No keys to copy or rotate.
- **API Key (manual)** — paste a Stripe Secret Key (`sk_live_…` / `sk_test_…`) or a Restricted Key.

### Prerequisites

- A Botpress cloud account.
- A Stripe account.

### Enable Integration

1. Open your bot in the Botpress dashboard and navigate to the "Integrations" section.
2. Locate the Stripe integration and click on "Configure".
3. Click the configuration link to open the setup wizard.
4. Choose **Connect with OAuth** to be redirected to Stripe's authorization page, or choose **Use a Stripe API Key** to paste a key from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys).
5. Save the configuration.

The integration will create a webhook endpoint on your Stripe account on first use. The webhook signing secret is captured automatically and used to verify all incoming events.

## Usage

Once the integration is enabled, you can start using Stripe features from your Botpress chatbot. The integration offers several actions for interacting with Stripe, such as `createPaymentLink` , `createSubsLink` (For generate Subscription Payment Link), `listPaymentLinks` (IDs and URLs), `listProductPrices` (If price has the "recurring" property, the product is of type subscription.), `findPaymentLink` (By URL, return ID), and `deactivatePaymentLink` (By ID). And actions for Customers, `listCustomers` (Optional filter by e-mail), `searchCustomers` (By e-mail, name or/and phone), `createCustomer` and `createOrRetrieveCustomer` (If the user already exists, his email has already been registered, get it. If there are multiple users with the same email, return an array of them. If it does not exist, it creates it).

## Supported Events

- **Charge Failed**: This event occurs when a charge fails in Stripe.
- **Subscription Deleted**: This event occurs when a subscription is canceled/deleted in Stripe.
- **Subscription Updated**: This event occurs when a subscription is updated in Stripe. For example, when the subscription is canceled, but does not terminate immediately, `cancel_at_period_end` becomes true.
- **Invoice Payment Failed**: This event occurs when an invoice payment fails in Stripe.
- **Payment Intent Failed**: This event occurs when a payment intent fails in Stripe.

These events allow your chatbot to respond to various situations related to charges, payments and subscriptions in Stripe.
