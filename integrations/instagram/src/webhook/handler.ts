import { Request } from '@botpress/sdk'
import * as crypto from 'crypto'
import { getClientSecret } from 'src/misc/client'
import { messagesHandler } from './handlers/messages'
import { oauthCallbackHandler } from './handlers/oauth'
import { subscribeHandler } from './handlers/subscribe'
import * as bp from '.botpress'

const _handler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { req } = props
  if (req.path.startsWith('/oauth')) {
    return await oauthCallbackHandler(props)
  }

  const queryParams = new URLSearchParams(req.query)
  if (queryParams.has('hub.mode')) {
    return await subscribeHandler(props)
  }

  const validationResult = _validateRequestAuthentication(req, props)
  if (validationResult.error) {
    return { status: 403, body: validationResult.message }
  }
  return await messagesHandler(props)
}

const _validateRequestAuthentication = (
  req: Request,
  { ctx }: { ctx: bp.Context }
): { error: true; message: string } | { error: false } => {
  const secret = getClientSecret(ctx)
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.body ?? '')
    .digest('hex')
  const signature = req.headers['x-hub-signature-256']?.split('=')[1]
  if (signature !== expectedSignature) {
    return { error: true, message: `Invalid signature (got ${signature ?? 'none'}, expected ${expectedSignature})` }
  }
  return { error: false }
}

const _handlerWrapper: typeof _handler = async (props: bp.HandlerProps) => {
  try {
    const response = await _handler(props)
    if (response && response.status !== 200) {
      props.logger.error(`Instagram handler failed with status ${response.status}: ${response.body}`)
    }
    return response
  } catch (error: any) {
    return { status: 500, body: error.message ?? 'Unknown error thrown' }
  }
}

export const handler = _handlerWrapper
