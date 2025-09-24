import * as sdk from '@botpress/sdk'
import { AttioApiClient } from '../attio-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl, logger }) => {
  try {
    const accessToken = ctx.configuration.accessToken
    const attioClient = new AttioApiClient(accessToken)

    // Test the connection using the API client
    logger.forBot().info('Testing connection to Attio...')
    await attioClient.testConnection()
    logger.forBot().info('Connection to Attio successful')

    // Check if webhooks already exist
    logger.forBot().info('Checking if webhooks already exist...')
    const { state } = await client.getOrSetState({
      name: 'attioIntegrationInfo',
      type: 'integration',
      id: ctx.integrationId,
      payload: {
        attioWebhookId: '',
      },
    })

    if (!state.payload.attioWebhookId) {
      logger.forBot().info('Webhooks do not exist. Creating webhooks...')
      const webhookResp = await attioClient.createWebhook({
        data: {
          target_url: webhookUrl,
          subscriptions: [
            { event_type: 'record.created', filter: null },
            { event_type: 'record.updated', filter: null },
            { event_type: 'record.deleted', filter: null },
          ],
        },
      })
      const attioWebhookId = String(webhookResp.data.id.webhook_id)
      await client.setState({
        type: 'integration',
        name: 'attioIntegrationInfo',
        id: ctx.integrationId,
        payload: { attioWebhookId },
      })
    }

    logger.forBot().info('Webhooks created')
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError(error.message)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx, client, logger }) => {
  try {
    const accessToken = ctx.configuration.accessToken
    const attioClient = new AttioApiClient(accessToken)

    const stateAttioIntegrationInfo = await client.getState({
      id: ctx.integrationId,
      name: 'attioIntegrationInfo',
      type: 'integration',
    })

    const { state } = stateAttioIntegrationInfo
    const { attioWebhookId } = state.payload

    if (attioWebhookId) {
      await attioClient.deleteWebhook(attioWebhookId)
      logger.forBot().info('Webhook successfully deleted')
    }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError(error.message)
  }
}
