import * as sdk from '@botpress/sdk'
import { AttioApiClient } from '../attio-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl, logger }) => {
  try {
    const accessToken = ctx.configuration.accessToken
    const _attioClient = new AttioApiClient(accessToken)

    logger.forBot().info('Testing connection to Attio...')
    // Test the connection using the API client
    await _attioClient.testConnection()
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
      const webhookResp = await _attioClient.createWebhook({
        target_url: webhookUrl,
        subscriptions: [
          { event_type: 'record.created', filter: null },
          { event_type: 'record.updated', filter: null },
          { event_type: 'record.deleted', filter: null },
        ],
      })
      logger.forBot().info('Webhooks created')
      const attioWebhookId = String(webhookResp.data.id.webhook_id)
      await client.setState({
        type: 'integration',
        name: 'attioIntegrationInfo',
        id: ctx.integrationId,
        payload: { attioWebhookId },
      })
    }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError(error.message)
  }
}
