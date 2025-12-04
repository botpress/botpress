import { RuntimeError } from '@botpress/client'
import * as bp from '../../.botpress'
import { getSuncoClient } from '../client'
import { getBotpressIntegrationDisplayName, fetchAndCacheSwitchboardIntegrationsIdOrThrow } from './util'

export const register: bp.IntegrationProps['register'] = async ({ ctx, webhookUrl, logger, client }) => {
  try {
    logger.forBot().info('Starting Zendesk Messaging HITL integration registration...')

    const suncoClient = getSuncoClient(ctx.configuration)

    logger.forBot().info('Verifying credentials...')
    try {
      const app = await suncoClient.getApp()
      logger.forBot().info('✅ Credentials verified successfully. App details:', JSON.stringify(app, null, 2))
    } catch (thrown: unknown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      throw new RuntimeError(`Invalid credentials: ${errMsg}`)
    }

    const integrationDisplayName = getBotpressIntegrationDisplayName(ctx.webhookId)
    logger.forBot().info(`Integration Display name: ${integrationDisplayName}`)

    // Check if integration already exists by name
    logger.forBot().info('Checking for existing integration by name...')
    let integrationId: string
    try {
      integrationId = (await suncoClient.findIntegrationByDisplayNameOrThrow(integrationDisplayName)).id
    } catch {
      logger.forBot().info(`No existing integration found. Creating new integration with webhook ${webhookUrl}`)
      integrationId = (await suncoClient.createIntegration(integrationDisplayName, webhookUrl)).id
      logger.forBot().info(`✅ Integration created successfully with ID: ${integrationId}`)
    }

    // Get the switchboard ID (uses the first switchboard if multiple exist)
    const switchboardId = await suncoClient.getSwitchboardIdOrThrow()

    // Check if switchboard integration already exists by name
    logger.forBot().info('Checking for existing switchboard integration...')
    let switchboardIntegrationId: string
    try {
      switchboardIntegrationId = (
        await suncoClient.findSwitchboardIntegrationByNameOrThrow(switchboardId, integrationDisplayName)
      ).id
    } catch {
      logger.forBot().info('No switchboard integration found. Creating new switchboard integration...')
      switchboardIntegrationId = await suncoClient.createSwitchboardIntegration(
        switchboardId,
        integrationId,
        integrationDisplayName,
        false
      )
      logger.forBot().info(`✅ Switchboard integration created successfully with ID: ${switchboardIntegrationId}`)
    }

    // Force on register to allow bot devs to update cache on demand, in theory these will not change
    logger.forBot().info('Fetching and caching switchboard integrations IDs...')
    await fetchAndCacheSwitchboardIntegrationsIdOrThrow(ctx, client, logger)

    logger.forBot().info('✅ Zendesk Messaging HITL integration registered successfully')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(`Failed to register Zendesk Messaging HITL integration: ${errMsg}`)
  }
}
