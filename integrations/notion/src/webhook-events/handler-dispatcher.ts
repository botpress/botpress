import * as sdk from '@botpress/sdk'
import * as crypto from 'crypto'
import { handleOAuthCallback, isOAuthCallback } from './handlers/oauth-callback'
import { isWebhookVerificationRequest, handleWebhookVerificationRequest } from './handlers/webhook-verification'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  if (isWebhookVerificationRequest(props)) {
    return await handleWebhookVerificationRequest(props)
  } else if (isOAuthCallback(props)) {
    return await handleOAuthCallback(props)
  }

  _validatePayloadSignature(props)

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
