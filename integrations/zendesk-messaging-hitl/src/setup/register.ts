import { RuntimeError } from '@botpress/client'
import * as bp from '../../.botpress'
import { getTokenInfo } from '../api/get-credentials'
import { getSuncoClient } from '../client'
import { getStoredCredentials } from '../get-stored-credentials'

export const register: bp.IntegrationProps['register'] = async ({ ctx, webhookUrl, logger, client }) => {
  try {
    logger.forBot().info('Starting Zendesk Messaging HITL integration registration...')

    const credentials = await getStoredCredentials(client, ctx)
    const suncoClient = getSuncoClient(credentials)

    logger.forBot().info('Verifying credentials...')
    try {
      await getTokenInfo({ token: credentials.token, logger })
      logger.forBot().info('✅ OAuth credentials verified successfully.')
    } catch (thrown: unknown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      throw new RuntimeError(`Invalid credentials: ${errMsg}`)
    }

    const integrationId = 'me'

    logger.forBot().info('Checking for existing webhook...')
    const existingWebhooks = await suncoClient.listWebhooks(integrationId)
    const existingWebhook = existingWebhooks.find((wh) => wh.target === webhookUrl)

    if (existingWebhook?.id) {
      logger.forBot().info(`Updating existing webhook with ID: ${existingWebhook.id}`)
      await suncoClient.updateWebhook(integrationId, existingWebhook.id, webhookUrl)
      logger.forBot().info('✅ Webhook updated successfully.')
    } else {
      logger.forBot().info(`No existing webhook found. Creating new webhook for ${webhookUrl}`)
      await suncoClient.createWebhook(integrationId, webhookUrl)
      logger.forBot().info('✅ Webhook created successfully.')
    }

    logger.forBot().info('✅ Zendesk Messaging HITL integration registered successfully')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(`Failed to register Zendesk Messaging HITL integration: ${errMsg}`)
  }
}
