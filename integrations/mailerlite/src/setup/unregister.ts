import { getAuthenticatedMailerLiteClient } from 'src/utils'
import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx, client, logger }) => {
  const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client })
  const stateMailerLiteIntegrationInfo = await client.getState({
    id: ctx.integrationId,
    name: 'mailerLiteIntegrationInfo',
    type: 'integration',
  })

  const { state } = stateMailerLiteIntegrationInfo
  const { mailerLiteWebhookId } = state.payload

  if (mailerLiteWebhookId) {
    const response = await mlClient.webhooks.delete(mailerLiteWebhookId)
    if (response.status === 200 || response.status === 204) {
      logger.forBot().info('Webhook successfully deleted')
    }
  }
}
