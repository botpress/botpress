import { webhookSchema } from 'definitions/schemas'
import { events } from 'src/events'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger, client } = props

  logger.debug(`Received request on ${req.method}: ${JSON.stringify(req.body)}`)

  if (req.method === 'POST' && req.path === '') {
    try {
      const { body } = req

      if (!body) {
        return
      }

      const mailerLiteEvent = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const payload = webhookSchema.parse(mailerLiteEvent)

      const event = payload['event']

      switch (event) {
        case 'subscriber.created':
          await events.subscriberCreated({ payload, client, logger })
          break
        default:
          throw new Error(`Unsupported event type: ${event}`)
      }
    } catch (error) {
      logger.error('Webhook validation failed:', error)
      return {
        status: 400,
        body: JSON.stringify({ error: 'invalid webhook payload' }),
      }
    }
  }
  return
}
