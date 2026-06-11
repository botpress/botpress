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
  subscriptionScheduleCreatedSchema,
  subscriptionScheduleUpdatedSchema,
} from './src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'stripe',
  version: '0.6.1',
  title: 'Stripe',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Manage payments, subscriptions, and customers seamlessly. Execute workflows on charge failures and subscription updates.',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({
      apiVersion: z
        .string()
        .optional()
        .default('2023-10-16')
        .describe('API Version (optional) (default: 2023-10-16)')
        .title('API Version'),
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
    subscriptionScheduleCreated: {
      schema: subscriptionScheduleCreatedSchema,
      title: 'Subscription Schedule Created',
      description: 'This event occurs when a subscription schedule is created in Stripe.',
    },
    subscriptionScheduleUpdated: {
      schema: subscriptionScheduleUpdatedSchema,
      title: 'Subscription Schedule Updated',
      description: 'This event occurs when a subscription schedule is updated in Stripe.',
    },
  },
  user: {
    tags: {
      id: {
        title: 'Stripe customer ID',
        description: 'The unique identifier for a Stripe customer.',
      },
    },
  },
  channels: {},
  states: {
    oAuthCredentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().secret().title('Access Token').describe('The OAuth access token'),
        refreshToken: z.string().secret().title('Refresh Token').describe('The rotating OAuth refresh token'),
        expiresAt: z
          .string()
          .datetime()
          .title('Access Token Expires At')
          .describe('The timestamp of when the access token expires'),
        refreshExpiresAt: z
          .string()
          .datetime()
          .title('Refresh Token Expires At')
          .describe('The timestamp of when the refresh token expires'),
        scopes: z.array(z.string()).title('Scopes').describe('The scopes granted to the token'),
        stripeUserId: z
          .string()
          .title('Stripe Account ID')
          .describe('The Stripe account ID (acct_xxx) the token was issued for'),
        livemode: z.boolean().title('Live Mode').describe('Whether the token operates against Stripe live mode'),
      }),
    },
    manualCredentials: {
      type: 'integration',
      schema: z.object({
        apiKey: z
          .string()
          .secret()
          .title('Stripe API Key')
          .describe('The secret key or a restricted key from your Stripe account'),
      }),
    },
    stripeIntegrationInfo: {
      type: 'integration',
      schema: z.object({
        stripeWebhookId: z
          .string()
          .title('Stripe Webhook ID')
          .describe('The unique identifier for the Stripe webhook.'),
        stripeWebhookSecret: z
          .string()
          .secret()
          .optional()
          .title('Stripe Webhook Signing Secret')
          .describe('The signing secret returned by Stripe when the webhook endpoint was created.'),
      }),
    },
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the Stripe OAuth app.',
    },
    CLIENT_SECRET: {
      description: 'The Stripe secret API key (sk_live_/sk_test_) used to authenticate to the OAuth token endpoint.',
    },
  },
  actions: {
    createPaymentLink: {
      title: 'Create Payment Link',
      description: 'Creates a Stripe payment link for a product.',
      input: {
        schema: createPaymentLinkInputSchema,
      },
      output: {
        schema: createPaymentLinkOutputSchema,
      },
    },
    listProductPrices: {
      title: 'List Product Prices',
      description: 'Lists all Stripe product prices.',
      input: {
        schema: listProductPricesInputSchema,
      },
      output: {
        schema: listProductPricesOutputSchema,
      },
    },
    createSubsLink: {
      title: 'Create Subscription Payment Link',
      description: 'Creates a Stripe payment link for a subscription product.',
      input: {
        schema: createSubsLinkInputSchema,
      },
      output: {
        schema: createSubsLinkOutputSchema,
      },
    },
    listPaymentLinks: {
      title: 'List Payment Links',
      description: 'Lists all active Stripe payment links.',
      input: {
        schema: listPaymentLinksInputSchema,
      },
      output: {
        schema: listPaymentLinksOutputSchema,
      },
    },
    findPaymentLink: {
      title: 'Find Payment Link',
      description: 'Finds a Stripe payment link by URL.',
      input: {
        schema: findPaymentLinkInputSchema,
      },
      output: {
        schema: findPaymentLinkOutputSchema,
      },
    },
    deactivatePaymentLink: {
      title: 'Deactivate Payment Link',
      description: 'Deactivates a Stripe payment link by ID.',
      input: {
        schema: deactivatePaymentLinkInputSchema,
      },
      output: {
        schema: deactivatePaymentLinkOutputSchema,
      },
    },
    listCustomers: {
      title: 'List Customers By Email',
      description: 'Lists Stripe customers, optionally filtered by email.',
      input: {
        schema: listCustomersInputSchema,
      },
      output: {
        schema: listCustomersOutputSchema,
      },
    },
    searchCustomers: {
      title: 'Search Customers By Fields',
      description: 'Searches Stripe customers by email, name, or phone.',
      input: {
        schema: searchCustomersInputSchema,
      },
      output: {
        schema: searchCustomersOutputSchema,
      },
    },
    createCustomer: {
      title: 'Create Customer',
      description: 'Creates a new Stripe customer.',
      input: {
        schema: createCustomerInputSchema,
      },
      output: {
        schema: createCustomerOutputSchema,
      },
    },
    createOrRetrieveCustomer: {
      title: 'Create Or Retrieve Customer',
      description: 'Creates a new Stripe customer or retrieves an existing one by email.',
      input: {
        schema: createOrRetrieveCustomerInputSchema,
      },
      output: {
        schema: createOrRetrieveCustomerOutputSchema,
      },
    },
    retrieveCustomerById: {
      title: 'Retrieve Customer By ID',
      description: 'Retrieves a Stripe customer by their ID.',
      input: {
        schema: retrieveCustomerByIdInputSchema,
      },
      output: {
        schema: retrieveCustomerByIdOutputSchema,
      },
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
  attributes: {
    category: 'E-commerce & Payments',
    repo: 'botpress',
  },
})
