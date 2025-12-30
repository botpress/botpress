Connect your Botpress chatbot with Stripe, a popular online payment platform that facilitates transactions between businesses and their customers. Stripe allows you to manage payments, subscriptions, invoices, and more.

## Setup and Configuration

To set up the integration, you will need to provide your Stripe `apiKey`. This key can be obtained from the Stripe Dashboard. Once the integration is set up, you can use the built-in actions to manage your Stripe data.

### Prerequisites

Before enabling the Botpress Stripe Integration, please ensure that you have the following:

- A Botpress cloud account.
- `apiKey` generated from Stripe.

### Enable Integration

To enable the Stripe integration in Botpress, follow these steps:

1. Access your Botpress admin panel.
2. Navigate to the “Integrations” section.
3. Locate the Stripe integration and click on “Enable” or “Configure.”
4. Provide the required `apiKey`.
5. Save the configuration.

## Usage

Once the integration is enabled, you can start using Stripe features from your Botpress chatbot. The integration offers several actions for interacting with Stripe, such as `createPaymentLink` , `createSubsLink` (For generate Subscription Payment Link), `listPaymentLinks` (IDs and URLs), `listProductPrices` (If price has the "recurring" property, the product is of type subscription.), `findPaymentLink` (By URL, return ID), and `deactivatePaymentLink` (By ID). And actions for Customers, `listCustomers` (Optional filter by e-mail), `searchCustomers` (By e-mail, name or/and phone), `createCustomer` and `createOrRetrieveCustomer` (If the user already exists, his email has already been registered, get it. If there are multiple users with the same email, return an array of them. If it does not exist, it creates it).

## Supported Events

- **Charge Failed**: This event occurs when a charge fails in Stripe.
- **Subscription Deleted**: This event occurs when a subscription is canceled/deleted in Stripe.
- **Subscription Updated**: This event occurs when a subscription is updated in Stripe. For example, when the subscription is canceled, but does not terminate immediately, `cancel_at_period_end` becomes true.
- **Invoice Payment Failed**: This event occurs when an invoice payment fails in Stripe.
- **Payment Intent Failed**: This event occurs when a payment intent fails in Stripe.

These events allow your chatbot to respond to various situations related to charges, payments and subscriptions in Stripe.
