import { GoogleClient } from './google-api'
import { startWatch } from './watch'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  let googleClient: GoogleClient

  const createFromRefreshToken = async () => {
    try {
      return await GoogleClient.create({ client, ctx })
    } catch (err) {
      logger.forBot().error({ err }, 'Failed to create Google client from refresh token')
      throw err
    }
  }

  if (ctx.configurationType !== 'customApp') {
    logger.forBot().info('Using refresh token from configuration')
    googleClient = await createFromRefreshToken()
  } else {
    if (!ctx.configuration.oauthAuthorizationCode) {
      logger.forBot().info('No authorization code provided, using existing refresh token from state')
      googleClient = await createFromRefreshToken()
    } else {
      logger.forBot().info('Using authorization code from context')
      try {
        googleClient = await GoogleClient.createFromAuthorizationCode({
          client,
          ctx,
          authorizationCode: ctx.configuration.oauthAuthorizationCode,
        })
        logger.forBot().info('Successfully created Google client from authorization code')
      } catch (err) {
        logger.forBot().warn({ err }, 'Failed to create Google client from authorization code; falling back')
        googleClient = await createFromRefreshToken()
      }
    }
  }

  logger.forBot().info('Setting up Gmail watch for incoming emails...')
  try {
    await startWatch({ client, ctx, googleClient })
  } catch (thrown: unknown) {
    // Not fatal: the watch is renewed the next time the integration is called
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().warn(error.message)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}
