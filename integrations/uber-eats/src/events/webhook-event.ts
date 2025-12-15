import { z } from '@botpress/sdk'

export const UberOrderDeliveryState = z
  .enum([
    'SCHEDULED',
    'EN_ROUTE_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'EN_ROUTE_TO_DROPOFF',
    'ARRIVED_AT_DROPOFF',
    'COMPLETED',
    'FAILED',
  ])
  .title('Delivery state')
  .describe('Current delivery state reported by Uber')

export const UberWebhookMeta = z
  .object({
    client_id: z.string().uuid().title('Client ID').describe('Uber application client UUID'),
    webhook_config_id: z.string().title('Webhook config ID').describe('Webhook configuration identifier'),
    webhook_msg_timestamp: z
      .number()
      .title('Webhook message timestamp')
      .describe('Webhook message timestamp as Unix epoch'),
    webhook_msg_uuid: z.string().uuid().title('Webhook message UUID').describe('Unique webhook message identifier'),
  })
  .title('Webhook metadata')
  .describe('Metadata describing webhook delivery')

export const UberBaseWebhook = {
  event_id: z.string().uuid().title('Event ID').describe('Unique webhook event identifier'),
  event_time: z.number().title('Event time').describe('Time the event occurred as Unix epoch'),
  resource_href: z.string().url().title('Resource href').describe('URL of the affected Uber resource'),
  webhook_meta: UberWebhookMeta.title('Webhook meta').describe('Webhook delivery metadata'),
} as const

export const UberOrderStatus = z.string().title('Order status').describe('Raw order status, example: "pos"')

export const UberOrderMeta = z
  .object({
    user_id: z.string().uuid().title('User ID').describe('Uber user UUID'),
    resource_id: z.string().uuid().title('Resource ID').describe('Uber order UUID'),
    status: UberOrderStatus,
  })
  .title('Order metadata')
  .describe('Metadata describing the order')

export const UberOrdersNotificationEvent = z
  .object({
    ...UberBaseWebhook,
    event_type: z.literal('orders.notification').title('Event type').describe('Webhook event type'),
    meta: UberOrderMeta.title('Meta').describe('Order metadata'),
  })
  .title('Orders notification event')
  .describe('Webhook event emitted for order notifications')

export const UberOrdersScheduledNotificationEvent = z
  .object({
    ...UberBaseWebhook,
    event_type: z.literal('orders.scheduled.notification').title('Event type').describe('Webhook event type'),
    meta: UberOrderMeta.title('Meta').describe('Order metadata'),
  })
  .title('Orders scheduled notification event')
  .describe('Webhook event emitted for scheduled order notifications')

export const UberOrdersReleaseEvent = z
  .object({
    ...UberBaseWebhook,
    event_type: z.literal('orders.release').title('Event type').describe('Webhook event type'),
    meta: UberOrderMeta.title('Meta').describe('Order metadata'),
  })
  .title('Orders release event')
  .describe('Webhook event emitted when an order is released')

export const UberOrdersFailureEvent = z
  .object({
    ...UberBaseWebhook,
    event_type: z.literal('orders.failure').title('Event type').describe('Webhook event type'),
    meta: UberOrderMeta.title('Meta').describe('Order metadata'),
  })
  .title('Orders failure event')
  .describe('Webhook event emitted when an order fails')

export const UberOrdersFulfillmentIssuesResolvedEvent = z
  .object({
    ...UberBaseWebhook,
    event_type: z.literal('orders.fulfillment_issues.resolved').title('Event type').describe('Webhook event type'),
    meta: UberOrderMeta.title('Meta').describe('Order metadata'),
  })
  .title('Orders fulfillment issues resolved event')
  .describe('Webhook event emitted when fulfillment issues are resolved')

export const UberDeliveryStateChangedEvent = z
  .object({
    ...UberBaseWebhook,
    event_type: z.literal('delivery.state_changed').title('Event type').describe('Webhook event type'),
    meta: z
      .object({
        courier_trip_id: z.string().uuid().title('Courier trip ID').describe('Courier trip UUID'),
        store_id: z.string().uuid().title('Store ID').describe('Uber Eats store UUID'),
        order_id: z.string().uuid().title('Order ID').describe('Uber order UUID'),
        external_order_id: z.string().title('External order ID').describe('Partner external order identifier'),
        status: UberOrderDeliveryState,
      })
      .title('Meta')
      .describe('Delivery state change metadata'),
  })
  .title('Delivery state changed event')
  .describe('Webhook event emitted when a delivery changes state')

export const UberSupportedWebhookEvents = z
  .discriminatedUnion('event_type', [
    UberOrdersNotificationEvent,
    UberOrdersScheduledNotificationEvent,
    UberOrdersReleaseEvent,
    UberOrdersFailureEvent,
    UberOrdersFulfillmentIssuesResolvedEvent,
    UberDeliveryStateChangedEvent,
  ])
  .title('Supported webhook events')
  .describe('Union of all supported Uber Eats webhook events')

export type UberSupportedWebhookEvent = z.infer<typeof UberSupportedWebhookEvents>
export type UberWebhookEventType = UberSupportedWebhookEvent['event_type']
