import { isSandboxCommand } from '@botpress/common'
import { Request } from '@botpress/sdk'
import { getClientSecret } from 'src/misc/client'
import { commentsHandler } from './handlers/comments'
import { messagingHandler } from './handlers/messages'
import { oauthCallbackHandler } from './handlers/oauth'
import { sandboxHandler } from './handlers/sandbox'
import { subscribeHandler } from './handlers/subscribe'
import { InstagramCommentPayloadSchema, InstagramMessagePayloadSchema } from 'src/misc/types'
import { safeJsonParse } from 'src/misc/utils'
import * as crypto from 'crypto'
import * as bp from '.botpress'

const _handler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { req } = props

  if (req.path.startsWith('/oauth')) {
    return await oauthCallbackHandler(props)
  }

  if (isSandboxCommand(props)) {
    return await sandboxHandler(props)
  }

  const queryParams = new URLSearchParams(req.query)
  if (queryParams.has('hub.mode')) {
    return await subscribeHandler(props)
  }

  const validationResult = _validateRequestAuthentication(req, props)
  if (validationResult.error) {
    return { status: 401, body: validationResult.message }
  }
  const { data, success } = safeJsonParse(req.body)
  if (!success) {
    return { status: 400, body: 'Invalid payload' }
  }

  let bodyResult = InstagramMessagePayloadSchema.safeParse(data)
  if (bodyResult.success) {
    return await messagingHandler(bodyResult.data, props)
  }

  if (props.ctx.configuration.replyToComments) {
    const commentBodyResult = InstagramCommentPayloadSchema.safeParse(data)
    if (commentBodyResult.success) {
      return await commentsHandler(commentBodyResult.data, props)
    }
  }

  props.logger.warn('Received unsupported Instagram payload')
  return { status: 400, body: 'Unsupported payload' }
}

const _validateRequestAuthentication = (
  req: Request,
  { ctx }: { ctx: bp.Context }
): { error: true; message: string } | { error: false } => {
  const secret = getClientSecret(ctx)
  if (!secret) {
    return { error: false }
  }

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
