import { RuntimeError } from '@botpress/client'
import { getNetworkErrorDetails } from 'src/util'
import { getSuncoClient } from '../client'
import { getStoredCredentials } from '../get-stored-credentials'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger, client, webhookUrl }) => {
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

  logger.forBot().info('Checking for existing webhook...')
  const webhooks = await suncoClient.listWebhooks()
  const existing = webhooks.find((wh) => wh.target === webhookUrl)

  let webhook
  if (existing) {
    logger.forBot().info(`Updating existing webhook with ID: ${existing.id}`)
    webhook = await suncoClient.updateWebhook(existing.id, webhookUrl)
  } else {
    logger.forBot().info(`No existing webhook found. Creating new webhook for ${webhookUrl}`)
    webhook = await suncoClient.createWebhook(webhookUrl)
  }

  if (!webhook?.id || !webhook?.secret) {
    throw new RuntimeError('Webhook creation succeeded but missing id or secret')
  }

  await client.setState({
    name: 'webhook',
    type: 'integration',
    id: ctx.integrationId,
    payload: { id: webhook.id, secret: webhook.secret },
  })
  logger.forBot().info('Successfully registered webhook')
}
