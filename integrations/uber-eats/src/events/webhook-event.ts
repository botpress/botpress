import { z } from '@botpress/sdk'

export const UberEventType = z.enum([
  'delivery.state_changed',
  'orders.status_changed',
  'orders.created',
  'orders.canceled',
  'orders.ready_for_pickup',
  'orders.notification',
])

export const UberOrderDeliveryState = z.enum([
  'SCHEDULED',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_AT_PICKUP',
  'EN_ROUTE_TO_DROPOFF',
  'ARRIVED_AT_DROPOFF',
  'COMPLETED',
  'FAILED',
])

export const UberWebhookMeta = z.object({
  client_id: z.string().uuid(),
  webhook_config_id: z.string(),
  webhook_msg_timestamp: z.number(),
  webhook_msg_uuid: z.string().uuid(),
})

export const UberBaseWebhook = {
  event_id: z.string().uuid(),
  event_time: z.number(),
  resource_href: z.string().url(),
  webhook_meta: UberWebhookMeta,
} as const

export const UberOrderStatus = z.string().describe('Raw order status, example: "pos"')

const UberOrderMeta = z.object({
  user_id: z.string().uuid(),
  resource_id: z.string().uuid(),
  status: UberOrderStatus,
})

const UberOrdersNotificationEvent = z.object({
  ...UberBaseWebhook,
  event_type: z.literal('orders.notification'),
  meta: UberOrderMeta,
})

const UberOrdersScheduledNotificationEvent = z.object({
  ...UberBaseWebhook,
  event_type: z.literal('orders.scheduled.notification'),
  meta: UberOrderMeta,
})

const UberOrdersReleaseEvent = z.object({
  ...UberBaseWebhook,
  event_type: z.literal('orders.release'),
  meta: UberOrderMeta,
})

const UberOrdersFailureEvent = z.object({
  ...UberBaseWebhook,
  event_type: z.literal('orders.failure'),
  meta: UberOrderMeta,
})

const UberOrdersFulfillmentIssuesResolvedEvent = z.object({
  ...UberBaseWebhook,
  event_type: z.literal('orders.fulfillment_issues.resolved'),
  meta: UberOrderMeta,
})

const UberDeliveryStateChangedEvent = z.object({
  ...UberBaseWebhook,
  event_type: z.literal('delivery.state_changed'),
  meta: z.object({
    courier_trip_id: z.string().uuid(),
    store_id: z.string().uuid(),
    order_id: z.string().uuid(),
    external_order_id: z.string(),
    status: UberOrderDeliveryState,
  }),
})

export const UberSupportedWebhookEvents = z.discriminatedUnion('event_type', [
  UberOrdersNotificationEvent,
  UberOrdersScheduledNotificationEvent,
  UberOrdersReleaseEvent,
  UberOrdersFailureEvent,
  UberOrdersFulfillmentIssuesResolvedEvent,
  UberDeliveryStateChangedEvent,
])

export type UberSupportedWebhookEvent = z.infer<typeof UberSupportedWebhookEvents>
