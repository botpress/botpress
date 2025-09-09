import * as bp from '.botpress'
import { getWebhookEventPayload, verifyWebhookSignature } from './loops.webhook'
import { fireEmailClicked } from './events/email-clicked'
import { fireEmailDelivered } from './events/email-delivered'
import { fireEmailHardBounced } from './events/email-hard-bounced'
import { fireEmailOpened } from './events/email-opened'
import { fireEmailSoftBounced } from './events/email-soft-bounced'
import { fireEmailSpamReported } from './events/email-spam-reported'
import { fireEmailUnsubscribed } from './events/email-unsubscribed'
import { RuntimeError } from '@botpress/sdk'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  props.logger.forBot().info('Handler received request from Loops with request:', props.req)

  verifyWebhookSignature(props)

  const payload = getWebhookEventPayload(props.req.body)

  const client = props.client

  switch (payload.eventName) {
    case 'email.delivered':
      await fireEmailDelivered(client, payload)
      return
    case 'email.softBounced':
      await fireEmailSoftBounced(client, payload)
      return
    case 'email.hardBounced':
      await fireEmailHardBounced(client, payload)
      return
    case 'email.opened':
      await fireEmailOpened(client, payload)
      return
    case 'email.clicked':
      await fireEmailClicked(client, payload)
      return
    case 'email.unsubscribed':
      await fireEmailUnsubscribed(client, payload)
        return
    case 'email.spamReported':
      await fireEmailSpamReported(client, payload)
      return
    default:
      throw new RuntimeError('Unsupported event type: ' + payload.eventName)
  } 
}