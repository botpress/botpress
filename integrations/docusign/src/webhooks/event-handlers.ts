import { CONVERSATION_ID_FIELD_KEY } from '../config'
import { EnvelopeEvent } from './schemas'
import * as bp from '.botpress'

export const handleEnvelopeEvent = async (
  props: bp.HandlerProps,
  eventType: keyof bp.events.Events,
  event: EnvelopeEvent
) => {
  const { userId, accountId, envelopeId, envelopeSummary } = event.data

  const conversationIdField = envelopeSummary.customFields.textCustomFields.find((customField) => {
    return customField.name === CONVERSATION_ID_FIELD_KEY
  })
  const conversationId = conversationIdField?.value ?? undefined

  return await props.client.createEvent({
    type: eventType,
    conversationId,
    payload: {
      userId,
      accountId,
      envelopeId,
      triggeredAt: event.generatedDateTime.toISOString(),
    },
  })
}
