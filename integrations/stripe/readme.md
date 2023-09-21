# Botpress Stripe Integration

This integration allows you to connect your Botpress chatbot with Stripe, a popular online payment platform that facilitates transactions between businesses and their customers. Stripe allows you to manage payments, subscriptions, invoices, and more.

## Setup

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

## Limitations and Solutions

Stripe has frequency limits to maximize its stability, allowing up to 100 read and write operations per second in active mode, and 25 operations per second in test mode.

In addition, Stripe locks objects during some operations to prevent interference. If a request attempts to acquire a lock already in use, an error may occur.

To handle these limits, the documentation recommends:

- Retry requests that return 429 errors.
- Reduce unnecessary load.
- Run mutations on the same object sequentially.

## PCI Compliance with Stripe

Complying with PCI standards is a crucial first step, but it's just the beginning. While the PCI DSS guidelines provide important rules for managing and storing cardholder data, they do not offer complete protection for payment environments.

### Additional Protection with Stripe

A much more effective way to protect your business is by implementing a more secure card acceptance method, such as Stripe Checkout, Elements, or mobile SDKs. These methods not only provide a way to mitigate data breaches but also avoid the PCI compliance validation process, which can be a significant investment of time, money, and stress.

It's important to note that **sensitive card data should not be processed by the backend**, but only by the frontend through Stripe.js. This ensures that sensitive data never touch your server, further enhancing security.

### Time Savings with Stripe

Here's a comparison of the average audit time with and without Stripe Elements, Checkout, or mobile SDKs:

| Visa Merchant Level | Average Audit Time (Annual Estimates) | Average Audit Time with Stripe Elements, Checkout or Mobile SDKs (Annual Estimates) |
| ------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| Level 1             | 3 to 5 months                         | 2 to 5 days                                                                         |
| Level 2             | 1 to 3 months                         | 0 days                                                                              |
| Level 3             | 1 to 3 months                         | 0 days                                                                              |
| Level 4             | 1 to 3 months                         | 0 days                                                                              |

As you can see, using Stripe can significantly reduce the time required for auditing.

For more information about PCI compliance with Stripe, you can check out the [PCI Compilance Guide](https://stripe.com/es/guides/pci-compliance) provided by Stripe.

## Contributing

Contributions are welcome! Please submit issues and pull requests.

Enjoy seamless helpdesk and customer support integration between Botpress and Stripe!
