import { z } from '@botpress/sdk'
import * as bp from '../../../.botpress'
import { ProcessedEmailWebhookSchema } from '../../../definitions/external'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

export const handleProcessedEvent = async (
  { client }: bp.HandlerProps,
  event: z.infer<typeof ProcessedEmailWebhookSchema>
) => {
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
