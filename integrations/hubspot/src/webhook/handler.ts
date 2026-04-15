import { generateRedirection } from '@botpress/common/src/html-dialogs'
import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Signature } from '@hubspot/api-client'
import { getClientSecret } from '../auth'
import { handleOperatorReplied } from '../hitl/events/operator-replied'
import { validateHubSpotSignature } from '../hitl/utils/signature'
import * as handlers from './handlers'
import { buildOAuthWizard } from './handlers/oauth-wizard'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  logger.debug(`Received request on ${req.path}: ${JSON.stringify(req.body, null, 2)}`)

  if (oauthWizard.isOAuthWizardUrl(req.path)) {
    try {
      return await buildOAuthWizard(props).handleRequest()
    } catch (thrown: unknown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      return generateRedirection(oauthWizard.getInterstitialUrl(false, errMsg))
    }
  }

  if (req.path.startsWith('/oauth')) {
    const modifiedProps = { ...props, req: { ...props.req, path: '/oauth/wizard/oauth-callback' } }
    try {
      return await buildOAuthWizard(modifiedProps).handleRequest()
    } catch (thrown: unknown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      return generateRedirection(oauthWizard.getInterstitialUrl(false, errMsg))
    }
  }

  // Global webhook subscriptions (conversation + CRM events) — array payload, v1 signature
  // Must be checked before the v3 header check because global webhooks can also send x-hubspot-signature-v3
  if (handlers.isConversationEvent(props) || handlers.isBatchUpdateEvent(props)) {
    const validation = _validateRequestAuthentication(props)
    if (validation.error) {
      logger.error(`Error validating request: ${validation.message}`)
      return { status: 401, body: validation.message }
    }

    if (handlers.isConversationEvent(props)) {
      return await handlers.handleConversationEvent(props)
    }

    return await handlers.handleBatchUpdateEvent(props)
  }

  // Custom Channel webhook — object payload, v3 signature
  if (req.headers['x-hubspot-signature-v3']) {
    return await _handleHitlEvent(props)
  }

  logger.warn(`No handler found for request on '/${req.path}'`)
  return { status: 404, body: 'No handler found' }
}

const _handleHitlEvent: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  const signature = req.headers['x-hubspot-signature-v3'] as string
  const timestamp = req.headers['x-hubspot-request-timestamp'] as string
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  const webhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
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

  if (Array.isArray(payload)) {
    // conversation.propertyChange events are sent via global webhooks (v1 signature) and handled there.
    // Custom Channel webhooks (v3) only send object-type events like OUTGOING_CHANNEL_MESSAGE_CREATED.
    logger.forBot().debug('Array payload received on v3 path — no handlers registered for this format')
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
