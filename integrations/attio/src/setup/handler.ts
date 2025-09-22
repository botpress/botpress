import { RuntimeError } from '@botpress/client'
import { events } from '../../definitions/events'
import { recordCreated } from '../events'
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

      const attioEvent = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const payload = events.recordCreated.schema.parse(attioEvent)

      const event = payload.event_type

      switch (event) {
        case 'record.created':
          await recordCreated({ payload, client, logger })
          break
        default:
          throw new RuntimeError(`Unsupported event type: ${event}`)
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
