import { CalendlyClient } from '../calendly-api'
import type { InviteeEvent } from './schemas'
import type * as bp from '.botpress'

export const handleInviteeEvent = async (
  props: bp.HandlerProps,
  eventType: keyof bp.events.Events,
  event: InviteeEvent
) => {
  const { start_time, end_time, location, name: eventName, uri: scheduledEventUri } = event.payload.scheduled_event

  const calendlyClient = await CalendlyClient.create(props)
  const currentUser = await calendlyClient.getCurrentUser()

  let conversationId: string | null = null
  const { utm_content, utm_medium } = event.payload.tracking
  if (utm_medium === 'conversation' && utm_content?.startsWith('id=')) {
    conversationId = utm_content.replace(/id=/, '')
  }

  return await props.client.createEvent({
    type: eventType,
    payload: {
      scheduledEventUri,
      eventName: eventName ?? `Meeting between ${currentUser.resource.name} and ${event.payload.name}`,
      startTime: start_time.toISOString(),
      endTime: end_time.toISOString(),
      locationType: location.type,
      organizerName: currentUser.resource.name,
      organizerEmail: currentUser.resource.email,
      inviteeName: event.payload.name,
      inviteeEmail: event.payload.email,
      conversationId,
    },
  })
}
