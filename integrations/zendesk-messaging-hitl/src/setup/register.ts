import { RuntimeError } from '@botpress/client'
import * as bp from '../../.botpress'
import { getTokenInfo } from '../api/get-credentials'
import { getSuncoClient } from '../client'
import { getStoredCredentials } from '../get-stored-credentials'
import { getBotpressIntegrationDisplayName } from './util'

export const register: bp.IntegrationProps['register'] = async ({ ctx, webhookUrl, logger, client }) => {
  try {
    logger.forBot().info('Starting Zendesk Messaging HITL integration registration...')

    const credentials = await getStoredCredentials(client, ctx)
    const suncoClient = getSuncoClient(credentials)

    logger.forBot().info('Verifying credentials...')
    try {
      if (credentials.configType !== 'manual') {
        await getTokenInfo({ token: credentials.token, logger })
        logger.forBot().info('✅ OAuth credentials verified successfully.')
      } else {
        const app = await suncoClient.getApp()
        logger.forBot().info('✅ Credentials verified successfully. App details:', JSON.stringify(app, null, 2))
      }
    } catch (thrown: unknown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      throw new RuntimeError(`Invalid credentials: ${errMsg}`)
    }

    let integrationId: string
    if (credentials.configType !== 'manual') {
      integrationId = 'me'
    } else {
      const integrationDisplayName = getBotpressIntegrationDisplayName(ctx.webhookId)
      logger.forBot().info(`Integration Display name: ${integrationDisplayName}`)
      logger.forBot().info('Checking for existing integration by name...')
      try {
        integrationId = (await suncoClient.findIntegrationByDisplayNameOrThrow(integrationDisplayName)).id
        logger.forBot().info(`✅ Found existing integration with ID: ${integrationId}`)
      } catch {
        logger.forBot().info('No existing integration found. Creating new integration...')
        integrationId = (await suncoClient.createIntegration(integrationDisplayName, webhookUrl)).id
        logger.forBot().info(`✅ Integration created successfully with ID: ${integrationId}`)
      }
    }

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

    // Manual only — switchboard setup
    if (credentials.configType === 'manual') {
      const integrationDisplayName = getBotpressIntegrationDisplayName(ctx.webhookId)

      const { id: switchboardId } = await suncoClient.getSwitchboardOrThrow()

      logger.forBot().info('Checking for existing switchboard integration...')
      try {
        const existing = await suncoClient.findSwitchboardIntegrationByNameOrThrow(
          switchboardId,
          integrationDisplayName
        )
        logger.forBot().info(`✅ Found existing switchboard integration with ID: ${existing.id}`)
      } catch {
        logger.forBot().info('No switchboard integration found. Creating new switchboard integration...')
        const created = await suncoClient.createSwitchboardIntegration(
          switchboardId,
          integrationId,
          integrationDisplayName,
          false
        )
        logger.forBot().info(`✅ Switchboard integration created successfully with ID: ${created.id}`)
      }
    }

    logger.forBot().info('✅ Zendesk Messaging HITL integration registered successfully')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(`Failed to register Zendesk Messaging HITL integration: ${errMsg}`)
  }
}
