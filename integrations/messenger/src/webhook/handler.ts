import { meta } from '@botpress/common'
import { getVerifyToken } from '../misc/client'
import { handleMessage } from '../misc/incoming-message'
import { MessengerPayload } from '../misc/types'
import { oauth } from './handlers'
import * as bp from '.botpress'

const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, client, ctx, logger } = props
  if (req.path.startsWith('/oauth')) {
    return oauth.handler({ req, client, ctx, logger })
  }

  logger.forBot().debug('Handler received request from Messenger with payload:', req.body)
  const queryParams = new URLSearchParams(req.query)
  if (queryParams.has('hub.mode')) {
    return await meta.subscribeHandler({ ...props, verifyToken: getVerifyToken(ctx) })
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
    logger.forBot().debug('Request body received:', req.body)
  }

  return
}

export default handler satisfies bp.IntegrationProps['handler']
