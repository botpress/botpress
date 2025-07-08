import { z } from '@botpress/sdk'
import * as bp from '../../../.botpress'
import { BouncedEmailWebhookSchema } from '../../../definitions/external'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

export const handleBouncedEvent = async (
  { client }: bp.HandlerProps,
  event: z.infer<typeof BouncedEmailWebhookSchema>
) => {
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
