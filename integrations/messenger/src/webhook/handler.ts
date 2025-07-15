import { meta } from '@botpress/common'
import { getClientSecret, getVerifyToken } from '../misc/client'
import { handleMessage } from '../misc/incoming-message'
import { MessengerPayload } from '../misc/types'
import { oauth } from './handlers'
import * as bp from '.botpress'

const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, client, ctx, logger } = props
  if (req.path.startsWith('/oauth')) {
    return oauth.handler({ req, client, ctx, logger })
  }

  logger.forBot().debug('Received request with body:', req.body ?? '[empty]')
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

export default handler satisfies bp.IntegrationProps['handler']
