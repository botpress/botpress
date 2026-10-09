import { AuthorizationCodeSpentError, GoogleClient } from './google-api'
import { ensureDailyRegister, startWatch } from './watch'
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
    } else if (await _isAuthorizationCodeAlreadyUsed({ client, ctx, code: ctx.configuration.oauthAuthorizationCode })) {
      // Authorization codes are single-use, and register() now runs daily: reuse the refresh token
      logger.forBot().info('Authorization code was already exchanged, using existing refresh token from state')
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
        // Google rejected this code itself, so retrying it on later daily runs can never succeed.
        // Any other failure (network, Google outage) may be temporary: keep trying the code.
        if (err instanceof AuthorizationCodeSpentError) {
          await _markAuthorizationCodeUsed({ client, ctx, code: ctx.configuration.oauthAuthorizationCode, logger })
        }
      }
    }
  }

  logger.forBot().info('Setting up Gmail watch for incoming emails...')
  try {
    await startWatch({ client, ctx, googleClient })
  } catch (thrown: unknown) {
    // Not fatal: the next daily register() call, or an incoming-mail webhook, retries it
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().warn(error.message)
  }

  // Throws if scheduling fails, so register() fails and can be retried instead of silently
  // leaving the watch to expire
  await ensureDailyRegister({ client, ctx, logger })
}

const _markAuthorizationCodeUsed = async ({
  client,
  ctx,
  code,
  logger,
}: {
  client: bp.Client
  ctx: bp.Context
  code: string
  logger: bp.Logger
}) => {
  try {
    // patchState keeps the refresh token and lastHistoryId, as in GoogleClient._saveRefreshTokenIntoStates
    await client.patchState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { authorizationCode: code },
    })
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().warn(`Failed to record the used authorization code: ${error.message}`)
  }
}

const _isAuthorizationCodeAlreadyUsed = async ({
  client,
  ctx,
  code,
}: {
  client: bp.Client
  ctx: bp.Context
  code: string
}): Promise<boolean> => {
  try {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
    return state.payload.authorizationCode === code
  } catch (_thrown: unknown) {
    // No state or unreadable state: try the exchange, which falls back to the refresh token on failure
    return false
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}
