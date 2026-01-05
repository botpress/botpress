import { isSandboxCommand } from '@botpress/common'
import { Request } from '@botpress/sdk'
import * as crypto from 'crypto'
import { getClientSecret } from 'src/misc/client'
import {
  instagramPayloadSchema,
  InstagramLegacyCommentEntry,
  InstagramCommentEntry,
  InstagramComment,
  InstagramLegacyComment,
} from 'src/misc/types'
import { safeJsonParse } from 'src/misc/utils'
import { commentsHandler } from './handlers/comments'
import { messagingHandler } from './handlers/messages'
import { oauthCallbackHandler } from './handlers/oauth'
import { sandboxHandler } from './handlers/sandbox'
import { subscribeHandler } from './handlers/subscribe'
import * as bp from '.botpress'

const _canReplyToComments = (ctx: bp.Context) => {
  if (ctx.configurationType === 'sandbox') {
    return false
  }
  return ctx.configuration.replyToComments
}

const _handler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { req, logger } = props

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

  logger.forBot().debug('Received request with body:', req.body ?? '[empty]')

  const validationResult = _validateRequestAuthentication(req, props)
  if (validationResult.error) {
    return { status: 401, body: validationResult.message }
  }

  const { data, success } = safeJsonParse(req.body)
  if (!success) {
    const errorMsg = 'Unable to parse request payload as JSON'
    return { status: 400, body: errorMsg }
  }

  const payloadResult = instagramPayloadSchema.safeParse(data)
  if (!payloadResult.success) {
    logger.forBot().warn('Unsupported Event Payload: ' + payloadResult.error.message)
    return { status: 200 }
  }

  const payload = payloadResult.data
  for (const entry of payload.entry) {
    if ('messaging' in entry) {
      await messagingHandler(entry.messaging, props)
    } else {
      await _commentEntryHandler(entry, props)
    }
  }

  return { status: 200 }
}

const _commentEntryHandler = async (
  entry: InstagramCommentEntry | InstagramLegacyCommentEntry,
  props: bp.HandlerProps
) => {
  if (!_canReplyToComments(props.ctx)) {
    return
  }

  let comments: InstagramComment[] | InstagramLegacyComment[] = []
  if ('value' in entry) {
    comments = [entry.value]
  } else {
    // Legacy "Facebook Login for Business" format
    comments = entry.changes.map((change) => change.value)
  }

  await commentsHandler(comments, props)
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
      const errorMessage = `Instagram handler failed with status ${response.status}: ${response.body}`
      props.logger.error(errorMessage)
    }
    return response
  } catch (thrown: unknown) {
    const errorMsg = thrown instanceof Error ? thrown.message : String(thrown)
    const errorMessage = `Instagram handler failed with error: ${errorMsg}`
    props.logger.error(errorMessage)
    return { status: 500, body: errorMessage }
  }
}

export const handler = _handlerWrapper
