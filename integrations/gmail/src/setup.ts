import { isApiError } from '@botpress/sdk'
import { AuthorizationCodeSpentError, GoogleClient } from './google-api'
import { ensureDailyRegister } from './schedule'
import * as bp from '.botpress'

type SetupProps = Pick<Parameters<bp.IntegrationProps['register']>[0], 'client' | 'ctx' | 'logger'>

export const register: bp.IntegrationProps['register'] = async (props) => {
  const { logger } = props
  const googleClient = await _initializeGoogleClient(props)
  await ensureDailyRegister(props)

  logger.forBot().info('Setting up Gmail watch for incoming emails...')
  try {
    await googleClient.watchIncomingMail()
  } catch (error) {
    logger.forBot().warn(`Failed to set up Gmail watch: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const _initializeGoogleClient = (props: SetupProps): Promise<GoogleClient> => {
  const { ctx } = props
  if (ctx.configurationType === 'customApp') {
    return _initializeManualClient({ ...props, ctx })
  }

  return _initializeOAuthClient(props)
}

const _initializeOAuthClient = (props: SetupProps): Promise<GoogleClient> => {
  props.logger.forBot().info('Using saved OAuth refresh token')
  return _createFromRefreshToken(props)
}

const _initializeManualClient = async ({
  client,
  ctx,
  logger,
}: SetupProps & { ctx: Extract<bp.Context, { configurationType: 'customApp' }> }): Promise<GoogleClient> => {
  if (!ctx.configuration.oauthAuthorizationCode) {
    logger.forBot().info('No authorization code provided, using existing refresh token from state')
    return _createFromRefreshToken({ client, ctx, logger })
  }

  if (await _isAuthorizationCodeAlreadyUsed({ client, ctx, code: ctx.configuration.oauthAuthorizationCode })) {
    return _createFromRefreshToken({ client, ctx, logger })
  }

  logger.forBot().info('Using authorization code from context')
  try {
    const googleClient = await GoogleClient.createFromAuthorizationCode({
      client,
      ctx,
      authorizationCode: ctx.configuration.oauthAuthorizationCode,
    })
    logger.forBot().info('Successfully created Google client from authorization code')
    return googleClient
  } catch (err) {
    logger.forBot().warn({ err }, 'Failed to create Google client from authorization code; falling back')
    const googleClient = await _createFromRefreshToken({ client, ctx, logger })
    if (err instanceof AuthorizationCodeSpentError) {
      await _markAuthorizationCodeUsed({ client, ctx, code: ctx.configuration.oauthAuthorizationCode, logger })
    }
    return googleClient
  }
}

const _createFromRefreshToken = async ({ client, ctx, logger }: SetupProps): Promise<GoogleClient> => {
  try {
    return await GoogleClient.create({ client, ctx })
  } catch (err) {
    logger.forBot().error({ err }, 'Failed to create Google client from refresh token')
    throw err
  }
}

const _markAuthorizationCodeUsed = async ({ client, ctx, code, logger }: SetupProps & { code: string }) => {
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
// Only used in manual configuration, to avoid reusing the same authorization code when
const _isAuthorizationCodeAlreadyUsed = async ({
  client,
  ctx,
  code,
}: Pick<SetupProps, 'client' | 'ctx'> & { code: string }): Promise<boolean> => {
  try {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
    return state.payload.authorizationCode === code
  } catch {
    // No state or unreadable state: try the exchange, which falls back to the refresh token on failure
    return false
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx }) => {
  // Restoring a removed integration preserves state but clears its scheduled task reference.
  try {
    await client.setState({ type: 'integration', name: 'registerSchedule', id: ctx.integrationId, payload: null })
  } catch (error) {
    if (!isApiError(error) || error.type !== 'ResourceNotFound') {
      throw error
    }
  }
}
