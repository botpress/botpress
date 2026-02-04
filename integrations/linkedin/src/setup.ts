import * as sdk from '@botpress/sdk'
import { LinkedInOAuthClient } from './linkedin-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  logger.forBot().debug('Registering LinkedIn integration')

  if (ctx.configurationType !== 'manual') {
    return
  }

  logger.forBot().debug('Using manual configuration, exchanging authorization code for tokens')

  const { clientId, clientSecret, authorizationCode } = ctx.configuration

  try {
    const oauthClient = await LinkedInOAuthClient.createFromManualConfig({
      authorizationCode,
      clientId,
      clientSecret,
      client,
      ctx,
      logger,
    })

    const linkedInUserId = oauthClient.getUserId()

    await client.configureIntegration({
      identifier: linkedInUserId,
    })

    logger.forBot().info(`LinkedIn integration registered for user: ${linkedInUserId}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.forBot().error(`Failed to exchange authorization code: ${message}`)
    throw new sdk.RuntimeError(
      `Failed to exchange authorization code: ${message}. The code may have expired - please generate a new one.`
    )
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({}) => {}
