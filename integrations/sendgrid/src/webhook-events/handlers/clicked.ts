import * as bp from '../../../.botpress'
import { unixTimestampToUtcDatetime } from '../../misc/utils'
import { ClickedEmailWebhook } from '../sendgrid-webhook-schemas'

export const handleClickedEvent = async ({ client }: bp.HandlerProps, event: ClickedEmailWebhook) => {
  return await client.createEvent({
    type: 'clicked',
    payload: {
      email: event.email,
      eventId: event.sg_event_id,
      messageId: event.sg_message_id,
      timestamp: unixTimestampToUtcDatetime(event.timestamp),
      url: event.url,
      urlOffset: event.url_offset.index,
    },
  })
}
