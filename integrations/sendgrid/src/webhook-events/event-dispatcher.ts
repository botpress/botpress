import { z } from '@botpress/sdk'
import { SendGridWebhookEventSchema } from '../../definitions/external'
import { SendGridWebhookEventType } from '../misc/SendGridWebhookEventType'
import handlers from './handlers'
import * as bp from '.botpress'

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
    default:
      return null
  }
}
