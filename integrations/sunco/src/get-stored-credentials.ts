import * as sdk from '@botpress/sdk'
import { StoredCredentials } from './types'
import * as bp from '.botpress'

export const getStoredCredentials = async (
  client: bp.Client,
  ctx: bp.HandlerProps['ctx']
): Promise<StoredCredentials> => {
  const { configurationType: configType } = ctx
  if (configType === 'manual') {
    const { appId, keyId, keySecret } = ctx.configuration
    return { configType, appId, keyId, keySecret }
  }

  const {
    state: { payload: credentials },
  } = await client.getOrSetState({
    name: 'credentials',
    type: 'integration',
    id: ctx.integrationId,
    payload: {},
  })

  const { token, appId, subdomain } = credentials

  if (!token || !appId) {
    throw new sdk.RuntimeError('failed to get stored access token or app ID')
  }

  return { configType, token, appId, subdomain }
}
