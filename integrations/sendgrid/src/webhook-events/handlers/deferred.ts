import { z } from '@botpress/sdk'
import * as bp from '../../../.botpress'
import { DeferredEmailWebhookSchema } from '../../../definitions/external'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

export const handleDeferredEvent = async (
  { client }: bp.HandlerProps,
  event: z.infer<typeof DeferredEmailWebhookSchema>
) => {
  return await client.createEvent({
    type: 'deferred',
    payload: {
      attempt: event.attempt,
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
    },
  })
}
