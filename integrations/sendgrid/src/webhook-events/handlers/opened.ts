import * as bp from '../../../.botpress'
import { SendGridWebhookEvent } from '../../misc/custom-types'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

// For this to trigger, the end-user needs to have email open tracking enabled in the SendGrid dashboard
export const handleOpenedEvent = async ({ client }: bp.HandlerProps, event: SendGridWebhookEvent) => {
  return await client.createEvent({
    type: 'opened',
    payload: {
      // Consider adding "email" to this
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      // Check if "marketing_campaign_id" and "marketing_campaign_name" is present in this webhook event
      // Check if "sg_machine_open" is consistently present in this webhook event and what it represents
      //    - This is a bool indicating if the recipient has "Apple Mail Privacy Protection (MPP)" enabled. (Check if I can't emulate this on my end, and see if it affects some props in the webhook response)
    },
  })
}

// It's confirmed that the "Event Objects" table in the docs is out of sync because
// it says the "type" property isn't part of the "bounce" events even though it is.
