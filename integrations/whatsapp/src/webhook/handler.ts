import { Request } from '@botpress/sdk'
import * as crypto from 'crypto'
import { getClientSecret } from 'src/auth'
import { WhatsAppPayload, WhatsAppPayloadSchema } from 'src/misc/types'
import { messagesHandler } from './handlers/messages'
import { oauthCallbackHandler } from './handlers/oauth'
import { reactionHandler } from './handlers/reaction'
import { isSandboxCommand, sandboxHandler } from './handlers/sandbox'
import { subscribeHandler } from './handlers/subscribe'
import * as bp from '.botpress'

const _handler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { req, logger } = props
  if (req.path.startsWith('/oauth')) {
    return await oauthCallbackHandler(props)
  }

  if (isSandboxCommand(props)) {
    return await sandboxHandler(props)
  }

  props.logger.debug('Received request with body:', req.body ?? '[empty]')
  const queryParams = new URLSearchParams(req.query)
  if (queryParams.has('hub.mode')) {
    return await subscribeHandler(props)
  }

  const validationResult = _validateRequestAuthentication(req, props)
  if (validationResult.error) {
    return { status: 401, body: validationResult.message }
  }

  if (!req.body) {
    logger.debug('Handler received an empty body, so the message was ignored')
    return
  }

  let payload: WhatsAppPayload
  try {
    const data = JSON.parse(req.body)
    payload = WhatsAppPayloadSchema.parse(data)
  } catch (e: any) {
    logger.debug('Error while handling request:', e)
    return { status: 500, body: 'Error while handling request: ' + e.message }
  }

  const value = payload.entry[0]?.changes[0]?.value
  if (!value) {
    logger.debug('No value found in the payload, ignoring message')
    return
  }

  const messages = value.messages
  if (messages) {
    for (const message of messages) {
      if (message.type === 'reaction') {
        await reactionHandler(message, props)
      } else {
        await messagesHandler(message, value, props)
      }
    }
  }
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
    if (response?.status && response.status !== 200) {
      props.logger.error(`WhatsApp handler failed with status ${response.status}: ${response.body}`)
    }
    return response
  } catch (error: any) {
    return { status: 500, body: error.message ?? 'Unknown error thrown' }
  }
}

export const handler = _handlerWrapper
