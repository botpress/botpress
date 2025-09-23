import { RuntimeError } from '@botpress/client'
import { webhookPayloadSchema } from '../../definitions/events'
import { recordCreated, recordUpdated, recordDeleted } from '../events'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, logger, client }) => {
  try {
    if (!req.body) {
      throw new RuntimeError('Invalid webhook payload')
    }

    // Parse and validate the webhook payload
    const webhookData = JSON.parse(req.body)
    const parseResult = webhookPayloadSchema.safeParse(webhookData)

    if (!parseResult.success) {
      logger.forBot().error('Invalid webhook payload structure:', parseResult.error)
      throw new RuntimeError('Invalid webhook payload structure')
    }

    const { webhook_id, events } = parseResult.data
    logger.forBot().info(`Processing webhook ${webhook_id} with ${events.length} events`)

    // Process each event
    for (const attioEvent of events) {
      const event = attioEvent.event_type

      switch (event) {
        case 'record.created':
          await recordCreated({ payload: attioEvent, client, logger })
          break
        case 'record.updated':
          logger.forBot().info(`Record updated: ${JSON.stringify(attioEvent)}`)
          await recordUpdated({ payload: attioEvent, client, logger })
          break
        case 'record.deleted':
          await recordDeleted({ payload: attioEvent, client, logger })
          break
        default:
          logger.forBot().warn(`Unsupported event type: ${event}`)
      }
    }

    return { status: 200 }
  } catch (error) {
    logger.forBot().error('Webhook processing failed:', error)
    return {
      status: 400,
      body: JSON.stringify({ error: 'invalid webhook payload' }),
    }
  }
}
