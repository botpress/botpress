import { isSandboxCommand, meta } from '@botpress/common'
import { getClientSecret, getVerifyToken } from '../misc/auth'
import { eventPayloadSchema } from '../misc/types'
import { safeJsonParse } from '../misc/utils'
import { oauthHandler, messagingHandler, sandboxHandler, feedHandler } from './handlers'
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

  const parseResult = eventPayloadSchema.safeParse(jsonParseResult.data)
  if (!parseResult.success) {
    logger.forBot().warn('Unsupported Event Payload: ' + parseResult.error.message)
    return
  }

  const data = parseResult.data
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
      const errorMessage = `Messenger handler failed with status ${response.status}: ${response.body}`
      props.logger.error(errorMessage)
    }

    return response
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown.message : String(thrown)
    const errorMessage = `Messenger handler failed with error: ${error}`
    props.logger.error(errorMessage)
    return { status: 500, body: errorMessage }
  }
}

export default _handlerWrapper satisfies bp.IntegrationProps['handler']
