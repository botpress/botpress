import * as bp from '.botpress'
import { getWebhookEventPayload, verifyWebhookSignature } from './loops.webhook'
import events from './events'
import { RuntimeError } from '@botpress/sdk'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  props.logger.forBot().info('Handler received request from Loops with request:', props.req)

  verifyWebhookSignature(props)

  const payload = getWebhookEventPayload(props.req.body)

  const client = props.client

  switch (payload.eventName) {
    case 'email.delivered':
      await events.fireEmailDelivered(client, payload)
      return
    case 'email.softBounced':
      await events.fireEmailSoftBounced(client, payload)
      return
    case 'email.hardBounced':
      await events.fireEmailHardBounced(client, payload)
      return
    case 'email.opened':
      await events.fireEmailOpened(client, payload)
      return
    case 'email.clicked':
      await events.fireEmailClicked(client, payload)
      return
    case 'email.unsubscribed':
      await events.fireEmailUnsubscribed(client, payload)
      return
    case 'email.spamReported':
      await events.fireEmailSpamReported(client, payload)
      return
    default:
      throw new RuntimeError('Unsupported event type: ' + payload.eventName)
  } 
}