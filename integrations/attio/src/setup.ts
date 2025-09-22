import * as sdk from '@botpress/sdk'
import { AttioApiClient } from './attio-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx }) => {
  try {
    const accessToken = ctx.configuration.accessToken
    const client = new AttioApiClient(accessToken)

    // Test the connection using the API client
    await client.testConnection()
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError(error.message)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}
