import { RuntimeError } from '@botpress/client'
import { getTokenInfo } from 'src/api/get-credentials'
import { getStoredCredentials } from 'src/get-stored-credentials'
import { getNetworkErrorDetails } from 'src/util'
import { createClient } from './api/sunshine-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger, client }) => {
  logger.forBot().info('Starting Sunshine Conversations integration registration...')

  const { token } = await getStoredCredentials(client, ctx.integrationId)

  logger.forBot().info('Verifying credentials...')
  try {
    const tokenInfo = await getTokenInfo({ logger, token })
    logger.forBot().info('✅ Credentials verified successfully.')
  } catch (thrown: unknown) {
    const details = getNetworkErrorDetails(thrown)
    if (details) {
      throw new RuntimeError(`Invalid credentials: ${details?.message}`)
    }
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(errMsg)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({}) => {}
