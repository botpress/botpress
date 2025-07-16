import * as sdk from '@botpress/sdk'
import * as crypto from 'crypto'
import * as handlers from './handlers'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  if (handlers.isWebhookVerificationRequest(props)) {
    return await handlers.handleWebhookVerificationRequest(props)
  } else if (handlers.isOAuthCallback(props)) {
    return await handlers.handleOAuthCallback(props)
  }

  _validatePayloadSignature(props)

  if (handlers.isDatabaseDeletedEvent(props)) {
    return await handlers.handleDatabaseDeletedEvent(props)
  } else if (handlers.isPageCreatedEvent(props)) {
    return await handlers.handlePageCreatedEvent(props)
  } else if (handlers.isPageDeletedEvent(props)) {
    return await handlers.handlePageDeletedEvent(props)
  } else if (handlers.isPageMovedEvent(props)) {
    return await handlers.handlePageMovedEvent(props)
  }

  throw new sdk.RuntimeError('Unsupported webhook event')
}

const _validatePayloadSignature = (props: bp.HandlerProps) => {
  const bodySignatureFromNotion = props.req.headers['X-Notion-Signature'] ?? props.req.headers['x-notion-signature']

  if (!bodySignatureFromNotion) {
    throw new sdk.RuntimeError('Missing Notion signature in request headers')
  }

  if (props.ctx.configurationType === null) {
    // We currently don't support webhook verification for custom Notion integrations
    return
  }

  const bodySignatureFromBotpress =
    'sha256=' +
    crypto
      .createHmac('sha256', bp.secrets.WEBHOOK_VERIFICATION_SECRET)
      .update(props.req.body ?? '')
      .digest('hex')

  const payloadSignatureMatchesExpectedSignature = crypto.timingSafeEqual(
    Buffer.from(bodySignatureFromNotion),
    Buffer.from(bodySignatureFromBotpress)
  )

  if (!payloadSignatureMatchesExpectedSignature) {
    throw new sdk.RuntimeError('Notion signature does not match the expected signature')
  }
}
