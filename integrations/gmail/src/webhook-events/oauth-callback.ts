import * as sdk from '@botpress/sdk'
import { GoogleClient } from '../google-api'
import * as bp from '.botpress'

export const handleOAuthCallback = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  logger.forBot().info('Starting OAuth callback handling')

  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    logger.forBot().error('Error extracting code from url')
    throw new sdk.RuntimeError('OAuth callback did not receive an authorization code from Google.')
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
    throw new sdk.RuntimeError(
      `Failed to authenticate with Google: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  logger.forBot().info('Retrieving user email from Google profile')
  let userEmail: string | null | undefined
  try {
    userEmail = await googleClient.getMyEmail()
  } catch (error) {
    logger.forBot().error(`Failed to retrieve email: ${error instanceof Error ? error.message : String(error)}`)
    throw new sdk.RuntimeError('Failed to retrieve your Gmail address. Please try again.')
  }

  if (!userEmail) {
    logger.forBot().error('Error extracting email from profile')
    throw new sdk.RuntimeError('Could not determine your Gmail address from your Google profile.')
  }

  logger.forBot().info(`User email retrieved: ${userEmail}`)

  logger.forBot().info(`Configuring integration for user: ${userEmail}`)
  try {
    await client.configureIntegration({
      identifier: userEmail,
    })
  } catch (error) {
    logger.forBot().error(`Failed to configure integration: ${error instanceof Error ? error.message : String(error)}`)
    throw new sdk.RuntimeError(
      `Failed to configure Gmail for ${userEmail}. This email may already be connected to another bot.`
    )
  }
  logger.forBot().info('Integration configured successfully')
}
