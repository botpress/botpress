import { z } from '@botpress/sdk'
import { sendGridWebhookEventSchema } from '../../definitions/external'
import handlers from './handlers'
import * as bp from '.botpress'

export const dispatchIntegrationEvent = async (
  props: bp.HandlerProps,
  webhookEvent: z.infer<typeof sendGridWebhookEventSchema>
) => {
  switch (webhookEvent.event) {
    case 'delivered':
      return await handlers.handleDeliveredEvent(props, webhookEvent)
    case 'processed':
      return await handlers.handleProcessedEvent(props, webhookEvent)
    case 'deferred':
      return await handlers.handleDeferredEvent(props, webhookEvent)
    case 'bounce':
      return await handlers.handleBouncedEvent(props, webhookEvent)
    case 'open':
      return await handlers.handleOpenedEvent(props, webhookEvent)
    case 'click':
      return await handlers.handleClickedEvent(props, webhookEvent)
    default:
      return null
  }
}
