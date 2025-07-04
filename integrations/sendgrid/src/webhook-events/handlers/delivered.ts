import { SendGridWebhookEvent } from '../../misc/custom-types'
import { hasPropOfType, unixTimestampToUtcDatetime } from '../../misc/utils'
import * as bp from '.botpress'

const DELIVERED_EMAIL_PROP = 'email' as const

export const handleDeliveredEvent = async ({ client, logger }: bp.HandlerProps, event: SendGridWebhookEvent) => {
  if (!hasPropOfType(event, DELIVERED_EMAIL_PROP, 'string')) {
    logger.error(
      `The '${DELIVERED_EMAIL_PROP}' property was either not present or of an unexpected type on the SendGrid Delivered Event`
    )
    return
  }

  return await client.createEvent({
    type: 'delivered',
    payload: {
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      email: event.email,
    },
  })
}
