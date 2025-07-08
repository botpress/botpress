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
      // Check if "marketing_campaign_id" and "marketing_campaign_name" is present in this webhook event
      // Check if "sg_machine_open" is consistently present in this webhook event and what it represents
      //    - This is a bool indicating if the recipient has "Apple Mail Privacy Protection (MPP)" enabled. (Check if I can't emulate this on my end, and see if it affects some props in the webhook response)
    },
  })
}
