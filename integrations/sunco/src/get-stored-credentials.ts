import * as sdk from '@botpress/sdk'
import { StoredCredentials } from './types'
import * as bp from '.botpress'

export const getStoredCredentials = async (client: bp.Client, integrationId: string): Promise<StoredCredentials> => {
  const {
    state: { payload: credentials },
  } = await client.getOrSetState({
    name: 'credentials',
    type: 'integration',
    id: integrationId,
    payload: {},
  })

  const { token, appId, subdomain } = credentials

  if (!token || !appId) {
    throw new sdk.RuntimeError('failed to get stored access token or app ID')
  }

  return { token, appId, subdomain }
}
