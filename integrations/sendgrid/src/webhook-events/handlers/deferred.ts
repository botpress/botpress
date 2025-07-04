import * as bp from '../../../.botpress'
import { SendGridWebhookEvent } from '../../misc/custom-types'
import { hasPropOfType, unixTimestampToUtcDatetime } from '../../misc/utils'

const DEFERRED_ATTEMPT_PROP = 'attempt' as const

export const handleDeferredEvent = async ({ client, logger }: bp.HandlerProps, event: SendGridWebhookEvent) => {
  if (!hasPropOfType(event, DEFERRED_ATTEMPT_PROP, 'string')) {
    logger.error(
      `The '${DEFERRED_ATTEMPT_PROP}' property was either not present or of an unexpected type on the SendGrid Deferred Event`
    )
    return
  }

  const parsedAttempt = parseInt(event.attempt)
  if (isNaN(parsedAttempt)) {
    logger.error(`The '${DEFERRED_ATTEMPT_PROP}' property was not a serialized integer as was expect`)
    return
  }

  return await client.createEvent({
    type: 'deferred',
    payload: {
      attempt: parsedAttempt,
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
    },
  })
}
