import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import { GoogleClient } from '../google-api'
import * as bp from '.botpress'

export const handleOAuthCallback = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  logger.forBot().info('Starting OAuth callback handling')

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
      throw new Error('Failed to extract email from Google profile')
    }

    logger.forBot().info(`User email retrieved: ${userEmail}`)

    logger.forBot().info(`Configuring integration for user: ${userEmail}`)
    await client.configureIntegration({
      identifier: userEmail,
    })
    logger.forBot().info('Integration configured successfully')
    return generateRedirection(getInterstitialUrl(true))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const errorMessage = 'OAuth error: ' + msg
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}
