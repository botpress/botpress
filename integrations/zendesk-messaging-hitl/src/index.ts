import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { actions } from './actions'
import { channels } from './channels'
import { getSuncoClient } from './client'
import { handler } from './handler'
import * as bp from '.botpress'

export default sentryHelpers.wrapIntegration(
  new bp.Integration({
    register: async ({ client, ctx, webhookUrl, logger }) => {
      try {
        logger.forBot().info('Starting Zendesk Messaging HITL integration registration...')
        logger.forBot().info(`App ID: ${ctx.configuration.appId}`)
        logger.forBot().info(`Bot ID: ${ctx.botId}`)
        logger.forBot().info(`Integration ID: ${ctx.integrationId}`)
        logger.forBot().info(`Webhook URL: ${webhookUrl}`)

        const suncoClient = getSuncoClient(
          {
            appId: ctx.configuration.appId,
            keyId: ctx.configuration.keyId,
            keySecret: ctx.configuration.keySecret,
          },
          logger
        )

        logger.forBot().info('Sunco client initialized successfully')
        logger.forBot().info('Setting up webhook and integration in Sunshine Conversations...')

        // Check if webhook and integration already exist
        logger.forBot().info('Checking for existing webhook and integration in state...')
        const { state } = await client.getOrSetState({
          name: 'suncoIntegrationInfo',
          type: 'integration',
          id: ctx.integrationId,
          payload: {
            webhookId: '',
            integrationId: '',
          } as any,
        })

        let webhookId = state.payload.webhookId
        let integrationId = state.payload.integrationId

        logger
          .forBot()
          .info(`Current state - Webhook ID: ${webhookId || 'none'}, Integration ID: ${integrationId || 'none'}`)

        // Create integration with webhooks if it doesn't exist
        if (!integrationId) {
          logger
            .forBot()
            .info('No existing integration found. Creating new integration with webhook in Sunshine Conversations...')
          const integrationName = `${ctx.botId}-hitl`
          logger.forBot().info(`Integration name: ${integrationName}`)
          logger.forBot().info(`Webhook target URL: ${webhookUrl}`)
          const result = await suncoClient.createIntegration(integrationName, webhookUrl)
          integrationId = result.integrationId
          webhookId = result.webhookId || webhookId
          logger
            .forBot()
            .info(`✅ Integration created successfully with ID: ${integrationId} and name: ${integrationName}`)
          if (webhookId) {
            logger.forBot().info(`✅ Webhook created successfully with ID: ${webhookId}`)
          }
        } /* else {
          logger.forBot().info(`✓ Using existing integration ID: ${integrationId}`)
          // If integration exists but webhook doesn't, create webhook separately
          if (!webhookId) {
            logger.forBot().info('No existing webhook found. Creating new webhook under existing integration...')
            logger.forBot().info(`Webhook target URL: ${webhookUrl}`)
            logger.forBot().info(`Creating webhook under integration ID: ${integrationId}`)
            webhookId = await suncoClient.createWebhook(integrationId, webhookUrl)
            logger.forBot().info(`✅ Webhook created successfully with ID: ${webhookId}`)
          } else {
            logger.forBot().info(`✓ Using existing webhook ID: ${webhookId}`)
          }
        }*/

        // Save webhook and integration IDs to state
        logger.forBot().info('Saving webhook and integration IDs to state...')
        await client.setState({
          type: 'integration',
          name: 'suncoIntegrationInfo',
          id: ctx.integrationId,
          payload: {
            webhookId,
            integrationId,
          } as any,
        })
        logger.forBot().info('State saved successfully')

        logger.forBot().info('✅ Zendesk Messaging HITL integration registered successfully')
        logger.forBot().info(`Final configuration - Webhook ID: ${webhookId}, Integration ID: ${integrationId}`)
      } catch (error: any) {
        logger.forBot().error('❌ Failed to register integration: ' + error.message, error)
        logger.forBot().error('Error details:', {
          message: error.message,
          stack: error.stack,
          response: error?.response?.data,
        })
        throw new RuntimeError('Failed to register integration: ' + error.message)
      }
    },
    unregister: async ({ client, ctx, logger }) => {
      try {
        const suncoClient = getSuncoClient(
          {
            appId: ctx.configuration.appId,
            keyId: ctx.configuration.keyId,
            keySecret: ctx.configuration.keySecret,
          },
          logger
        )

        // Get webhook and integration IDs from state
        try {
          const { state } = await client.getState({
            type: 'integration',
            name: 'suncoIntegrationInfo',
            id: ctx.integrationId,
          })

          const webhookId = state.payload.webhookId || ''
          const integrationId = state.payload.integrationId || ''

          // Delete webhook first (must delete webhook before integration)
          if (webhookId && integrationId) {
            logger.forBot().info(`Deleting webhook with ID: ${webhookId} under integration: ${integrationId}`)
            try {
              await suncoClient.deleteWebhook(integrationId, webhookId)
            } catch (error: any) {
              logger.forBot().warn(`Failed to delete webhook: ${error.message}`)
            }
          }

          // Delete integration
          if (integrationId) {
            logger.forBot().info(`Deleting integration with ID: ${integrationId}`)
            try {
              await suncoClient.deleteIntegration(integrationId)
            } catch (error: any) {
              logger.forBot().warn(`Failed to delete integration: ${error.message}`)
            }
          }
        } catch {
          // State might not exist, which is fine
          logger.forBot().info('No webhook/integration state found, skipping cleanup')
        }

        logger.forBot().info('Zendesk Messaging HITL integration unregistered')
      } catch (error: any) {
        logger.forBot().error('Failed to unregister integration: ' + error.message, error)
        // Don't throw, just log the error
      }
    },
    actions,
    channels,
    handler,
  }),
  {}
)
