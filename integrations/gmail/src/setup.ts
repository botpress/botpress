import { posthogHelper } from '@botpress/common'
import { posthogConfig } from 'src'
import { GoogleClient } from './google-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  const startTime = Date.now()

  let googleClient: GoogleClient

  if (ctx.configurationType === 'customApp') {
    try {
      logger.forBot().info('Using existing refresh token from state')
      googleClient = await GoogleClient.create({ client, ctx })
    } catch (error) {
      logger.forBot().warn(`${error}`)
      try {
        googleClient = await GoogleClient.createFromAuthorizationCode({
          client,
          ctx,
          authorizationCode: ctx.configuration.oauthAuthorizationCode,
        })
      } catch (fallbackError) {
        logger.forBot().error(`Failed to create Google client from authorization code: ${fallbackError}`)
        throw fallbackError
      }
    }
  } else {
    logger.forBot().info('Using refresh token from configuration')
    try {
      googleClient = await GoogleClient.create({ client, ctx })
    } catch (error) {
      logger.forBot().error(`Failed to create Google client: ${error}`)
      throw error
    }
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
