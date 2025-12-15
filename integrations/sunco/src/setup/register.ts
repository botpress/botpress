import { RuntimeError } from '@botpress/client'
import { getNetworkErrorDetails } from 'src/util'
import * as bp from '../../.botpress'
import { createClient } from '../sunshine-api'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  logger.forBot().info('Starting Sunshine Conversations integration registration...')

  const suncoClient = createClient(ctx.configuration.keyId, ctx.configuration.keySecret)

  logger.forBot().info('Verifying credentials...')
  try {
    const app = await suncoClient.apps.getApp(ctx.configuration.appId)
    logger.forBot().info('✅ Credentials verified successfully. App details:', JSON.stringify(app, null, 2))
  } catch (thrown: unknown) {
    const details = getNetworkErrorDetails(thrown)
    if (details) {
      throw new RuntimeError(`Invalid credentials: ${details?.message}`)
    }
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(errMsg)
  }
}
