/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'
import {
  createCustomerInputSchema,
  createCustomerOutputSchema,
  createOrRetrieveCustomerInputSchema,
  createOrRetrieveCustomerOutputSchema,
  createPaymentLinkInputSchema,
  createPaymentLinkOutputSchema,
  createSubsLinkInputSchema,
  createSubsLinkOutputSchema,
  deactivatePaymentLinkInputSchema,
  deactivatePaymentLinkOutputSchema,
  findPaymentLinkInputSchema,
  findPaymentLinkOutputSchema,
  listCustomersInputSchema,
  listCustomersOutputSchema,
  listPaymentLinksInputSchema,
  listPaymentLinksOutputSchema,
  listProductPricesInputSchema,
  listProductPricesOutputSchema,
  retrieveCustomerByIdInputSchema,
  retrieveCustomerByIdOutputSchema,
  searchCustomersInputSchema,
  searchCustomersOutputSchema,
  chargeFailedSchema,
  invoicePaymentFailedSchema,
  paymentIntentFailedSchema,
  subscriptionDeletedSchema,
  subscriptionUpdatedSchema,
  subscriptionCreatedSchema,
} from './src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'stripe',
  version: '0.4.6',
  title: 'Stripe',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Manage payments, subscriptions, and customers seamlessly. Execute workflows on charge failures and subscription updates.',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).describe('API Key'),
      apiVersion: z.string().optional().default('2023-10-16').describe('API Version (optional) (default: 2023-10-16)'),
    }),
  },
  events: {
    chargeFailed: {
      schema: chargeFailedSchema,
      title: 'Charge Failed',
      description: 'This event occurs when a charge fails in Stripe.',
    },
    subscriptionDeleted: {
      schema: subscriptionDeletedSchema,
      title: 'Subscription Deleted',
      description: 'This event occurs when a subscription is canceled/deleted in Stripe.',
    },
    subscriptionUpdated: {
      schema: subscriptionUpdatedSchema,
      title: 'Subscription Updated',
      description:
        'This event occurs when a subscription is updated in Stripe. For example when the subscription is cancelled, but does not terminate immediately cancel_at_period_end goes to true.',
    },
    subscriptionCreated: {
      schema: subscriptionCreatedSchema,
      title: 'Subscription Created',
      description:
        'This event occurs when a subscription is created in Stripe. For example when the subscription is cancelled, but does not terminate immediately cancel_at_period_end goes to true.',
    },
    invoicePaymentFailed: {
      schema: invoicePaymentFailedSchema,
      title: 'Invoice Payment Failed',
      description: 'This event occurs when an invoice payment fails in Stripe.',
    },
    paymentIntentFailed: {
      schema: paymentIntentFailedSchema,
      title: 'Payment Intent Failed',
      description: 'This event occurs when a payment intent fails in Stripe.',
    },
  },
  user: {
    tags: {
      id: {
        title: 'Stripe customer ID',
      },
    },
  },
  channels: {},
  states: {
    stripeIntegrationInfo: {
      type: 'integration',
      schema: z.object({
        stripeWebhookId: z.string(),
      }),
    },
  },
  actions: {
    createPaymentLink: {
      title: 'Create Payment Link',
      input: {
        schema: createPaymentLinkInputSchema,
      },
      output: {
        schema: createPaymentLinkOutputSchema,
      },
    },
    listProductPrices: {
      title: 'List Product Prices',
      input: {
        schema: listProductPricesInputSchema,
      },
      output: {
        schema: listProductPricesOutputSchema,
      },
    },
    createSubsLink: {
      title: 'Create Subscription Payment Link',
      input: {
        schema: createSubsLinkInputSchema,
      },
      output: {
        schema: createSubsLinkOutputSchema,
      },
    },
    listPaymentLinks: {
      title: 'List Payment Links',
      input: {
        schema: listPaymentLinksInputSchema,
      },
      output: {
        schema: listPaymentLinksOutputSchema,
      },
    },
    findPaymentLink: {
      title: 'Find Payment Link',
      input: {
        schema: findPaymentLinkInputSchema,
      },
      output: {
        schema: findPaymentLinkOutputSchema,
      },
    },
    deactivatePaymentLink: {
      title: 'Deactivate Payment Link',
      input: {
        schema: deactivatePaymentLinkInputSchema,
      },
      output: {
        schema: deactivatePaymentLinkOutputSchema,
      },
    },
    listCustomers: {
      title: 'List Customers By Email',
      input: {
        schema: listCustomersInputSchema,
      },
      output: {
        schema: listCustomersOutputSchema,
      },
    },
    searchCustomers: {
      title: 'Search Customers By Fields',
      input: {
        schema: searchCustomersInputSchema,
      },
      output: {
        schema: searchCustomersOutputSchema,
      },
    },
    createCustomer: {
      title: 'Create Customer',
      input: {
        schema: createCustomerInputSchema,
      },
      output: {
        schema: createCustomerOutputSchema,
      },
    },
    createOrRetrieveCustomer: {
      title: 'Create Or Retrieve Customer',
      input: {
        schema: createOrRetrieveCustomerInputSchema,
      },
      output: {
        schema: createOrRetrieveCustomerOutputSchema,
      },
    },
    retrieveCustomerById: {
      title: 'Retrieve Customer By ID',
      input: {
        schema: retrieveCustomerByIdInputSchema,
      },
      output: {
        schema: retrieveCustomerByIdOutputSchema,
      },
    },
  },
})
