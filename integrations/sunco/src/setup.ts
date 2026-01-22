import { RuntimeError } from '@botpress/client'
import { getNetworkErrorDetails } from 'src/util'
import { createClient } from './api/sunshine-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger, client }) => {
  logger.forBot().info('Starting Sunshine Conversations integration registration...')

  const {
    state: { payload: credentials },
  } = await client.getOrSetState({
    name: 'credentials',
    type: 'integration',
    id: ctx.integrationId,
    payload: {},
  })

  if (!credentials.token || !credentials.appId) {
    throw new RuntimeError('failed to get stored access token or app ID')
  }

  const suncoClient = createClient(credentials.token)

  logger.forBot().info('Verifying credentials...')
  try {
    const app = await suncoClient.apps.getApp(credentials.appId)
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

export const unregister: bp.IntegrationProps['unregister'] = async ({}) => {}
