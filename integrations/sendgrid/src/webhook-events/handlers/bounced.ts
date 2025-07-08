import * as bp from '../../../.botpress'
import { unixTimestampToUtcDatetime } from '../../misc/utils'
import { BouncedEmailWebhook } from '../sendgrid-webhook-schemas'

export const handleBouncedEvent = async ({ client }: bp.HandlerProps, event: BouncedEmailWebhook) => {
  await client.createEvent({
    type: 'bounced',
    payload: {
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      classification: event.bounce_classification,
      type: event.type,
    },
  })
}
