import { EnvelopeEvent } from './schemas'
import * as bp from '.botpress'

export const handleEnvelopeEvent = async (
  props: bp.HandlerProps,
  eventType: keyof bp.events.Events,
  event: EnvelopeEvent
) => {
  const { userId, accountId, envelopeId } = event.data

  return await props.client.createEvent({
    type: eventType,
    payload: {
      userId,
      accountId,
      envelopeId,
      triggeredAt: event.generatedDateTime.toISOString(),
    },
  })
}
