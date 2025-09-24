import { webhookPayloadSchema } from 'src/schemas'
import { recordCreated, recordUpdated, recordDeleted } from '../events'
import * as bp from '.botpress'

export function safeJsonParse(x: any) {
  try {
    return { data: JSON.parse(x), success: true }
  } catch {
    return { data: x, success: false }
  }
}

export const handler: bp.IntegrationProps['handler'] = async ({ req, logger, client }) => {
  if (!req.body) {
    logger.forBot().error('Webhook processing failed: empty body')
    return {
      status: 400,
      body: JSON.stringify({ error: 'empty webhook payload' }),
    }
  }

  // Parse and validate the webhook payload
  const webhookData = safeJsonParse(req.body)
  if (!webhookData.success) {
    logger.forBot().error('Webhook processing failed: invalid body')
    return { status: 400, body: JSON.stringify({ error: 'invalid webhook payload' }) }
  }

  const parseResult = webhookPayloadSchema.safeParse(webhookData.data)
  if (!parseResult.success) {
    logger.forBot().error('Webhook processing failed: invalid payload structure', parseResult.error)
    return { status: 400, body: JSON.stringify({ error: 'invalid webhook payload structure' }) }
  }

  const { webhook_id, events } = parseResult.data
  logger.forBot().info(`Processing webhook ${webhook_id} with ${events.length} events`)

  // Process each event
  for (const attioEvent of events) {
    const event = attioEvent.event_type

    switch (event) {
      case 'record.created':
        const payloadCreated = attioEvent
        await recordCreated({ payload: payloadCreated, client, logger })
        break
      case 'record.updated':
        const payloadUpdated = attioEvent
        await recordUpdated({ payload: payloadUpdated, client, logger })
        break
      case 'record.deleted':
        const payloadDeleted = attioEvent
        await recordDeleted({ payload: payloadDeleted, client, logger })
        break
      default:
        logger.forBot().warn(`Unsupported event type: ${event}`)
    }
  }

  return { status: 200 }
}
