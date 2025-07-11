import * as emailHandlers from './handlers/email'
import { EmailWebhookEventPayloads } from './schemas/email'
import * as bp from '.botpress'

export const dispatchIntegrationEvent = async (props: bp.HandlerProps, webhookEvent: EmailWebhookEventPayloads) => {
  switch (webhookEvent.type) {
    case 'email.sent':
      return await emailHandlers.handleSentEvent(props, webhookEvent)
    case 'email.delivered':
      return await emailHandlers.handleDeliveredEvent(props, webhookEvent)
    case 'email.delivery_delayed':
      return await emailHandlers.handleDeliveryDelayedEvent(props, webhookEvent)
    case 'email.complained':
      return await emailHandlers.handleMarkedAsSpamEvent(props, webhookEvent)
    case 'email.bounced':
      return await emailHandlers.handleBouncedEvent(props, webhookEvent)
    case 'email.opened':
      return await emailHandlers.handleOpenedEvent(props, webhookEvent)
    case 'email.clicked':
      return await emailHandlers.handleLinkClickedEvent(props, webhookEvent)
    case 'email.failed':
      return await emailHandlers.handleFailedToSendEvent(props, webhookEvent)
    default:
      return null
  }
}
