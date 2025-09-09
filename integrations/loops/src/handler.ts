import events from './events'
import { getWebhookEventPayload, verifyWebhookSignature } from './loops.webhook'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  props.logger.forBot().info('Handler received request from Loops with request:', props.req)

  verifyWebhookSignature(props)

  const payload = getWebhookEventPayload(props.req.body)

  const client = props.client

  switch (payload.eventName) {
    case 'email.delivered':
      await events.fireEmailDelivered(client, payload)
      break
    case 'email.softBounced':
      await events.fireEmailSoftBounced(client, payload)
      break
    case 'email.hardBounced':
      await events.fireEmailHardBounced(client, payload)
      break
    case 'email.opened':
      await events.fireEmailOpened(client, payload)
      break
    case 'email.clicked':
      await events.fireEmailClicked(client, payload)
      break
    case 'email.unsubscribed':
      await events.fireEmailUnsubscribed(client, payload)
      break
    case 'email.spamReported':
      await events.fireEmailSpamReported(client, payload)
      break
    default:
      props.logger
        .forBot()
        .error('Unsupported event type: ' + payload.eventName + ' with payload: ' + JSON.stringify(payload))
      return
  }

  props.logger.forBot().info('Event processed successfully with payload:', payload)
}
