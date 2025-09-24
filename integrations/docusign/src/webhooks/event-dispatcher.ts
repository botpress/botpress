import * as inviteeHandlers from './event-handlers'
import { AllEnvelopeEvents } from './schemas'
import * as bp from '.botpress'

export const dispatchIntegrationEvent = async (props: bp.HandlerProps, webhookEvent: AllEnvelopeEvents) => {
  switch (webhookEvent.event) {
    case 'envelope-sent':
      return await inviteeHandlers.handleEnvelopeEvent(props, 'envelopeSent', webhookEvent)
    case 'envelope-resent':
      return await inviteeHandlers.handleEnvelopeEvent(props, 'envelopeResent', webhookEvent)
    case 'envelope-completed':
      return await inviteeHandlers.handleEnvelopeEvent(props, 'envelopeCompleted', webhookEvent)
    case 'envelope-declined':
      return await inviteeHandlers.handleEnvelopeEvent(props, 'envelopeDeclined', webhookEvent)
    case 'envelope-voided':
      return await inviteeHandlers.handleEnvelopeEvent(props, 'envelopeVoided', webhookEvent)
    default:
      props.logger.warn(`Ignoring unsupported webhook type: '${webhookEvent.event}'`)
      return null
  }
}
