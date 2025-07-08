import * as bp from '../../../.botpress'
import { ProcessedEmailWebhook } from '../../../definitions/external'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

export const handleProcessedEvent = async ({ client }: bp.HandlerProps, event: ProcessedEmailWebhook) => {
  return await client.createEvent({
    type: 'processed',
    payload: {
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      sendAt: unixTimestampToUtcDatetime(event.send_at),
    },
  })
}
