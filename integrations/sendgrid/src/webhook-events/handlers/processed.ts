import * as bp from '../../../.botpress'
import { SendGridWebhookEvent } from '../../misc/custom-types'
import { unixTimestampToUtcDatetime } from '../../misc/utils'

export const handleProcessedEvent = async ({ client }: bp.HandlerProps, event: SendGridWebhookEvent) => {
  return await client.createEvent({
    type: 'processed',
    payload: {
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
    },
  })
}
