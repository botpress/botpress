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
      clientId: z.string().title('Client ID'),
      clientSecret: z.string().title('Client Secret'),
      storeId: z.string().title('Store ID'),
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
  actions,
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
