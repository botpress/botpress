import * as inviteeHandlers from './event-handlers'
import type { InviteeEvent } from './schemas'
import type * as bp from '.botpress'

export const dispatchIntegrationEvent = async (props: bp.HandlerProps, webhookEvent: InviteeEvent) => {
  switch (webhookEvent.event) {
    case 'invitee.created':
      return await inviteeHandlers.handleInviteeEvent(props, 'eventScheduled', webhookEvent)
    case 'invitee.canceled':
      return await inviteeHandlers.handleInviteeEvent(props, 'eventCanceled', webhookEvent)
    case 'invitee_no_show.created':
      return await inviteeHandlers.handleInviteeEvent(props, 'eventNoShowCreated', webhookEvent)
    case 'invitee_no_show.deleted':
      return await inviteeHandlers.handleInviteeEvent(props, 'eventNoShowDeleted', webhookEvent)
    default:
      return null
  }
}
