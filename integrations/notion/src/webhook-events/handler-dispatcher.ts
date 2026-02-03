import * as sdk from '@botpress/sdk'
import * as crypto from 'crypto'
import * as handlers from './handlers'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  props.logger.forBot().debug('Received webhook event: ' + props.req.body)

  if (handlers.isWebhookVerificationRequest(props)) {
    return await handlers.handleWebhookVerificationRequest(props)
  } else if (handlers.isOAuthCallback(props)) {
    return await handlers.handleOAuthCallback(props)
  }

  _validatePayloadSignature(props)

  try {
    if (handlers.isDatabaseDeletedEvent(props)) {
      return await handlers.handleDatabaseDeletedEvent(props)
    } else if (handlers.isPageCreatedEvent(props)) {
      return await handlers.handlePageCreatedEvent(props)
    } else if (handlers.isPageDeletedEvent(props)) {
      return await handlers.handlePageDeletedEvent(props)
    } else if (handlers.isPageMovedEvent(props)) {
      return await handlers.handlePageMovedEvent(props)
    } else if (handlers.isCommentCreatedEvent(props)) {
      return await handlers.handleCommentCreatedEvent(props)
    }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    props.logger.forBot().error(`Handling webhook event failed: ${error.message}`)
    return { status: 200 }
  }

  props.logger.forBot().info('Unsupported webhook event received')
  return { status: 200 }
}

const _validatePayloadSignature = (props: bp.HandlerProps) => {
  const rawSignatureHeader = props.req.headers['X-Notion-Signature'] ?? props.req.headers['x-notion-signature']

  if (!rawSignatureHeader) {
    throw new sdk.RuntimeError('Missing Notion signature in request headers')
  }

  // Notion signature may be prefixed with "v1=" - extract just the hash part
  const bodySignatureFromNotion = rawSignatureHeader.includes('=')
    ? rawSignatureHeader.split('=')[1]
    : rawSignatureHeader

  let bodySignatureFromBotpress: string
  if (props.ctx.configurationType === 'customApp') {
    if (!props.ctx.configuration.webhookVerificationSecret) {
      throw new sdk.RuntimeError('Webhook verification secret is not set in the integration configuration')
    }
    bodySignatureFromBotpress = crypto
      .createHmac('sha256', props.ctx.configuration.webhookVerificationSecret)
      .update(props.req.body ?? '')
      .digest('hex')
  } else {
    bodySignatureFromBotpress = crypto
      .createHmac('sha256', bp.secrets.WEBHOOK_VERIFICATION_SECRET)
      .update(props.req.body ?? '')
      .digest('hex')
  }

  const notionSignatureBuffer = Buffer.from(bodySignatureFromNotion ?? '')
  const expectedSignatureBuffer = Buffer.from(bodySignatureFromBotpress)

  const payloadSignatureMatchesExpectedSignature = crypto.timingSafeEqual(
    notionSignatureBuffer,
    expectedSignatureBuffer
  )

  if (!payloadSignatureMatchesExpectedSignature) {
    throw new sdk.RuntimeError('Notion signature does not match the expected signature')
  }
}
