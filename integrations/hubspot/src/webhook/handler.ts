import { Signature } from '@hubspot/api-client'
import { getClientSecret } from '../auth'
import { validateHubSpotSignature } from '../hitl/utils/signature'
import { handleOperatorAssignedUpdate } from '../hitl/events/operator-assigned'
import { handleOperatorReplied } from '../hitl/events/operator-replied'
import { handleConversationCompleted } from '../hitl/events/conversation-completed'
import { getHitlClient } from '../hitl/client'
import * as handlers from './handlers'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, ctx, client, logger } = props

  logger.debug(`Received request on ${req.path}: ${JSON.stringify(req.body, null, 2)}`)

  if (handlers.isOAuthCallback(props)) {
    return await handlers.handleOAuthCallback(props)
  }

  // HITL events (Custom Channel webhook) use the v3 signature header
  if (req.headers['x-hubspot-signature-v3']) {
    return await _handleHitlEvent(props)
  }

  // CRM batch-update events use v1 signature
  const validation = _validateRequestAuthentication(props)
  if (validation.error) {
    logger.error(`Error validating request: ${validation.message}`)
    return { status: 401, body: validation.message }
  }

  if (handlers.isBatchUpdateEvent(props)) {
    return await handlers.handleBatchUpdateEvent(props)
  }

  logger.warn(`No handler found for request on '/${req.path}'`)
  return { status: 404, body: 'No handler found' }
}

const _handleHitlEvent: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  const signature = req.headers['x-hubspot-signature-v3'] as string
  const timestamp = req.headers['x-hubspot-request-timestamp'] as string
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`
  const clientSecret = getClientSecret(ctx)

  if (clientSecret) {
    const isValid = validateHubSpotSignature(
      rawBody,
      signature,
      timestamp,
      req.method,
      webhookUrl,
      clientSecret,
      logger
    )
    if (!isValid) {
      logger.forBot().error('Invalid HubSpot v3 signature — rejecting HITL event')
      return { status: 401, body: 'Invalid signature' }
    }
    logger.forBot().info('HubSpot v3 webhook signature verified')
  } else {
    logger.forBot().warn('No client secret configured — skipping HITL webhook signature validation')
  }

  let payload: any
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch (err) {
    logger.forBot().error('Failed to parse HITL request body:', err)
    return { status: 400, body: 'Invalid JSON body' }
  }

  const hubSpotClient = getHitlClient(ctx, client, logger)

  if (Array.isArray(payload)) {
    for (const event of payload) {
      if (
        event.subscriptionType === 'conversation.propertyChange' &&
        event.propertyName === 'assignedTo' &&
        event.propertyValue
      ) {
        logger.forBot().info(`Operator assigned: ${event.propertyValue}`)
        await handleOperatorAssignedUpdate({ hubspotEvent: event, client, hubSpotClient, logger })
      }

      if (
        event.subscriptionType === 'conversation.propertyChange' &&
        event.propertyName === 'status' &&
        event.propertyValue === 'CLOSED'
      ) {
        logger.forBot().info('Conversation closed by operator')
        await handleConversationCompleted({ hubspotEvent: event, client })
      }
    }
    return
  }

  if (payload.type === 'OUTGOING_CHANNEL_MESSAGE_CREATED') {
    logger.forBot().info('New outgoing message from operator')
    await handleOperatorReplied({ hubspotEvent: payload, client })
    return
  }

  if (payload.type === 'CHANNEL_ACCOUNT_CREATED') {
    logger.forBot().info(`Channel account created: ${JSON.stringify(payload)}`)
    return
  }

  logger.forBot().warn('Unhandled HubSpot HITL event format')
}

const _validateRequestAuthentication = ({ req, ctx }: bp.HandlerProps) => {
  const clientSecret = getClientSecret(ctx)
  if (!clientSecret) {
    return { error: false }
  }

  const signature = req.headers['x-hubspot-signature']
  if (!signature) {
    return { error: true, message: 'Missing "x-hubspot-signature" header' }
  }

  const isValid = Signature.isValid({
    clientSecret,
    requestBody: req.body ?? '',
    signature,
  })
  if (!isValid) {
    return { error: true, message: 'Invalid signature' }
  }

  return { error: false }
}
