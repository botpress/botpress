import { RuntimeError } from '@botpress/client'
import { getNetworkErrorDetails } from 'src/util'
import { createClient } from '../api/sunshine-api'
import { createWebhook, deleteApp } from '../api/webhooks'
import { getStoredCredentials } from '../get-stored-credentials'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger, client, webhookUrl }) => {
  logger.forBot().info('Starting Sunshine Conversations integration registration...')

  const credentials = await getStoredCredentials(client, ctx)

  if (credentials.configType === 'manual') {
    logger.forBot().info('Verifying credentials...')
    try {
      const suncoClient = createClient(credentials)
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
    return
  }

  await deleteApp({ credentials, logger }).catch((thrown) =>
    logger.warn(thrown instanceof Error ? thrown.message : new Error(thrown).message)
  )

  logger.forBot().info('Registering webhook...')
  const webhook = await createWebhook({
    credentials,
    logger,
    webhookUrl,
  })

  await client.setState({
    name: 'webhook',
    type: 'integration',
    id: ctx.integrationId,
    payload: webhook,
  })
  logger.forBot().info('Successfully registered webhook')
}
