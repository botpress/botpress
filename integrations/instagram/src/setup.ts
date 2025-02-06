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

  if (!state || ctx.configurationType === 'manual') {
    // No access token to refresh: never set or manual config. Disable refreshes.
    client.configureIntegration({ scheduleRegisterCall: undefined })
    return
  }

  if (Date.now() > state.payload.expirationTime) {
    const message = 'Access token has expired, please reauthorize'
    logger.forBot().error(message)
    throw new RuntimeError(message)
  }

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
