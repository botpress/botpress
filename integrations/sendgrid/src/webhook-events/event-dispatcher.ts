import { z } from '@botpress/sdk'
import { SendGridWebhookEventSchema } from '../../definitions/external'
import { SendGridWebhookEventType } from '../misc/SendGridWebhookEventType'
import handlers from './handlers'
import * as bp from '.botpress'

// It's confirmed that the "Event Objects" table in the docs is out of sync because
// it says the "type" property isn't part of the "bounce" events even though it is.

export const dispatchIntegrationEvent = async (
  props: bp.HandlerProps,
  webhookEvent: z.infer<typeof SendGridWebhookEventSchema>
) => {
  switch (webhookEvent.event) {
    case SendGridWebhookEventType.DELIVERED:
      return await handlers.handleDeliveredEvent(props, webhookEvent)
    case SendGridWebhookEventType.PROCESSED:
      return await handlers.handleProcessedEvent(props, webhookEvent)
    case SendGridWebhookEventType.DEFERRED:
      return await handlers.handleDeferredEvent(props, webhookEvent)
    case SendGridWebhookEventType.BOUNCE:
      return await handlers.handleBouncedEvent(props, webhookEvent)
    case SendGridWebhookEventType.OPEN:
      return await handlers.handleOpenedEvent(props, webhookEvent)
    case SendGridWebhookEventType.CLICK:
      return await handlers.handleClickedEvent(props, webhookEvent)
    default:
      return null
  }
}
