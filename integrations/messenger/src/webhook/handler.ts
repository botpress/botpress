import { Request } from '@botpress/sdk'
import queryString from 'query-string'
import { getInterstitialUrl, redirectTo } from 'src/misc/html-utils'
import { handleMessage } from 'src/misc/incoming-message'
import { MessengerPayload } from 'src/misc/types'
import { handleWizard } from 'src/misc/wizard'
import * as bp from '.botpress'

const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  if (detectIdentifierIssue(req, ctx)) {
    return redirectTo(getInterstitialUrl(false, 'Not allowed'))
  }

  if (req.query?.includes('code') || req.query?.includes('wizard-step')) {
    try {
      return await handleWizard(req, client, ctx, logger)
    } catch (err: any) {
      const errorMessage = '(OAuth registration) Error: ' + err.message
      logger.forBot().error(errorMessage)
      return redirectTo(getInterstitialUrl(false, errorMessage))
    }
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

const detectIdentifierIssue = (req: Request, ctx: bp.Context) => {
  /* because of the wizard, we need to accept the query param "state" as an identifier
   * but we need to prevent anyone of using anything other than the webhookId there for security reasons
   */

  const query = queryString.parse(req.query)

  return !!(query['state']?.length && query['state'] !== ctx.webhookId)
}

export default handler satisfies bp.IntegrationProps['handler']
