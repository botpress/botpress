import { z } from '@botpress/sdk'
import * as bp from '../../../.botpress'
import { ClickedEmailWebhookSchema } from '../../../definitions/external'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

// For this to work, the end-user needs to have hyperlink click tracking enabled in the SendGrid dashboard
export const handleClickedEvent = async (
  { client }: bp.HandlerProps,
  event: z.infer<typeof ClickedEmailWebhookSchema>
) => {
  return await client.createEvent({
    type: 'clicked',
    payload: {
      email: event.email,
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      url: event.url,
      urlOffset: event.url_offset.index,
      // Check if "marketing_campaign_id" and "marketing_campaign_name" is present in this webhook event
    },
  })
}
