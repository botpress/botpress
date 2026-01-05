import { posthogHelper } from '@botpress/common'
import { posthogConfig } from 'src'
import { GoogleClient } from './google-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  const startTime = Date.now()
  let googleClient: GoogleClient

  const createFromRefreshToken = async () => {
    try {
      return await GoogleClient.create({ client, ctx })
    } catch (err) {
      logger.forBot().error({ err }, 'Failed to create Google client from refresh token')
      throw err
    }
  }

  const getStoredAuthorizationCode = async (): Promise<string | undefined> => {
    const res = await client
      .getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
      .catch(() => ({ state: undefined }))

    return (res.state?.payload as { authorizationCode?: string } | undefined)?.authorizationCode
  }

  if (ctx.configurationType !== 'customApp') {
    logger.forBot().info('Using refresh token from configuration')
    googleClient = await createFromRefreshToken()
  } else if (ctx.configuration.oauthAuthorizationCode) {
    const currentCode = ctx.configuration.oauthAuthorizationCode
    const storedCode = await getStoredAuthorizationCode()

    if (storedCode !== currentCode) {
      logger.forBot().info('Authorization code changed, attempting to use new code')
      try {
        googleClient = await GoogleClient.createFromAuthorizationCode({
          client,
          ctx,
          authorizationCode: currentCode,
        })
        logger.forBot().info('Successfully updated Gmail integration with new authorization code')
      } catch (err) {
        logger.forBot().warn({ err }, 'Failed to create Google client from new authorization code; falling back')
        googleClient = await createFromRefreshToken()
      }
    } else {
      logger.forBot().info('Authorization code unchanged, using existing refresh token from state')
      googleClient = await createFromRefreshToken()
    }
  } else {
    logger.forBot().info('No authorization code provided, using existing refresh token from state')
    googleClient = await createFromRefreshToken()
  }

  logger.forBot().info('Setting up Gmail watch for incoming emails...')
  try {
    await googleClient.watchIncomingMail()
  } catch (error) {
    logger.forBot().error(`Failed to set up Gmail watch ${error}`)
  }

  const configurationTimeMs = Date.now() - startTime

  await posthogHelper
    .sendPosthogEvent(
      {
        distinctId: ctx.integrationId,
        event: 'integration_registered',
        properties: {
          botId: ctx.botId,
          configurationType: ctx.configurationType,
          configurationTimeMs,
        },
      },
      posthogConfig
    )
    .catch(() => {
      // Silently fail if PostHog is unavailable
    })
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx }) => {
  await posthogHelper
    .sendPosthogEvent(
      {
        distinctId: ctx.integrationId,
        event: 'integration_unregistered',
        properties: {
          botId: ctx.botId,
        },
      },
      posthogConfig
    )
    .catch(() => {})
}
