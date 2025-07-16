import * as bp from '../../../.botpress'
import { unixTimestampToUtcDatetime } from '../../misc/utils'
import { DeferredEmailWebhook } from '../sendgrid-webhook-schemas'

export const handleDeferredEvent = async ({ client }: bp.HandlerProps, event: DeferredEmailWebhook) => {
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
