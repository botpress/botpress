import { posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { posthogConfig } from 'src'
import { GoogleClient } from './google-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  const startTime = Date.now()

  let googleClient: GoogleClient | void

  logger.forBot().info('Using refresh token from configuration')
  googleClient = await GoogleClient.create({ client, ctx }).catch((error) => _logForBotAndThrow(logger, error))

  if (!googleClient && ctx.configurationType === 'customApp') {
    googleClient = await GoogleClient.createFromAuthorizationCode({
      client,
      ctx,
      authorizationCode: ctx.configuration.oauthAuthorizationCode,
    }).catch((error) => _logForBotAndThrow(logger, error))
  }

  logger.forBot().info('Setting up Gmail watch for incoming emails...')

  if (!googleClient) {
    throw new sdk.RuntimeError('Failed to create Google client')
  }

  await googleClient.watchIncomingMail().catch(() => logger.forBot().warn('Failed to set up Gmail watch'))

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

const _logForBotAndThrow = (logger: bp.Logger, error: unknown) => {
  logger.forBot().error(`${error}`)
  throw new sdk.RuntimeError(`${error}`)
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
