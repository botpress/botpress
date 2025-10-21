import { isSandboxCommand } from '@botpress/common'
import { Request } from '@botpress/sdk'
import * as crypto from 'crypto'
import { getClientSecret } from 'src/misc/client'
import { InstagramPayloadSchema, InstagramEntry } from 'src/misc/types'
import { InstagramEntryType, safeJsonParse, getEntryType } from 'src/misc/utils'
import { commentEntryHandler } from './handlers/comments'
import { messageEntryHandler } from './handlers/messages'
import { oauthCallbackHandler } from './handlers/oauth'
import { sandboxHandler } from './handlers/sandbox'
import { subscribeHandler } from './handlers/subscribe'
import * as bp from '.botpress'

// Entry handler type definition
type EntryHandler = (entry: InstagramEntry, props: bp.HandlerProps) => Promise<void>

// Handler registry mapping entry types to their handlers
type HandlerRegistry = Partial<Record<InstagramEntryType, EntryHandler>>

// Build handler registry based on configuration
const _buildHandlerRegistry = (): HandlerRegistry => {
  const registry: HandlerRegistry = {
    message: messageEntryHandler as EntryHandler,
    comment: commentEntryHandler as EntryHandler,
  }
  return registry
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
    return { status: 400, body: 'Invalid payload body' }
  }

  // Parse payload once with entry-level union schema
  const payloadResult = InstagramPayloadSchema.safeParse(data)
  if (!payloadResult.success) {
    props.logger.warn('Received invalid Instagram payload:', payloadResult.error.message)
    return { status: 400, body: 'Invalid payload' }
  }

  const payload = payloadResult.data
  const handlerRegistry = _buildHandlerRegistry()

  // Process each entry independently
  for (const entry of payload.entry) {
    try {
      const entryType = getEntryType(entry)
      const handler = handlerRegistry[entryType]

      if (!handler) {
        props.logger.forBot().warn(`No handler registered for entry type: ${entryType}`)
        continue
      }

      if (entryType === 'comment') {
        if (props.ctx.configurationType === 'sandbox') {
          props.logger.forBot().debug('Skipping comment entry (replyToComments is disabled in sandbox mode)')
          continue
        }

        if (!props.ctx.configuration.replyToComments) {
          props.logger.forBot().debug('Skipping comment entry (replyToComments is disabled)')
          continue
        }
      }

      await handler(entry, props)
    } catch (thrown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      props.logger.forBot().error(`Failed to process entry ${entry.id}:`, error.message)
    }
  }

  return { status: 200 }
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
