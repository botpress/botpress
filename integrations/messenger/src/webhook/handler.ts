import { isSandboxCommand, meta } from '@botpress/common'
import { getClientSecret, getVerifyToken } from '../misc/auth'
import { eventPayloadSchema } from '../misc/types'
import { getErrorFromUnknown, safeJsonParse } from '../misc/utils'
import { oauthHandler, messagingHandler, feedHandler, sandboxHandler } from './handlers'
import * as bp from '.botpress'

const _handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, client, ctx, logger } = props

  if (req.path.startsWith('/oauth')) {
    return oauthHandler({ req, client, ctx, logger })
  }

  if (isSandboxCommand(props)) {
    return await sandboxHandler(props)
  }

  const queryParams = new URLSearchParams(req.query)
  if (queryParams.has('hub.mode')) {
    return await meta.subscribeHandler({ ...props, verifyToken: getVerifyToken(ctx) })
  }

  const validationResult = await meta.validateRequestSignature({ req, clientSecret: getClientSecret(ctx) })
  if (validationResult.error) {
    return { status: 401, body: validationResult.message }
  }

  if (!req.body) {
    logger.forBot().warn('Handler received an empty body, so the message was ignored')
    return
  }

  props.logger.debug(`Handler received body: ${req.body}`)

  const jsonParseResult = safeJsonParse(req.body)
  if (!jsonParseResult.success) {
    logger.forBot().warn('Error while parsing body as JSON:', jsonParseResult.data)
    return
  }

  // Parse as messenger payload
  // TODO: Refactor handler to also handle feed entries
  const messengerParseResult = eventPayloadSchema.safeParse(jsonParseResult.data)
  if (!messengerParseResult.success) {
    logger.forBot().warn('Error while parsing body as event payload')
    return
  }
  const data = messengerParseResult.data
  for (const entry of data.entry) {
    if ('messaging' in entry) {
      await messagingHandler(entry.messaging, props)
    } else if ('changes' in entry) {
      await feedHandler(entry.changes, props)
    }
  }
  return
}

const _handlerWrapper: typeof _handler = async (props: bp.HandlerProps) => {
  try {
    const response = await _handler(props)
    if (response?.status && response.status >= 400) {
      props.logger.error(`Facebook/Messenger handler failed with status ${response.status}: ${response.body}`)
    }
    return response
  } catch (error) {
    return { status: 500, body: getErrorFromUnknown(error).message }
  }
}

export default _handlerWrapper satisfies bp.IntegrationProps['handler']
