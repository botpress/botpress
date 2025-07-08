import { z } from '@botpress/sdk'
import * as bp from '../../../.botpress'
import { OpenedEmailWebhookSchema } from '../../../definitions/external'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

export const handleOpenedEvent = async (
  { client }: bp.HandlerProps,
  event: z.infer<typeof OpenedEmailWebhookSchema>
) => {
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
