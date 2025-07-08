import * as bp from '../../../.botpress'
import { unixTimestampToUtcDatetime } from '../../misc/utils'
import { OpenedEmailWebhook } from '../sendgrid-webhook-schemas'

export const handleOpenedEvent = async ({ client }: bp.HandlerProps, event: OpenedEmailWebhook) => {
  return await client.createEvent({
    type: 'opened',
    payload: {
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      email: event.email,
    },
  })
}
