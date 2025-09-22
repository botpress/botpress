import * as sdk from '@botpress/sdk'
import { AttioApiClient } from '../attio-api'
import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx, client, logger }) => {
  try {
    const accessToken = ctx.configuration.accessToken
    const _attioClient = new AttioApiClient(accessToken)

    const stateAttioIntegrationInfo = await client.getState({
      id: ctx.integrationId,
      name: 'attioIntegrationInfo',
      type: 'integration',
    })

    const { state } = stateAttioIntegrationInfo
    const { attioWebhookId } = state.payload

    if (attioWebhookId) {
      await _attioClient.deleteWebhook(attioWebhookId)
      logger.forBot().info('Webhook successfully deleted')
    }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new sdk.RuntimeError(error.message)
  }
}
