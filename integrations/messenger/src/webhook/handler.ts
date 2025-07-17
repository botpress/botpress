import { meta } from '@botpress/common'
import { getClientSecret, getVerifyToken } from '../misc/auth'
import { handleMessage } from '../misc/incoming-message'
import { MessengerPayload } from '../misc/types'
import { oauth } from './handlers'
import * as bp from '.botpress'

const _handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, client, ctx, logger } = props
  if (req.path.startsWith('/oauth')) {
    return oauth.handler({ req, client, ctx, logger })
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
  try {
    const data = JSON.parse(req.body) as MessengerPayload

    for (const { messaging } of data.entry) {
      for (const message of messaging) {
        await handleMessage(message, { client, ctx, logger })
      }
    }
  } catch (e: any) {
    logger.forBot().error('Error while handling request:', e)
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
