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
    const errorMsg = 'Webhook processing failed: empty body'
    logger.forBot().error(errorMsg)
    return {
      status: 400,
      body: JSON.stringify({ error: errorMsg }),
    }
  }

  // Parse and validate the webhook payload
  const webhookData = safeJsonParse(req.body)
  if (!webhookData.success) {
    const errorMsg = 'Webhook processing failed: invalid JSON'
    logger.forBot().error(errorMsg)
    return { status: 400, body: JSON.stringify({ error: errorMsg }) }
  }

  const parseResult = webhookPayloadSchema.safeParse(webhookData.data)
  if (!parseResult.success) {
    const errorMsg = `Webhook processing failed: ${parseResult.error.message}`
    logger.forBot().error(errorMsg)
    return { status: 400, body: JSON.stringify({ error: errorMsg }) }
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
}
