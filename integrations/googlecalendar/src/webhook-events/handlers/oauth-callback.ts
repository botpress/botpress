import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import { GoogleClient } from 'src/google-api'
import * as bp from '.botpress'

export const oauthCallbackHandler = async ({ client, ctx, req, logger }: bp.HandlerProps) => {
  try {
    const searchParams = new URLSearchParams(req.query)
    const error = searchParams.get('error')
    if (error) {
      throw new Error(`${error} - ${searchParams.get('error_description') ?? ''}`)
    }

    const authorizationCode = searchParams.get('code')
    if (!authorizationCode) {
      throw new Error('Authorization code not present in OAuth callback')
    }

    await GoogleClient.authenticateWithAuthorizationCode({
      client,
      ctx,
      authorizationCode,
    })

    await client.configureIntegration({ identifier: ctx.webhookId })

    logger.forBot().info('Successfully authenticated with Google Calendar')
    return generateRedirection(getInterstitialUrl(true))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const errorMessage = 'OAuth error: ' + msg
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}
