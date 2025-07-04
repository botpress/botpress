import * as bp from '../../../.botpress'
import { SendGridWebhookEvent } from '../../misc/custom-types'
import { hasPropOfType, unixTimestampToUtcDatetime } from '../../misc/utils'

const BOUNCE_CLASSIFICATION_PROP = 'bounce_classification' as const
const BOUNCE_TYPE_PROP = 'type' as const

export const handleBouncedEvent = async ({ client, logger }: bp.HandlerProps, event: SendGridWebhookEvent) => {
  if (
    !hasPropOfType(event, BOUNCE_CLASSIFICATION_PROP, 'string') ||
    !hasPropOfType(event, BOUNCE_TYPE_PROP, 'string')
  ) {
    const invalidProps = [BOUNCE_CLASSIFICATION_PROP, BOUNCE_TYPE_PROP]
      .filter((property) => hasPropOfType(event, property, 'string'))
      .join('", "')

    logger.error(
      `The following properties were either not present or of an unexpected type on the SendGrid Bounce Event "${invalidProps}"`
    )
    return
  }

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
