import { RuntimeError } from '@botpress/sdk'
import { InstagramClient } from 'src/misc/client'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async (props) => {
  await refreshAccessToken(props)
}
export const unregister: bp.IntegrationProps['unregister'] = async () => {}

const refreshAccessToken = async ({ client, ctx, logger }: Parameters<bp.IntegrationProps['register']>[0]) => {
  const { state } = await client
    .getState({
      type: 'integration',
      name: 'oauth',
      id: ctx.integrationId,
    })
    .catch(() => ({ state: undefined }))

  const isManualConfig = ctx.configurationType === 'manual'
  const instagramId = isManualConfig ? ctx.configuration.instagramId : (state?.payload.instagramId ?? 'unknown user')
  if (!state || isManualConfig) {
    // No access token to refresh: never set or manual config. Disable refreshes.
    await client.configureIntegration({ scheduleRegisterCall: undefined })
    logger.debug('Token refresh stopped for Instagram user', instagramId)
    return
  }

  if (Date.now() > state.payload.expirationTime) {
    const message = 'Access token has expired, please reauthorize'
    logger.forBot().error(message)
    throw new RuntimeError(message)
  }

  logger.debug('Refreshing access token for Instagram user', instagramId)
  const credentials = state.payload
  const instagramClient = new InstagramClient(logger, credentials)
  const accessTokenInfos = await instagramClient.refreshAccessToken().catch((err) => {
    throw new RuntimeError('Error while refreshing access token from Instagram', err)
  })
  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      ...credentials,
      accessToken: accessTokenInfos.accessToken,
      expirationTime: accessTokenInfos.expirationTime,
    },
  })
}
