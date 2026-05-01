import { GoogleClient } from 'src/google-api'
import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

export const oauthCallbackHandler = async ({ client, ctx, req, logger }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const error = searchParams.get('error')
  if (error) {
    const errorMsg = `OAuth error: ${error} - ${searchParams.get('error_description') ?? ''}`
    logger.forBot().error(errorMsg)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }

  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    const errorMsg = 'Authorization code not present in OAuth callback'
    logger.forBot().error(errorMsg)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }

  try {
    await GoogleClient.authenticateWithAuthorizationCode({
      client,
      ctx,
      authorizationCode,
    })

    await client.configureIntegration({ identifier: ctx.webhookId })

    logger.forBot().info('Successfully authenticated with Google Calendar')
    return generateRedirection(getInterstitialUrl(true))
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to authenticate with Google Calendar: ${errorMsg}`)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }
}
