import { verifyUberSignature } from 'src/events/verify-uber-signature'
import { UberSupportedWebhookEvents, UberWebhookEventType } from 'src/events/webhook-event'
import * as bp from '.botpress'

const webhookToBotpressEvent: Record<UberWebhookEventType, keyof bp.events.Events> = {
  'orders.notification': 'ordersNotification',
  'orders.scheduled.notification': 'ordersScheduledNotification',
  'orders.release': 'ordersRelease',
  'orders.failure': 'ordersFailure',
  'orders.fulfillment_issues.resolved': 'ordersFulfillmentIssuesResolved',
  'delivery.state_changed': 'deliveryStateChanged',
} as const

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, logger, ctx }) => {
  try {
    verifyUberSignature(req, ctx.configuration.webhookSigningKey)
  } catch {
    logger.forBot().warn('Invalid Uber webhook signature')
    return { status: 401 }
  }

  if (!req.body) {
    logger.forBot().warn('Received empty Uber Eats webhook body')
    return { status: 400 }
  }

  let parsed
  try {
    parsed = JSON.parse(req.body)
  } catch {
    logger.forBot().error('Invalid JSON in Uber webhook')
    return { status: 400 }
  }

  const result = UberSupportedWebhookEvents.safeParse(parsed)
  if (!result.success) {
    logger.forBot().error('Invalid Uber webhook payload:', result.error.format())
    return { status: 400 }
  }

  const event = result.data
  const mappedType = webhookToBotpressEvent[event.event_type]

  if (!mappedType) {
    logger.forBot().warn(`Received unsupported Uber webhook type: ${event.event_type}`)
    return { status: 200 }
  }

  await client.createEvent({
    type: mappedType,
    payload: event,
  })

  return { status: 200 }
}
