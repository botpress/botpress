import { RuntimeError } from '@botpress/sdk'
import { InstagramClient } from 'src/misc/client'
import * as bp from '.botpress'

type RegisterProps = Parameters<bp.IntegrationProps['register']>[0]

export const register: bp.IntegrationProps['register'] = async (props: RegisterProps) => {
  const { ctx } = props
  if (ctx.configurationType === 'manual') {
    await _registerManual(props)
  } else if (ctx.configurationType === 'sandbox') {
    await _registerSandbox(props)
  } else {
    await _registerOAuth(props)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

const _registerOAuth = async (props: RegisterProps) => {
  const { client, ctx, logger } = props

  // Remove existing sandbox identifiers
  await client.configureIntegration({
    sandboxIdentifiers: null,
  })

  // Refresh token if needed
  const { state } = await client
    .getState({
      type: 'integration',
      name: 'oauth',
      id: ctx.integrationId,
    })
    .catch(() => ({ state: undefined }))

  if (!state?.payload.accessToken) {
    // No access token has been set, disable refreshes
    await _stopRefresh(props)
    return
  }

  if (Date.now() > state.payload.expirationTime) {
    const message = 'Access token has expired, please reauthorize'
    logger.forBot().error(message)
    throw new RuntimeError(message)
  }

  logger.debug('Refreshing access token for bot', ctx.botId)
  const credentials = state.payload
  const instagramClient = new InstagramClient(logger, credentials)
  const { accessToken, expirationTime } = await instagramClient.refreshAccessToken().catch((err) => {
    throw new RuntimeError('Error while refreshing access token from Instagram', err)
  })
  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      ...credentials,
      accessToken,
      expirationTime,
    },
  })
}

const _registerManual = async (props: RegisterProps) => {
  await _clearAllIdentifiers(props)
}

const _registerSandbox = async (props: RegisterProps) => {
  await _clearAllIdentifiers(props)
}

const _clearAllIdentifiers = async (props: RegisterProps) => {
  const { client } = props

  // Clear all OAuth and sandbox identifiers
  await client.configureIntegration({
    sandboxIdentifiers: null,
    identifier: null,
  })
}

const _stopRefresh = async ({ client, ctx, logger }: RegisterProps) => {
  logger.debug('Stopping token refresh for bot', ctx.botId)
  await client.configureIntegration({ scheduleRegisterCall: undefined })
}
