import * as sdk from '@botpress/sdk'
import { AttioApiClient } from './attio-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx }) => {
  try {
    const accessToken = ctx.configuration.accessToken
    const client = new AttioApiClient(accessToken)

    // Test the connection using the API client
    const isConnected = await client.testConnection()
    if (!isConnected) {
      throw new sdk.RuntimeError('Failed to connect to Attio API')
    }
  } catch (error: unknown) {
    if (error instanceof sdk.RuntimeError) {
      throw error
    }
    throw new sdk.RuntimeError('Response - ' + error)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}
