import { meta } from '@botpress/common'
import { getClientSecret, getVerifyToken } from '../misc/auth'
import { messengerPayloadSchema } from '../misc/types'
import { safeJsonParse } from '../misc/utils'
import { oauthHandler, messageHandler } from './handlers'
import * as bp from '.botpress'

const _handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, client, ctx, logger } = props
  if (req.path.startsWith('/oauth')) {
    return oauthHandler({ req, client, ctx, logger })
  }

  logger.debug('Received request with body:', req.body ?? '[empty]')
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

  const jsonParseResult = safeJsonParse(req.body)
  if (!jsonParseResult.success) {
    logger.forBot().warn('Error while parsing body as JSON:', jsonParseResult.data)
    return
  }

  const parseResult = messengerPayloadSchema.safeParse(jsonParseResult.data)
  if (!parseResult.success) {
    logger.forBot().warn('Error while parsing body as Messenger payload:', parseResult.error.message)
    return
  }
  const data = parseResult.data

  for (const { messaging } of data.entry) {
    const message = messaging[0]
    await messageHandler(message, props)
  }

  return
}

const _handlerWrapper: typeof _handler = async (props: bp.HandlerProps) => {
  try {
    const response = await _handler(props)
    if (response?.status && response.status >= 400) {
      props.logger.error(`Messenger handler failed with status ${response.status}: ${response.body}`)
    }
    return response
  } catch (error: any) {
    return { status: 500, body: error?.message ?? 'Unknown error thrown' }
  }
}

export default _handlerWrapper satisfies bp.IntegrationProps['handler']
