import { GoogleClient } from '../google-api'
import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

export const handleOAuthCallback = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  logger.forBot().info('Starting OAuth callback handling')

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
    logger.forBot().info('Creating Google client from authorization code')
    const googleClient = await GoogleClient.createFromAuthorizationCode({
      client,
      ctx,
      authorizationCode,
    })
    logger.forBot().info('Google client created successfully')

    logger.forBot().info('Retrieving user email from Google profile')
    const userEmail = await googleClient.getMyEmail()

    if (!userEmail) {
      const errorMsg = 'Failed to extract email from Google profile'
      logger.forBot().error(errorMsg)
      return generateRedirection(getInterstitialUrl(false, errorMsg))
    }

    logger.forBot().info(`User email retrieved: ${userEmail}`)

    logger.forBot().info(`Configuring integration for user: ${userEmail}`)
    await client.configureIntegration({
      identifier: userEmail,
    })
    logger.forBot().info('Integration configured successfully')
    return generateRedirection(getInterstitialUrl(true))
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to process OAuth callback: ${errorMsg}`)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }
}
