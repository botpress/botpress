import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from 'src/definitions/actions'
import {
  UberDeliveryStateChangedEvent,
  UberOrdersFailureEvent,
  UberOrdersFulfillmentIssuesResolvedEvent,
  UberOrdersNotificationEvent,
  UberOrdersReleaseEvent,
  UberOrdersScheduledNotificationEvent,
} from 'src/events/webhook-event'

export default new IntegrationDefinition({
  name: 'ubereats',
  title: 'Uber Eats',
  version: '0.0.1',
  description: 'Interact with Uber Eats orders, menus, and store data.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      clientId: z
        .string()
        .min(1, 'Client ID cannot be empty')
        .title('Client ID')
        .describe('Uber application client ID'),

      clientSecret: z
        .string()
        .min(1, 'Client Secret cannot be empty')
        .title('Client Secret')
        .secret()
        .describe('Uber application client secret used for OAuth authentication'),

      storeId: z.string().uuid('Store ID must be a valid UUID').title('Store ID').describe('Uber Eats store UUID'),

      webhookSigningKey: z
        .string()
        .min(1, 'Webhook signing key cannot be empty')
        .title('Webhook Signing Key')
        .secret()
        .describe(
          'Secret key used to verify the HMAC-SHA256 signature of incoming Uber Eats webhook requests ' +
            '(X-Uber-Signature). This key is configured in the Uber Developer Dashboard and is ' +
            'separate from the OAuth client secret.'
        ),
    }),
  },

  states: {
    oauthToken: {
      type: 'integration',
      schema: z.object({
        accessToken: z
          .string()
          .title('Access token')
          .describe('OAuth access token used to authenticate requests to the Uber Eats API')
          .optional(),
        expiresAt: z
          .number()
          .title('Expires at')
          .describe('Unix epoch timestamp (in milliseconds) when the access token expires')
          .optional(),
      }),
    },
  },

  actions,
  events: {
    ordersNotification: {
      title: 'Orders Notification',
      description: 'Triggered when Uber sends an order notification webhook.',
      schema: UberOrdersNotificationEvent,
    },
    ordersScheduledNotification: {
      title: 'Orders Scheduled Notification',
      description: 'Triggered when Uber sends a scheduled order notification webhook.',
      schema: UberOrdersScheduledNotificationEvent,
    },
    ordersRelease: {
      title: 'Orders Release',
      description: 'Triggered when Uber releases an order.',
      schema: UberOrdersReleaseEvent,
    },
    ordersFailure: {
      title: 'Orders Failure',
      description: 'Triggered when Uber reports an order failure.',
      schema: UberOrdersFailureEvent,
    },
    ordersFulfillmentIssuesResolved: {
      title: 'Orders Fulfillment Issue Resolved',
      description: 'Triggered when Uber reports that order fulfillment issues were resolved.',
      schema: UberOrdersFulfillmentIssuesResolvedEvent,
    },
    deliveryStateChanged: {
      title: 'Delivery State Changed',
      description: 'Triggered when the delivery state of an order changes.',
      schema: UberDeliveryStateChangedEvent,
    },
  },
})
