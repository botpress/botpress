import { IntegrationDefinition, z } from '@botpress/sdk'
import {
  UberDeliveryStateChangedEvent,
  UberOrdersFailureEvent,
  UberOrdersFulfillmentIssuesResolvedEvent,
  UberOrdersNotificationEvent,
  UberOrdersReleaseEvent,
  UberOrdersScheduledNotificationEvent,
} from 'src/events/webhook-event'

import {
  getOrderInputSchema,
  getOrderOutputSchema,
  acceptOrderInputSchema,
  acceptOrderOutputSchema,
  denyOrderInputSchema,
  denyOrderOutputSchema,
  listStoreOrdersInputSchema,
  listStoreOrdersOutputSchema,
  markOrderReadyInputSchema,
  markOrderReadyOutputSchema,
} from './src/api/api-schemas'

export default new IntegrationDefinition({
  name: 'ubereats',
  title: 'Uber Eats',
  version: '0.0.1',
  description: 'Interact with Uber Eats orders, menus, and store data.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      clientId: z.string().title('Client ID'),
      clientSecret: z.string().title('Client Secret'),
      storeId: z.string().title('Store ID').optional(),
    }),
  },
  states: {
    oauthToken: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().nullable(),
        expiresAt: z.number().nullable(),
      }),
    },
  },
  actions: {
    getOrder: {
      title: 'Get Order',
      description: 'Fetch a single Uber Eats order by ID.',
      input: { schema: getOrderInputSchema },
      output: { schema: getOrderOutputSchema },
    },

    listStoreOrders: {
      title: 'List Store Orders',
      description: 'List orders for a store with optional state/status filters.',
      input: { schema: listStoreOrdersInputSchema },
      output: { schema: listStoreOrdersOutputSchema },
    },

    acceptOrder: {
      title: 'Accept Order',
      description: 'Accept an incoming Uber Eats order.',
      input: { schema: acceptOrderInputSchema },
      output: { schema: acceptOrderOutputSchema },
    },

    denyOrder: {
      title: 'Deny Order',
      description: 'Deny an Uber Eats order.',
      input: { schema: denyOrderInputSchema },
      output: { schema: denyOrderOutputSchema },
    },

    markOrderReady: {
      title: 'Mark Order Ready',
      description: 'Mark an order as ready for pickup.',
      input: { schema: markOrderReadyInputSchema },
      output: { schema: markOrderReadyOutputSchema },
    },
  },
  events: {
    ordersNotification: {
      title: 'Orders Notification',
      schema: UberOrdersNotificationEvent,
    },
    ordersScheduledNotification: {
      title: 'Orders Scheduled Notification',
      schema: UberOrdersScheduledNotificationEvent,
    },
    ordersRelease: {
      title: 'Orders Release',
      schema: UberOrdersReleaseEvent,
    },
    ordersFailure: {
      title: 'Orders Failure',
      schema: UberOrdersFailureEvent,
    },
    ordersFulfillmentIssuesResolved: {
      title: 'Orders Fulfillment Issue Resolved',
      schema: UberOrdersFulfillmentIssuesResolvedEvent,
    },
    deliveryStateChanged: {
      title: 'Delivery State Changed',
      schema: UberDeliveryStateChangedEvent,
    },
  },
})
