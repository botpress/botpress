import { RuntimeError } from '@botpress/client'
import * as bp from '../../.botpress'
import { getSuncoClient } from '../client'
import { getBotpressIntegrationDisplayName, fetchAndCacheSwitchboardIntegrationsIdOrThrow } from './utils'

export const register: bp.IntegrationProps['register'] = async ({ ctx, webhookUrl, logger, client }) => {
  try {
    logger.forBot().info('Starting Zendesk Messaging HITL integration registration...')
    logger.forBot().info(`App ID: ${ctx.configuration.appId}`)
    logger.forBot().info(`Bot ID: ${ctx.botId}`)
    logger.forBot().info(`Integration ID: ${ctx.integrationId}`)
    logger.forBot().info(`Webhook URL: ${webhookUrl}`)

    const suncoClient = getSuncoClient(ctx.configuration, logger)

    logger.forBot().info('Sunco client initialized successfully')
    logger.forBot().info('Setting up webhook and integration in Sunshine Conversations...')

    const integrationDisplayName = getBotpressIntegrationDisplayName(ctx.webhookId)
    logger.forBot().info(`Integration Display name: ${integrationDisplayName}`)

    // Check if integration already exists by name
    logger.forBot().info('Checking for existing integration by name...')
    let integrationId: string
    try {
      integrationId = (await suncoClient.findIntegrationByDisplayNameOrThrow(integrationDisplayName)).id
    } catch {
      logger.forBot().info('No existing integration found. Creating new integration with webhook...')
      logger.forBot().info(`Webhook target URL: ${webhookUrl}`)
      integrationId = (await suncoClient.createIntegration(integrationDisplayName, webhookUrl)).integrationId
      logger.forBot().info(`✅ Integration created successfully with ID: ${integrationId}`)
    }

    // Get the switchboard ID (uses the first switchboard if multiple exist)
    logger.forBot().info('Getting switchboard ID...')
    const switchboardId = await suncoClient.getSwitchboardIdOrThrow()
    logger.forBot().info(`✅ Using switchboard with ID: ${switchboardId}`)

    // Check if switchboard integration already exists by name
    logger.forBot().info('Checking for existing switchboard integration by name...')
    let switchboardIntegrationId: string
    try {
      switchboardIntegrationId = (
        await suncoClient.findSwitchboardIntegrationByNameOrThrow(switchboardId, integrationDisplayName)
      ).id
    } catch {
      logger.forBot().info('No switchboard integration found. Creating new switchboard integration...')
      logger.forBot().info(`Switchboard ID: ${switchboardId}`)
      logger.forBot().info(`Integration ID: ${integrationId}`)
      switchboardIntegrationId = await suncoClient.createSwitchboardIntegration(
        switchboardId,
        integrationId,
        integrationDisplayName,
        false
      )
      logger.forBot().info(`✅ Switchboard integration created successfully with ID: ${switchboardIntegrationId}`)
    }

    // Force fetch and cache switchboard integration IDs
    logger.forBot().info('Fetching and caching switchboard integration IDs...')
    await fetchAndCacheSwitchboardIntegrationsIdOrThrow(ctx, client, logger)

    logger.forBot().info('✅ Zendesk Messaging HITL integration registered successfully')
    logger
      .forBot()
      .info(
        `Final configuration - Integration ID: ${integrationId}, Switchboard ID: ${switchboardId}, Switchboard Integration ID: ${switchboardIntegrationId}`
      )
  } catch (error: any) {
    logger.forBot().error('❌ Failed to register integration: ' + error.message, error)
    logger.forBot().error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error?.response?.data,
    })
    throw new RuntimeError('Failed to register integration: ' + error.message)
  }
}
