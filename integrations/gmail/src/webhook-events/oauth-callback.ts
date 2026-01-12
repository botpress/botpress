import { GoogleClient } from '../google-api'
import * as bp from '.botpress'

export const handleOAuthCallback = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  logger.forBot().info('Starting OAuth callback handling')

  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    logger.forBot().error('Error extracting code from url')
    return
  }

  logger.forBot().info('Creating Google client from authorization code')
  let googleClient: GoogleClient
  try {
    googleClient = await GoogleClient.createFromAuthorizationCode({
      client,
      ctx,
      authorizationCode,
    })
    logger.forBot().info('Google client created successfully')
  } catch (error) {
    logger.forBot().error(`Failed to create Google client: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }

  logger.forBot().info('Retrieving user email from Google profile')
  const userEmail = await googleClient.getMyEmail()

  if (!userEmail) {
    logger.forBot().error('Error extracting email from profile')
    return
  }

  logger.forBot().info(`User email retrieved: ${userEmail}`)

  logger.forBot().info(`Configuring integration for user: ${userEmail}`)
  await client.configureIntegration({
    identifier: userEmail,
  })
  logger.forBot().info('Integration configured successfully')
}
