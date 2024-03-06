import { IntegrationDefinition } from '@botpress/sdk'
import { z } from 'zod'
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
} from './src/misc/custom-schemas'
import {
  createCustomerUi,
  createOrRetrieveCustomerUi,
  createPaymentLinkUi,
  createSubsLinkUi,
  deactivatePaymentLinkUi,
  findPaymentLinkUi,
  listCustomersUi,
  listPaymentLinksUi,
  retrieveCustomerByIdUi,
  searchCustomersUi,
} from './src/misc/custom-uis'

export default new IntegrationDefinition({
  name: 'stripe',
  version: '0.2.0',
  title: 'Stripe',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().describe('API Key'),
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
        ui: createPaymentLinkUi,
      },
      output: {
        schema: createPaymentLinkOutputSchema,
      },
    },
    listProductPrices: {
      title: 'List Product Prices',
      input: {
        schema: listProductPricesInputSchema,
        ui: {},
      },
      output: {
        schema: listProductPricesOutputSchema,
      },
    },
    createSubsLink: {
      title: 'Create Subscription Payment Link',
      input: {
        schema: createSubsLinkInputSchema,
        ui: createSubsLinkUi,
      },
      output: {
        schema: createSubsLinkOutputSchema,
      },
    },
    listPaymentLinks: {
      title: 'List Payment Links',
      input: {
        schema: listPaymentLinksInputSchema,
        ui: listPaymentLinksUi,
      },
      output: {
        schema: listPaymentLinksOutputSchema,
      },
    },
    findPaymentLink: {
      title: 'Find Payment Link',
      input: {
        schema: findPaymentLinkInputSchema,
        ui: findPaymentLinkUi,
      },
      output: {
        schema: findPaymentLinkOutputSchema,
      },
    },
    deactivatePaymentLink: {
      title: 'Deactivate Payment Link',
      input: {
        schema: deactivatePaymentLinkInputSchema,
        ui: deactivatePaymentLinkUi,
      },
      output: {
        schema: deactivatePaymentLinkOutputSchema,
      },
    },
    listCustomers: {
      title: 'List Customers By Email',
      input: {
        schema: listCustomersInputSchema,
        ui: listCustomersUi,
      },
      output: {
        schema: listCustomersOutputSchema,
      },
    },
    searchCustomers: {
      title: 'Search Customers By Fields',
      input: {
        schema: searchCustomersInputSchema,
        ui: searchCustomersUi,
      },
      output: {
        schema: searchCustomersOutputSchema,
      },
    },
    createCustomer: {
      title: 'Create Customer',
      input: {
        schema: createCustomerInputSchema,
        ui: createCustomerUi,
      },
      output: {
        schema: createCustomerOutputSchema,
      },
    },
    createOrRetrieveCustomer: {
      title: 'Create Or Retrieve Customer',
      input: {
        schema: createOrRetrieveCustomerInputSchema,
        ui: createOrRetrieveCustomerUi,
      },
      output: {
        schema: createOrRetrieveCustomerOutputSchema,
      },
    },
    retrieveCustomerById: {
      title: 'Retrieve Customer By ID',
      input: {
        schema: retrieveCustomerByIdInputSchema,
        ui: retrieveCustomerByIdUi,
      },
      output: {
        schema: retrieveCustomerByIdOutputSchema,
      },
    },
  },
})
