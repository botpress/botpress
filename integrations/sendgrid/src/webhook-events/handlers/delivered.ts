import { DeliveredEmailWebhook } from '../../../definitions/external'
import { unixTimestampToUtcDatetime } from '../../misc/utils'
import * as bp from '.botpress'

export const handleDeliveredEvent = async ({ client }: bp.HandlerProps, event: DeliveredEmailWebhook) => {
  return await client.createEvent({
    type: 'delivered',
    payload: {
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      email: event.email,
    },
  })
}
