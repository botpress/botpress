import queryString from 'query-string'
import { handleMessage } from '../misc/incoming-message'
import { MessengerPayload } from '../misc/types'
import { oauth } from './handlers'
import * as bp from '.botpress'

const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  if (req.path.startsWith('/oauth')) {
    return oauth.handler({ req, client, ctx, logger })
  }

  logger.forBot().debug('Handler received request from Messenger with payload:', req.body)
  if (req.query) {
    const query: Record<string, string | string[] | null> = queryString.parse(req.query)

    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']

    // For oAuth, this is handled at fallbackHandler.vrl
    if (mode === 'subscribe' && ctx.configurationType === 'manualApp') {
      if (token === ctx.configuration.verifyToken) {
        if (!challenge) {
          logger.forBot().warn('Returning HTTP 400 as no challenge parameter was received in query string of request')
          return {
            status: 400,
          }
        }

        return {
          body: typeof challenge === 'string' ? challenge : '',
        }
      } else {
        logger.forBot().warn("Returning HTTP 403 as the Messenger token doesn't match the one in the bot configuration")
        return {
          status: 403,
        }
      }
    } else {
      logger.forBot().warn(`Returning HTTP 400 as the '${mode}' mode received in the query string isn't supported`)
      return {
        status: 400,
      }
    }
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
