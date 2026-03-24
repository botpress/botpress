import { RuntimeError } from '@botpress/client'
import { getNetworkErrorDetails } from 'src/util'
import { getSuncoClient } from '../client'
import { getStoredCredentials } from '../get-stored-credentials'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger, client }) => {
  logger.forBot().info('Starting Sunshine Conversations integration registration...')

  const credentials = await getStoredCredentials(client, ctx)
  const suncoClient = getSuncoClient(credentials)

  if (credentials.configType === 'manual') {
    logger.forBot().info('Verifying credentials...')
    try {
      const app = await suncoClient.getApp()
      logger.forBot().info('✅ Credentials verified successfully. App details:', JSON.stringify(app, null, 2))
    } catch (thrown: unknown) {
      const details = getNetworkErrorDetails(thrown)
      if (details) {
        throw new RuntimeError(`Invalid credentials: ${details?.message}`)
      }
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      throw new RuntimeError(errMsg)
    }
    return
  }
}
