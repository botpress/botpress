import * as sdk from '@botpress/sdk'
import * as crypto from 'crypto'
import { handleFileChangeEvent, isFileChangeNotification } from './handlers/file-change'
import { isWebhookVerificationRequest, handleWebhookVerificationRequest } from './handlers/webhook-verification'
import { oauthCallbackHandler } from './oauth'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  if (props.req.path.startsWith('/oauth')) {
    return await oauthCallbackHandler(props)
  }

  if (isWebhookVerificationRequest(props)) {
    return await handleWebhookVerificationRequest(props)
  }

  _validatePayloadSignature(props)

  if (isFileChangeNotification(props)) {
    return await handleFileChangeEvent(props)
  }

  throw new sdk.RuntimeError('Unsupported webhook event')
}

const _getClientSecret = (ctx: bp.Context): string => {
  if (ctx.configurationType === 'manual') {
    return ctx.configuration.clientSecret
  }
  return bp.secrets.APP_SECRET
}

const _validatePayloadSignature = (props: bp.HandlerProps) => {
  const bodySignatureFromDropbox = props.req.headers['X-Dropbox-Signature'] ?? props.req.headers['x-dropbox-signature']

  if (!bodySignatureFromDropbox) {
    throw new sdk.RuntimeError('Missing Dropbox signature in request headers')
  }

  const clientSecret = _getClientSecret(props.ctx)
  const bodySignatureFromBotpress = crypto
    .createHmac('sha256', clientSecret)
    .update(props.req.body ?? '')
    .digest('hex')

  if (bodySignatureFromDropbox !== bodySignatureFromBotpress) {
    throw new sdk.RuntimeError('Dropbox signature does not match the expected signature')
  }
}
