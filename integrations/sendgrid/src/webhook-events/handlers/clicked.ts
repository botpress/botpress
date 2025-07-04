import * as bp from '../../../.botpress'
import { SendGridWebhookEvent } from '../../misc/custom-types'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

// For this to work, the end-user needs to have hyperlink click tracking enabled in the SendGrid dashboard
export const handleClickedEvent = async ({ client }: bp.HandlerProps, event: SendGridWebhookEvent) => {
  return await client.createEvent({
    type: 'clicked',
    payload: {
      // Consider adding "email" to this
      // Add "url" to this
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      // Check if "marketing_campaign_id" & "marketing_campaign_name" is present in this webhook event
    },
  })
}
