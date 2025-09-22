import { RuntimeError } from '@botpress/client'
import { recordCreated } from '../events'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, logger, client }) => {
  logger.forBot().debug(`Received request on ${req.method}: ${JSON.stringify(req.body)}`)

  try {
    if (!req.body) {
      throw new RuntimeError('Invalid webhook payload')
    }

    const attioEvent = JSON.parse(req.body).events[0]
    const event = attioEvent.event_type
    logger.forBot().debug(`Attio Event: ${event}`)

    switch (event) {
      case 'record.created':
        await recordCreated({ payload: attioEvent, client, logger })
        break
      default:
        throw new RuntimeError(`Unsupported event type: ${event}`)
    }

    return { status: 200 }
  } catch (error) {
    logger.forBot().error('Webhook validation failed:', error)
    return {
      status: 400,
      body: JSON.stringify({ error: 'invalid webhook payload' }),
    }
  }
}
